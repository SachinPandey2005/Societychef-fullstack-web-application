-- admin_notes is actively used by live CRM routes (crm.controller.ts,
-- crm.service.ts, crm.schema.ts validator) but confirmed absent from the
-- live database — every createAdminNote/getNotesForEntity call would have
-- failed outright. Simple, well-specified (see types/crm.ts's AdminNote),
-- so created here rather than left broken.

CREATE TABLE IF NOT EXISTS public.admin_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('CUSTOMER', 'CHEF', 'ORDER', 'PARTNER')),
    entity_id TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_entity ON public.admin_notes(entity_type, entity_id);
