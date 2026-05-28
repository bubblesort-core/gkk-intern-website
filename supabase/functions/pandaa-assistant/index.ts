import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCacheKey, redisGetJson, redisSetJson } from "../_shared/redis.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type AssistantRequest = {
    prompt: string;
    userName?: string;
    email?: string;
    mode?: 'chat' | 'refine';
};

type QueryRows = Array<{ rank?: number; instruction?: string; response?: string }>;
type StatusRows = Array<{ full_name?: string; status?: string; remark?: string }>;
type RpcError = { message: string; code?: string };
type RpcClient = Pick<ReturnType<typeof createClient>, 'rpc'>;

const DEFAULT_GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

const statusKeywords = ['status', 'application', 'apply', 'applied', 'my application', 'reviewed', 'shortlisted', 'selected'];
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function normalizeText(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeStatus(status?: string) {
    return (status || '').toLowerCase().replace(/[\s-]+/g, '_').trim();
}

function getStatusGuidance(status?: string) {
    const normalized = normalizeStatus(status);

    if (['approved', 'selected'].includes(normalized)) {
        return 'Congratulations. Your application is approved. Please check your dashboard and email for onboarding/payment instructions and complete them today.';
    }

    if (['shortlisted', 'ready_interview', 'interview_ready'].includes(normalized)) {
        return 'Great progress. Please monitor your email and dashboard for interview scheduling details and be ready with your updated resume and availability.';
    }

    if (['pending', 'under_review', 'reviewed'].includes(normalized)) {
        return 'Your application is still under review. No action is required right now; please keep checking your email for the next update.';
    }

    if (['rejected', 'not_selected'].includes(normalized)) {
        return 'Thank you for applying. You can improve your profile and portfolio and apply again in a future cycle.';
    }

    return 'Keep checking your email and dashboard for the latest updates on your application.';
}

function isStatusIntent(normalizedPrompt: string) {
    return statusKeywords.some((keyword) => normalizedPrompt.includes(keyword));
}

function isEmailOnlyFollowUp(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) return false;

    // Common continuation after bot asks for email: user sends only email or email + tiny filler.
    const hasEmail = emailRegex.test(trimmed);
    const words = trimmed.replace(emailRegex, '').replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    return hasEmail && words.length <= 4;
}

async function buildContext(supabaseClient: RpcClient, prompt: string, email?: string) {
    let dataContext = '';
    const normalizedPrompt = normalizeText(prompt);
    const shouldFetchStatus = isStatusIntent(normalizedPrompt) || isEmailOnlyFollowUp(prompt);

    // Check for status keywords and fetch application status if email provided
    if (shouldFetchStatus) {
        if (email) {
            try {
                const { data: status, error: statusError } = await supabaseClient.rpc('get_pandaa_application_status', { p_email: email }) as { 
                    data: StatusRows | null; 
                    error: RpcError | null 
                };

                if (statusError) {
                    console.error('[PANDAA] Status RPC Error:', statusError.message);
                    dataContext += `[STATUS_ERROR: Unable to fetch application status.] `;
                } else if (status && status.length > 0) {
                    dataContext += `[REAL_TIME_STATUS] Applicant: ${status[0].full_name || 'Applicant'}. Status: ${status[0].status || 'unknown'}. Remark: ${status[0].remark || 'No remarks'}. `;
                    dataContext += `[STATUS_NEXT_STEPS] ${getStatusGuidance(status[0].status)} `;
                    console.log('[PANDAA] Status found for:', email?.substring(0, 3) + '...');
                } else {
                    dataContext += `[NO_STATUS_FOUND: No record found for ${email}.] `;
                    console.log('[PANDAA] No status found for:', email?.substring(0, 3) + '...');
                }
            } catch (err) {
                console.error('[PANDAA] Status fetch exception:', err instanceof Error ? err.message : String(err));
                dataContext += `[STATUS_ERROR: Database query failed.] `;
            }
        } else {
            dataContext += '[MISSING_EMAIL: User should provide email for status check.] ';
        }
    }

    // Search knowledge base
    try {
        const { data: knowledgeMatch, error: knowledgeError } = await supabaseClient.rpc('search_pandaa_knowledge', { p_query: prompt }) as { 
            data: QueryRows | null; 
            error: RpcError | null 
        };
        if (knowledgeError) {
            console.error('[PANDAA] Knowledge search error:', knowledgeError.message);
        } else if (knowledgeMatch && knowledgeMatch.length > 0 && (knowledgeMatch[0].rank || 0) > 0.1) {
            dataContext += `[CORE_KNOWLEDGE_MATCH] Question: ${knowledgeMatch[0].instruction || ''}. Truthful Answer: ${knowledgeMatch[0].response || ''}. `;
            console.log('[PANDAA] Knowledge match found with rank:', knowledgeMatch[0].rank);
        }
    } catch (err) {
        console.error('[PANDAA] Knowledge search exception:', err instanceof Error ? err.message : String(err));
    }

    return dataContext;
}

