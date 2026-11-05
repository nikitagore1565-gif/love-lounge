LOVE LOUNGE — NETLIFY BACKEND STARTER

Included:
- index.html: your supplied Love Lounge page with real chat wired to /.netlify/functions/chat
- netlify/functions/chat.mjs: secure server-side OpenAI chat function
- netlify.toml: Netlify publish/functions configuration

DEPLOY
1. Extract this ZIP.
2. Upload the extracted folder to a GitHub repository (recommended) and import that repository into Netlify.
3. In Netlify: Site configuration > Environment variables, add:
   OPENAI_API_KEY = your secret OpenAI API key
4. Deploy the site.
5. Open the deployed site and test Chat.

IMPORTANT
- Never put the OpenAI API key in index.html or any browser JavaScript.
- This first version stores chat history in the user's browser (localStorage), not in a cloud database. History is available on that same browser/device only.
- Admin photo changes remain browser/device-local in this version. Cloud photo storage and secure admin controls are a separate next step.
- Voice button remains the existing browser text-to-speech demo; real two-way voice needs an additional voice service integration.
- Add rate limiting / abuse protection before public launch to prevent unexpected API usage.
