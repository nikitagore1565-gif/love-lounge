const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

// Creates a short-lived Realtime client secret. The permanent API key stays on Netlify.
export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const { OPENAI_API_KEY } = process.env;
    if (!OPENAI_API_KEY) return json(503, { error: 'OPENAI_API_KEY is not configured in Netlify.' });

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON body.' }); }

    const allowedLanguages = { en: 'English', hi: 'Hindi', mr: 'Marathi' };
    const language = allowedLanguages[body.language] ? body.language : 'en';
    const languageName = allowedLanguages[language];
    const profileName = String(body.profileName || 'Aarohi').slice(0, 60);
    const personality = String(body.personality || 'warm, caring, playful and respectful').slice(0, 500);
    const voice = /^[a-zA-Z0-9_-]{1,32}$/.test(body.voice || '') ? body.voice : 'marin';

    const instructions = `You are ${profileName}, a fictional adult Indian companion character (age 21+). Personality: ${personality}. Speak naturally and warmly in ${languageName}. Listen carefully, respond with empathy, and keep replies conversational. Do not talk over the user; allow natural pauses and interruptions. You are fictional and must not claim to be a real human or promise an in-person meeting. Never ask for passwords, OTPs, payment details, or sensitive personal information. Do not pressure the user for money.`;

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1',
          instructions,
          audio: {
            input: { turn_detection: { type: 'semantic_vad', create_response: true, interrupt_response: true } },
            output: { voice }
          }
        }
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Realtime client secret error:', data);
      return json(response.status, { error: data.error?.message || 'Could not create Realtime session.' });
    }

    const secret = data.value || data.client_secret?.value;
    if (!secret) return json(502, { error: 'Realtime API did not return a client secret.' });
    return json(200, { client_secret: secret, expires_at: data.expires_at || data.client_secret?.expires_at || null, model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1' });
  } catch (error) {
    console.error('voice-token failure:', error);
    return json(500, { error: 'Unable to create voice session.' });
  }
}
