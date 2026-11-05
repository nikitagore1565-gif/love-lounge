const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };
export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  const { sessionId, profileId } = event.queryStringParameters || {};
  if (!sessionId || !/^p([1-9]|1[0-9]|20)$/.test(profileId || '')) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid session.' }) };
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { statusCode: 503, headers, body: JSON.stringify({ error: 'Backend setup is incomplete.' }) };
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/chat_messages?anonymous_session_id=eq.${encodeURIComponent(sessionId)}&profile_id=eq.${encodeURIComponent(profileId)}&select=role,content,created_at&order=created_at.asc&limit=100`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } });
  return { statusCode: res.status, headers, body: await res.text() };
}
