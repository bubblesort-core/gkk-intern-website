// Gemini AI Resume Parser
// Uses Gemini 1.5 Flash to extract structured data from uploaded PDF resumes

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface ResumeData {
    full_name?: string;
    email?: string;
    phone?: string;
    whatsapp_number?: string;
    age?: string;
    sex?: string;
    college?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    interests?: string[];
}

// Convert a File to a base64 string (strips the data URI prefix)
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Strip "data:application/pdf;base64," prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const EXTRACTION_PROMPT = `You are an expert resume/CV parser with years of experience. Analyze this document and extract all candidate information.

CRITICAL NAME EXTRACTION:
- The candidate's full name is almost ALWAYS the LARGEST TEXT at the very TOP of the resume, before any section headers.
- It is typically styled as a title/heading — look for the biggest, boldest text on page 1.
- It will NOT be labeled "Name:" — it stands alone as the document title.
- Convert to proper Title Case (e.g. "DEBRAJ PRADHAN" → "Debraj Pradhan").

Return ONLY a valid JSON object with these exact keys (use empty string "" for missing text fields, empty array [] for missing interests):

{
  "full_name": "The candidate's full name from the top header of the resume, in Title Case",
  "email": "Email address",
  "phone": "Phone number (digits only, no country code prefix if Indian, e.g. 8910894306)",
  "whatsapp_number": "WhatsApp number if different from phone, otherwise same as phone",
  "age": "Age if mentioned, otherwise empty string",
  "sex": "Male or Female if determinable from photo or pronouns, otherwise empty string",
  "college": "College or university name",
  "linkedin_url": "Full LinkedIn profile URL",
  "github_url": "Full GitHub profile URL",
  "portfolio_url": "Full portfolio/personal website URL (not LinkedIn, GitHub, or Twitter/X)",
  "interests": ["Array of relevant skill areas from ONLY these options: UI/UX Design, Frontend Engineering, DevOps, Data Science, Product Management, Cybersecurity. Pick the ones that best match the candidate's skills/experience. You may also include up to 2 custom interests not in this list if strongly evident."]
}

IMPORTANT RULES:
- Return ONLY the JSON object, no markdown, no explanation, no code fences.
- For URLs, include the full URL with https:// prefix. Scan the ENTIRE document for profile links.
- For phone numbers, strip country codes like +91 and return just 10 digits.
- If a field cannot be determined from the resume, use "" for strings and [] for arrays.
- Do NOT invent or guess data that is not present in the document.`;

// --- Smart Rate Limiting ---
const RATE_LIMIT = {
    maxCallsPerSession: 3,      // Max AI parses per browser session
    cooldownMs: 120_000,        // 2 minutes minimum between calls (free tier is very strict)
};

let callCount = 0;
let lastCallTimestamp = 0;
let rateLimitedUntil = 0;        // If we get a 429, block calls until this timestamp

function checkRateLimit(): string | null {
    // If we've been rate-limited by Google, enforce a long cooldown
    if (rateLimitedUntil > Date.now()) {
        const waitSec = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
        return `AI service is cooling down. Please try again in ${waitSec}s.`;
    }
    if (callCount >= RATE_LIMIT.maxCallsPerSession) {
        return `You've used all ${RATE_LIMIT.maxCallsPerSession} AI scans for this session. Please fill in remaining details manually.`;
    }
    const elapsed = Date.now() - lastCallTimestamp;
    if (lastCallTimestamp > 0 && elapsed < RATE_LIMIT.cooldownMs) {
        const waitSec = Math.ceil((RATE_LIMIT.cooldownMs - elapsed) / 1000);
        return `Please wait ${waitSec}s before scanning another CV.`;
    }
    return null;
}

export async function analyzeResume(file: File): Promise<{ data: ResumeData | null; error: string | null }> {
    if (!GEMINI_API_KEY) {
        return { data: null, error: 'Gemini API key is not configured.' };
    }

    // Check rate limits before making API call
    const rateLimitError = checkRateLimit();
    if (rateLimitError) {
        return { data: null, error: rateLimitError };
    }

    try {
        const base64Data = await fileToBase64(file);
        const mimeType = file.type || 'application/pdf';

        const requestBody = {
            contents: [{
                parts: [
                    { text: EXTRACTION_PROMPT },
                    {
                        inlineData: {
                            mimeType,
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,  // Low temperature for precise extraction
                maxOutputTokens: 1024
            }
        };

        // Track usage BEFORE the call
        callCount++;
        lastCallTimestamp = Date.now();

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            if (response.status === 429) {
                // Block further attempts for 3 minutes to let quota recover
                rateLimitedUntil = Date.now() + 180_000;
                return { data: null, error: 'AI service is temporarily busy. Please try again in ~3 minutes.' };
            }
            const errorBody = await response.text();
            return { data: null, error: `Gemini API error (${response.status}): ${errorBody}` };
        }

        const result = await response.json();

        // Extract the text content from Gemini's response
        const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
            return { data: null, error: 'No response from Gemini AI.' };
        }

        // Clean up the response (strip markdown code fences if present)
        let cleanedText = textContent.trim();
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed: ResumeData = JSON.parse(cleanedText);

        // Sanitize: only keep fields we recognize
        const sanitized: ResumeData = {
            full_name: parsed.full_name || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            whatsapp_number: parsed.whatsapp_number || '',
            age: parsed.age || '',
            sex: parsed.sex || '',
            college: parsed.college || '',
            linkedin_url: parsed.linkedin_url || '',
            github_url: parsed.github_url || '',
            portfolio_url: parsed.portfolio_url || '',
            interests: Array.isArray(parsed.interests) ? parsed.interests : [],
        };

        return { data: sanitized, error: null };
    } catch (err) {
        return { data: null, error: err instanceof Error ? err.message : 'Unknown error parsing resume.' };
    }
}
