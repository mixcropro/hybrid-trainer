import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Nedostaje GEMINI_API_KEY u .env.local' }, { status: 500 });
    }

    // 1. Povlačenje profila, biometrije i dugoročne memorije
    const { data: profile } = await supabase.from('user_profile').select('*').limit(1).maybeSingle();
    const { data: garminData } = await supabase.from('garmin_daily').select('*').order('date', { ascending: false }).limit(1).maybeSingle();
    const { data: pastActivities } = await supabase.from('activities').select('*').order('date', { ascending: false }).limit(10);
    const { data: memories } = await supabase.from('user_memory').select('fact');

    // 2. Povlačenje zadnjih 10 poruka iz povijesti chata (Short-Term Memory)
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedHistory = history ? history.reverse() : [];

    // 3. Izračun modela zamora (Banister Model)
    let atl = 0, ctl = 0;
    if (pastActivities && pastActivities.length > 0) {
      const recent7 = pastActivities.filter(a => (new Date().getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24) <= 7);
      atl = Math.round(recent7.reduce((sum, a) => sum + (a.tss || 0), 0) / 7);
      ctl = Math.round(pastActivities.reduce((sum, a) => sum + (a.tss || 0), 0) / 14);
    }
    const tsb = ctl - atl;

    // 4. Slaganje Sistemskog Prompta s potpunim znanjem
    const memoryText = memories ? memories.map(m => `- ${m.fact}`).join('\n') : 'Nema dodatnih bilješki.';

    const systemPrompt = `
Ti si ekspertni Hibridni AI Trener za triatlon i trening snage.
Zadržavaš potpunu memoriju i kontekst svih proslih razgovora.

[DUGOROČNA MEMORIJA I ČINJENICE O SPORTAŠU]
${memoryText}

[PARAMETRI SPORTAŠA & STATISTIKA]
- FTP: ${profile?.ftp_watts || 250}W | LTHR: ${profile?.lthr_bpm || 168}bpm
- Max HR: ${profile?.max_hr || 188} | Max tjedno trčanje: ${profile?.max_weekly_running_km || 50}km
- CSS Swim Tempo: ${profile?.css_swim_tempo || '1:45'} | Proteini: ${profile?.daily_protein_target_g || 180}g/dan
- Akutni umor (ATL 7d): ${atl} TSS/dan | Fitness (CTL 14d): ${ctl} TSS/dan | Forma (TSB): ${tsb}
- HRV Status: ${garminData?.hrv_status || 'Balanced'} | San: ${garminData?.sleep_score || 80}/100
- Aktivne ozljede: ${profile?.active_injuries || 'Nema'}

Odgovaraj izravno, tehnički precizno, uvažavajući sve prošle dogovore, bilješke i fiziološka ograničenja.
Zadrži fokus na triatlonu uz uključene dane za trening snage: ${profile?.preferred_gym_days?.join(', ') || 'Ponedjeljak, Srijeda, Petak'}.
`;

    // 5. Priprema razgovora za Gemini (Sistemski prompt + Povijest + Nova poruka)
    const contentsPayload = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...formattedHistory.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    // 6. Slanje upita na API
    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];
    let replyText = '';

    for (const modelId of candidateModels) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const apiRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ contents: contentsPayload })
        });

        clearTimeout(timeoutId);

        if (apiRes.ok) {
          const data = await apiRes.json();
          replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (replyText) break;
        }
      } catch (e) {}
    }

    if (!replyText) {
      return NextResponse.json({ error: 'Modeli nisu dostupni' }, { status: 500 });
    }

    // 7. Trajno spremanje poruke i odgovora u Supabase chat povijest
    await supabase.from('chat_messages').insert([
      { role: 'user', content: message },
      { role: 'assistant', content: replyText }
    ]);

    return NextResponse.json({ reply: replyText, metrics: { atl, ctl, tsb } });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}