function getGroqApiKey() {
    const key =
        Deno.env.get('GROQ_API_KEY') ||
        Deno.env.get('GROQ_APIKEY') ||
        Deno.env.get('VITE_GROQ_API_KEY') ||
        '';
    return key.trim();
}

function getGroqModelCandidates() {
    const configuredModel = (Deno.env.get('GROQ_MODEL') || '').trim();
    const candidates = configuredModel ? [configuredModel, ...DEFAULT_GROQ_MODELS] : [...DEFAULT_GROQ_MODELS];
    return [...new Set(candidates.filter(Boolean))];
}

type GroqMessageContentPart = { text?: string };
type GroqChoice = { message?: { content?: string | GroqMessageContentPart[] } };
type GroqResponse = { choices?: GroqChoice[] };

function extractGroqText(data: unknown) {
    const typed = (typeof data === 'object' && data !== null ? data : {}) as GroqResponse;
    const content = typed.choices?.[0]?.message?.content;

    if (typeof content === 'string' && content.trim()) {
        return content.trim();
    }

    if (Array.isArray(content)) {
        const joined = content
            .map((item) => (typeof item?.text === 'string' ? item.text : ''))
            .join('')
            .trim();
        if (joined) return joined;
    }

    return null;
}

function buildSystemPrompt(userName: string, dataContext: string, mode: 'chat' | 'refine') {
    if (mode === 'refine') {
        return 'Refine this professional inquiry to be impressive and formal. Return ONLY the improved text.';
    }

    return `You are PANDAA, GKK INTERN Assistant. User: ${userName}. 
INTERNAL CONTEXT (Do not mention these tags to the user):
${dataContext || '[GENERAL_INQUIRY]'}

If [MISSING_EMAIL] is indicated, politely ask the user for the Gmail address they used to apply so you can check their real-time status.
If [CORE_KNOWLEDGE_MATCH] is provided, use it as the absolute truth.
If [REAL_TIME_STATUS] is provided, report the status.
If [STATUS_NEXT_STEPS] is provided, include it naturally as a short, friendly next-step line.
If [NO_STATUS_FOUND] is indicated, explain that you couldn't find an application for that email and suggest they verify it.
FEE_RULE: If asked about fees, strictly state: "There are minimal fees for profile hosting and server provision."
For general knowledge questions unrelated to application status, answer directly and clearly.
If context tags are absent, still answer the user's exact question helpfully instead of giving generic onboarding text.
Be brief, professional, and conversational (not robotic).`;
}

