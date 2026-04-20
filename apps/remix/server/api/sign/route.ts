import { Hono } from 'hono';

import { NEXT_PRIVATE_INTERNAL_WEBAPP_URL } from '@documenso/lib/constants/app';

import type { HonoEnv } from '../../router';

/**
 * GET /api/sign?template=TEMPLATE_ID&name=John+Doe&email=john@example.com&token=API_TOKEN
 *
 * Creates a document from a template with prefilled fields,
 * then redirects the signer directly to the signing page.
 *
 * Query params:
 *   - template (required): Template ID
 *   - name (required): Signer's full name
 *   - email (required): Signer's email
 *   - token (required): API token for authentication
 *   - address (optional): Fills TEXT fields labeled "Address"
 *   - date (optional): Fills all DATE fields
 *   - redirect (optional): "false" to return JSON instead of redirecting
 *   - field_<FIELD_ID>=<value>: Prefill a specific field by its numeric ID
 */
export const signRoute = new Hono<HonoEnv>()
  .use('*', async (c, next) => {
    await next();
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Cross-Origin-Resource-Policy', 'cross-origin');
    c.header('Cross-Origin-Embedder-Policy', 'credentialless');
  })
  .get('/', async (c) => {
  const url = new URL(c.req.url);
  const params = url.searchParams;

  const templateId = params.get('template');
  const name = params.get('name');
  const email = params.get('email');
  const address = params.get('address');
  const date = params.get('date');
  const shouldRedirect = params.get('redirect') !== 'false';
  const apiToken = params.get('token');

  if (!templateId || !name || !email) {
    return c.json(
      {
        error: 'Missing required params: template, name, email',
        usage:
          'GET /api/sign?template=TEMPLATE_ID&name=John+Doe&email=john@example.com&token=API_TOKEN',
      },
      400,
    );
  }

  if (!apiToken) {
    return c.json({ error: 'Missing required param: token (API token)' }, 401);
  }

  const baseUrl = NEXT_PRIVATE_INTERNAL_WEBAPP_URL();
  const headers = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Fetch the template to discover fields and recipient IDs
    const templateRes = await fetch(`${baseUrl}/api/v1/templates/${templateId}`, { headers });

    if (!templateRes.ok) {
      const err = await templateRes.text();
      return c.json({ error: 'Failed to fetch template', details: err }, templateRes.status as 400);
    }

    const template = (await templateRes.json()) as {
      Field?: Array<{
        id: number;
        secondaryId?: string;
        type: string;
        fieldMeta?: { label?: string; type?: string };
      }>;
      fields?: Array<{
        id: number;
        secondaryId?: string;
        type: string;
        fieldMeta?: { label?: string; type?: string };
      }>;
      Recipient?: Array<{ id: number; role: string }>;
      recipients?: Array<{ id: number; role: string }>;
    };

    const fields = template.Field || template.fields || [];
    const recipients = template.Recipient || template.recipients || [];

    const signerRecipient = recipients.find((r) => r.role === 'SIGNER');
    if (!signerRecipient) {
      return c.json({ error: 'Template has no SIGNER recipient' }, 400);
    }

    // 2. Build prefill fields
    const fieldTypeToPrefillType: Record<string, string> = {
      TEXT: 'text',
      DATE: 'date',
      NUMBER: 'number',
    };

    const prefillMap = new Map<number, { type: string; value: string }>();

    for (const field of fields) {
      const prefillType = fieldTypeToPrefillType[field.type];
      if (!prefillType) continue;

      const label = field.fieldMeta?.label?.toLowerCase() || '';

      switch (field.type) {
        case 'DATE':
          if (date) {
            prefillMap.set(field.id, { type: prefillType, value: date });
          }
          break;
        case 'TEXT':
          if (label === 'address' && address) {
            prefillMap.set(field.id, { type: prefillType, value: address });
          }
          break;
      }
    }

    // Allow explicit field_<ID>=value overrides
    for (const [key, value] of params.entries()) {
      if (!key.startsWith('field_')) continue;

      const fieldIdStr = key.slice(6);
      const matchedField = fields.find(
        (f) => String(f.id) === fieldIdStr || f.secondaryId === fieldIdStr,
      );

      if (matchedField) {
        const prefillType = fieldTypeToPrefillType[matchedField.type] || 'text';
        prefillMap.set(matchedField.id, { type: prefillType, value });
      }
    }

    const prefillFields = Array.from(prefillMap.entries()).map(([id, { type, value }]) => ({
      id,
      type,
      value,
    }));

    // 3. Generate document from template
    const generateRes = await fetch(
      `${baseUrl}/api/v1/templates/${templateId}/generate-document`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipients: [
            {
              id: signerRecipient.id,
              name,
              email,
              role: 'SIGNER',
            },
          ],
          prefillFields,
        }),
      },
    );

    if (!generateRes.ok) {
      const err = await generateRes.text();
      return c.json(
        { error: 'Failed to generate document', details: err },
        generateRes.status as 400,
      );
    }

    const result = (await generateRes.json()) as {
      documentId: number;
      recipients: Array<{
        recipientId: number;
        name: string;
        email: string;
        role: string;
        signingUrl: string;
      }>;
    };

    // 4. Send the document (moves from DRAFT to PENDING so signing page works)
    const sendRes = await fetch(`${baseUrl}/api/v1/documents/${result.documentId}/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sendEmail: false }),
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      return c.json(
        { error: 'Failed to send document', details: err },
        sendRes.status as 400,
      );
    }

    // 5. Find the signer's signing URL
    const signer = result.recipients?.find(
      (r) => r.email.toLowerCase() === email.toLowerCase(),
    );

    const signingUrl = signer?.signingUrl;

    if (shouldRedirect && signingUrl) {
      return c.redirect(signingUrl);
    }

    return c.json({
      documentId: result.documentId,
      signingUrl,
      recipients: result.recipients,
    });
  } catch (error) {
    console.error('Failed to create signing document:', error);
    return c.json(
      {
        error: 'Failed to create document',
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
