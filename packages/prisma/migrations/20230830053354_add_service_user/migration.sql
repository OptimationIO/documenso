INSERT INTO "User" ("email", "name") VALUES (
  'serviceaccount@aplyio.com',
  'Service Account'
) ON CONFLICT DO NOTHING;
