const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST to send a chat message.' });

  try {
    const body = JSON.parse(event.body || '{}');
    const sessionId = String(body.sessionId || '').trim();
    const profileId = String(body.profileId || '').trim();
    const profileName = String(body.profileName || 'Your companion').slice(0, 80);
    const personality = String(body.personality || 'friendly and warm').slice(0, 500);
    const language = String(body.language || 'en');
    const message = String(body.message || '').trim();

    if (!sessionId || sessionId.length > 160 || !/^p([1-9]|1[0-9]|20)$/.test(profileId) || !message) {
      return json(400, { error: 'Chat details missing or invalid. Please refresh and try again.' });
    }
    if (message.length > 4000) return json(413, { error: 'Message is too long. Please keep it under 4,000 characters.' });

    const { GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!GEMINI_API_KEY) return json(503, { error: 'Gemini API key is missing. Add GEMINI_API_KEY in Netlify environment variables, then redeploy.' });
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(503, { error: 'Supabase setup is incomplete. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify.' });
    }

    const base = SUPABASE_URL.replace(/\/$/, '');
    const dbHeaders = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    };
    const historyUrl = `${base}/rest/v1/chat_messages?anonymous_session_id=eq.${encodeURIComponent(sessionId)}&profile_id=eq.${encodeURIComponent(profileId)}&select=role,content&order=created_at.desc&limit=16`;
    const historyRes = await fetch(historyUrl, { headers: dbHeaders });
    if (!historyRes.ok) {
      console.error('Supabase history request failed:', historyRes.status, await historyRes.text());
      return json(502, { error: 'Chat history database error. Check the Supabase table and service-role key.' });
    }
    const history = (await historyRes.json()).reverse();
    const langName = ({ en: 'English', hi: 'Hindi', mr: 'Marathi' })[language] || 'English';
    const systemText = `You are ${profileName}, a fictional adult Indian chat companion aged 21+. Personality: ${personality}. Speak naturally and warmly in ${langName}. You are a fictional character; never claim to be a real human or to meet the user. Do not request money, passwords, OTPs, or sensitive personal data. Keep replies conversational, affectionate but respectful, and concise (usually 1-4 sentences). Do not mention being an AI unless directly asked.`;
    const contents = [
      ...history.map(row => ({ role: row.role === 'assistant' ? 'model' : 'user', parts: [{ text: row.content }] })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig: { temperature: 0.85, maxOutputTokens: 250 }
      })
    });
    const aiData = await aiRes.json().catch(() => ({}));
    if (!aiRes.ok) {
      console.error('Gemini API request failed:', aiRes.status, JSON.stringify(aiData).slice(0, 1200));
      if (aiRes.status === 400 || aiRes.status === 403) return json(502, { error: 'Gemini rejected the API key or request. Check that the key is valid and Gemini API is enabled in Google AI Studio.' });
      if (aiRes.status === 429) return json(429, { error: 'Gemini free-tier request limit reached. Please wait a little and try again.' });
      return json(502, { error: 'Gemini chat service is temporarily unavailable. Please try again shortly.' });
    }
    const reply = (aiData.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('').trim();
    if (!reply) return json(502, { error: 'Gemini returned an empty reply. Please send your message again.' });

    const saveRes = await fetch(`${base}/rest/v1/chat_messages`, {
      method: 'POST',
      headers: { ...dbHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify([
        { anonymous_session_id: sessionId, profile_id: profileId, role: 'user', content: message },
        { anonymous_session_id: sessionId, profile_id: profileId, role: 'assistant', content: reply }
      ])
    });
    if (!saveRes.ok) {
      console.error('Supabase save request failed:', saveRes.status, await saveRes.text());
      return json(502, { error: 'Reply was generated, but chat history could not be saved. Check the Supabase table permissions and columns.' });
    }
    return json(200, { reply });
  } catch (error) {
    console.error('Chat function error:', error);
    return json(500, { error: 'Server error in chat function. Check the Netlify function logs.' });
  }
}
