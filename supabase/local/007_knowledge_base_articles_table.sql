-- knowledge.repository.ts is called from ai.controller.ts and ai.service.ts
-- (both live-routed under /ai) to search for knowledge-base articles as
-- context for an AI support chat response — but knowledge_base_articles
-- never existed, confirmed absent from the live schema dump. The closest
-- real table, faq_kb (category/question/answer with a fixed category enum),
-- is a different, narrower shape and not a substitute for this CMS-style
-- article store (title/content/tags/status). Created per types/ai.ts's
-- already-specified KnowledgeArticle shape.

CREATE TABLE IF NOT EXISTS public.knowledge_base_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
