-- Create deleted@aplyio.com
DO $$
BEGIN  
  IF NOT EXISTS (SELECT 1 FROM "public"."User" WHERE "email" = 'deleted-account@aplyio.com') THEN  
    INSERT INTO
      "public"."User" (
        "email",
        "emailVerified",
        "password",
        "createdAt",
        "updatedAt",
        "lastSignedIn",
        "roles",
        "identityProvider",
        "twoFactorEnabled"
      )
    VALUES
      (
        'deleted-account@aplyio.com',
        NOW(),
        NULL,
        NOW(),
        NOW(),
        NOW(),
        ARRAY['USER'::TEXT]::"public"."Role" [],
        CAST('GOOGLE'::TEXT AS "public"."IdentityProvider"),
        FALSE
      );
  END IF;  
END $$