async function fetchGroqReply(systemPrompt: string, prompt: string) {
    const groqKey = getGroqApiKey();
    if (!groqKey) {
        throw new Error('GROQ_API_KEY is not configured in Supabase secrets');
    }

    const candidateModels = getGroqModelCandidates();
    let lastErrorMessage = 'Groq request failed';

    try {
        for (const model of candidateModels) {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${groqKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                }),
                signal: AbortSignal.timeout(25000),
            });

            if (!response.ok) {
                const body = await response.text();
                const statusCode = response.status;
                const compactBody = body.substring(0, 300);
                console.error(`[PANDAA] Groq API error ${statusCode} (model: ${model}):`, compactBody);

                if (statusCode === 401 || statusCode === 403) {
                    throw new Error('Groq authentication failed. Verify GROQ_API_KEY in Supabase secrets.');
                }

                if (statusCode === 429) {
                    throw new Error('Groq rate limit reached. Please retry in a few moments.');
                }

                // Model-specific failures should try the next fallback model.
                if (statusCode === 400 || statusCode === 404 || statusCode === 422) {
                    lastErrorMessage = `Groq model ${model} unavailable`; // Continue with next model.
                    continue;
                }

                throw new Error(`Groq API failed with status ${statusCode}`);
            }

            const data = await response.json();
            const responseText = extractGroqText(data);

            if (!responseText) {
                console.warn(`[PANDAA] Groq returned empty response for model ${model}:`, JSON.stringify(data).substring(0, 200));
                lastErrorMessage = `Groq returned empty response for model ${model}`;
                continue;
            }

            return responseText;
        }

        throw new Error(lastErrorMessage || 'Groq request failed for all models');
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[PANDAA] Groq fetch exception:', message);
        throw err;
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
        });
    }

    try {
        const body = await req.json() as AssistantRequest;
        const prompt = body.prompt?.trim();
        const userName = body.userName?.trim() || 'Intern';
        const email = body.email?.trim() || '';
        const mode = body.mode === 'refine' ? 'refine' : 'chat';

        // Validate request
        if (!prompt) {
            console.warn('[PANDAA] Invalid request: prompt is empty');
            throw new Error('Prompt is required');
        }

        if (prompt.length > 5000) {
            console.warn('[PANDAA] Invalid request: prompt too long');
            throw new Error('Prompt too long (max 5000 characters)');
        }

        console.log(`[PANDAA] Processing ${mode} request from ${userName}`);

        const cacheKey = await createCacheKey('pandaa-assistant', [
            mode,
            normalizeText(userName),
            normalizeText(email),
            normalizeText(prompt),
        ]);

        const cached = await redisGetJson<{ response: string }>(cacheKey);
        if (cached?.response) {
                        console.log('[PANDAA] Cache hit');
            return new Response(JSON.stringify({ success: true, cached: true, response: cached.response }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log('[PANDAA] Cache miss, querying database and AI');

        // Initialize Supabase client with SERVICE_ROLE_KEY (server-side only)
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('[PANDAA] Missing Supabase configuration');
            throw new Error('Server configuration error: Supabase not configured');
        }

        const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
            global: {
                headers: { Authorization: `Bearer ${serviceRoleKey}` },
            },
        });

        const dataContext = mode === 'chat' ? await buildContext(supabaseClient, prompt, email || undefined) : '';
        const responseText = await fetchGroqReply(buildSystemPrompt(userName, dataContext, mode), prompt);

        // Cache the response

        const ttlSeconds = mode === 'refine' ? 3600 : (dataContext.includes('[REAL_TIME_STATUS]') ? 60 : 300);
        try {
            await redisSetJson(cacheKey, { response: responseText }, ttlSeconds);
            console.log('[PANDAA] Response cached with TTL:', ttlSeconds);
        } catch (cacheErr) {
            // Non-critical: log but don't fail
            console.warn('[PANDAA] Cache write failed (non-critical):', cacheErr instanceof Error ? cacheErr.message : String(cacheErr));
        }
    console.log('[PANDAA] Request successful');

        return new Response(JSON.stringify({ success: true, cached: false, response: responseText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        const isError = error instanceof Error;
        const message = isError ? error.message : 'Unknown error';
        const stack = isError ? error.stack : '';

        console.error('[PANDAA] Fatal error:', message);
        if (stack) console.error('[PANDAA] Stack:', stack.substring(0, 500));

        // Don't expose internal errors to client
        const clientMessage =
            error instanceof Error &&
            (error.message.includes('Prompt') ||
                error.message.includes('Groq') ||
                error.message.includes('GROQ_API_KEY') ||
                error.message.includes('rate limit'))
                ? error.message
                : 'Unable to process your request. Please try again later.';

        return new Response(JSON.stringify({ success: false, error: clientMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
