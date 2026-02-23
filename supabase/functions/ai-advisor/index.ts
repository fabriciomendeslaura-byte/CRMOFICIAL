import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js';

Deno.serve(async (req: Request) => {
    try {
        const { action, payload } = await req.json();

        // Connect to the database to fetch the secret
        const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!);

        const [secret] = await sql`
      SELECT value FROM crm_secrets WHERE name = 'OPENAI_API_KEY' LIMIT 1
    `;

        const OPENAI_API_KEY = secret?.value;

        if (!OPENAI_API_KEY) {
            return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not found in crm_secrets' }), { status: 500 });
        }

        let messages = [];

        if (action === 'chat') {
            const { context, message, history, userName } = payload;
            const now = new Date();
            const currentDateTime = now.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
            const systemPrompt = `Bot: Omni-Sales. User: ${userName}. MISSION: Smart CRM Assistant. NOW: ${currentDateTime}. CONTEXT: ${context}. RULES: Be proactive, strategic and direct.`;

            messages = [
                { role: 'system', content: systemPrompt },
                ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
                { role: 'user', content: message }
            ];
        } else if (action === 'strategy') {
            const { leadName, company, value, notes } = payload;
            const systemPrompt = `Gere estratégia de vendas para: ${leadName} da empresa ${company}. Valor: R$ ${value}. Notas: ${notes}. Responda em markdown curto.`;
            messages = [{ role: 'system', content: systemPrompt }];
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages,
                max_tokens: action === 'chat' ? 400 : 300
            })
        });

        const data = await response.json();
        if (data.error) {
            return new Response(JSON.stringify({ error: data.error.message }), { status: 400 });
        }

        // Close the DB connection to avoid leak
        await sql.end();

        return new Response(JSON.stringify({ reply: data.choices[0].message.content }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
});
