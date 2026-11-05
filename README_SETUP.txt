LOVE LOUNGE — TEXT CHAT FIX (GEMINI + SUPABASE)
================================================

This package switches TEXT CHAT from OpenAI to Google's Gemini API. It keeps Supabase for saved chat history. The old OPENAI_API_KEY is no longer needed for TEXT CHAT.

NETLIFY ENVIRONMENT VARIABLES (Production)
1. GEMINI_API_KEY = your Google AI Studio API key (mark as secret)
2. SUPABASE_URL = https://qsxbidhioscgiplbhssb.supabase.co
3. SUPABASE_SERVICE_ROLE_KEY = your Supabase service-role/secret key (mark as secret)

Optional:
GEMINI_MODEL = gemini-2.5-flash-lite

Do not put any secret key in index.html or share it in chat.

SUPABASE
The existing public.chat_messages table must exist with these columns:
id, anonymous_session_id, profile_id, role, content, created_at
The SQL file in this folder creates the table and index if they do not exist. If you already ran the SQL successfully, do not run it again unless needed.

DEPLOY
1. Extract this ZIP.
2. Upload the extracted love-lounge-netlify folder to Netlify manual deploy. At the folder's top level you must see index.html, netlify.toml, and netlify/functions/.
3. In Netlify > Site configuration > Environment variables, add GEMINI_API_KEY. Confirm the two Supabase variables are also present in the Production context.
4. Trigger a fresh deploy after adding/changing environment variables.
5. Open the site and send a chat message to a profile.

TEST
GET https://YOUR-SITE/.netlify/functions/chat will return 405 by design. That is normal; chat requires POST from the website.

If chat fails, the website now displays a more useful error message. Netlify > Functions > chat > Logs contains the server-side diagnostic. Never share API keys.

NOTES
- Gemini free tier has usage limits and Google may use free-tier content to improve its products. Check current official terms/pricing.
- Supabase remains responsible for chat history. The browser session is anonymous and history is device/browser-specific.
- This package fixes TEXT CHAT only. Voice still points to the separate OpenAI Realtime implementation and is not converted by this package.
- There are 20 profiles in the supplied HTML.
