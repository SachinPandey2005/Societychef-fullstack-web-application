-- ai.repository.ts's three tables (ai_ticket_analysis, ai_usage_logs,
-- ai_messages) never existed, confirmed absent from the live schema dump.
-- Severity check: ai_provider.service.ts's MockAIProvider.generateText calls
-- AIRepository.logUsage unconditionally, which throws on a missing table;
-- that's caught by a retry loop that retries twice, fails identically each
-- time, then re-throws — meaning ai.service.ts#handleChatPrompt (the live
-- AI support chat endpoint) has failed on literally every call, even though
-- it's just a mock/demo provider under the hood. All three tables created
-- per the fully-specified shapes already in types/ai.ts.

CREATE TABLE IF NOT EXISTS public.ai_ticket_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    suggested_priority TEXT NOT NULL CHECK (suggested_priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    suggested_category TEXT NOT NULL,
    suggested_reply TEXT NOT NULL,
    sentiment TEXT NOT NULL CHECK (sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
    is_applied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_session_id ON public.ai_messages(session_id);

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    action TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
