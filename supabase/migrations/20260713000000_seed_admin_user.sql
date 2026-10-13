-- Seed default admin user (admin@homechef.com / admin123)
-- This creates the user in the auth schema and the public.profiles schema.

DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    encrypted_pw text;
BEGIN
    -- Only create if the user does not exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@homechef.com') THEN
        -- Generate encrypted password for 'admin123'
        -- Note: using pgcrypto for crypt
        encrypted_pw := crypt('admin123', gen_salt('bf'));

        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin@homechef.com',
            encrypted_pw,
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        );

        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            new_user_id,
            format('{"sub":"%s","email":"%s"}', new_user_id::text, 'admin@homechef.com')::jsonb,
            'email',
            now(),
            now(),
            now()
        );

        -- Insert into public.profiles
        INSERT INTO public.profiles (
            id,
            name,
            email,
            role,
            status,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            'Super Admin',
            'admin@homechef.com',
            'super_admin',
            'active',
            now(),
            now()
        );
    END IF;
END $$;
