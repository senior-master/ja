export default {
  async fetch(request, env) {
    // 1. Define complete CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // 2. Handle preflight (OPTIONS) requests
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // 3. Handle GET requests (for when you visit the link in a browser)
    if (request.method !== 'POST') {
      return new Response("Worker is running! Send a POST request with a JSON body.", { 
        headers: corsHeaders 
      });
    }

    try {
      const { prompt } = await request.json();
      
      const rawKeys = env.GEMINI_API_KEYS;
      if (!rawKeys) throw new Error("GEMINI_API_KEYS secret not configured in Cloudflare");

      const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      let responseText = "";
      let success = false;
      let lastError = "";
      const models = ["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"]; 

      for (const key of keys) {
        for (const model of models) {
          try {
            // Add a 10-second timeout to prevent Worker hangs
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                signal: controller.signal
              }
            );
            
            clearTimeout(timeoutId);

            const data = await response.json();
            if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
              responseText = data.candidates[0].content.parts[0].text;
              success = true;
              break;
            } else {
              lastError = data.error?.message || `API Error: ${response.status}`;
            }
          } catch (err) {
            lastError = err.name === 'AbortError' ? 'Request timed out' : err.message;
          }
        }
        if (success) break;
      }

      if (!success) throw new Error(`All keys failed. Last error: ${lastError}`);

      // Return success with CORS headers
      return new Response(JSON.stringify({ text: responseText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Return errors with CORS headers so the browser can read them
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};
