import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST() {
    const personalKey = process.env.GARMIN_PERSONAL_KEY;

    if (!personalKey) {
      return NextResponse.json(
      { error: 'Nedostaje GARMIN_PERSONAL_KEY' },
        { status: 400 }
      );
    }

  // Koristimo /modern/proxy/ putanju koja je standard za web dashboard
  const url = 'https://connect.garmin.com/modern/proxy/activity-service/activity/activities?limit=20';
      try {
    console.log('Fetching from Garmin Modern Proxy...');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${personalKey}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Referer': 'https://connect.garmin.com/modern/',
        'Origin': 'https://connect.garmin.com',
        'Accept': 'application/json, text/plain, */*',
        'NK': 'NT'
      },
      cache: 'no-store'
    });

    const data = await response.json();
    console.log('Garmin Response Data:', JSON.stringify(data).substring(0, 500));

    if (Array.isArray(data) && data.length > 0) {
      for (const act of data) {
        // Obavezna provjera id-a
        const actId = act.activityId || act.id;
        if (!actId) continue;

        await supabase.from('activities').upsert({
          garmin_activity_id: actId.toString(),
          date: act.startTimeLocal ? act.startTimeLocal.split(' ')[0] : new Date().toISOString().split('T')[0],
          title: act.activityName || 'Trening',
          sport_type: act.activityType?.typeKey || 'generic',
          duration_minutes: Math.round((act.duration || 0) / 60),
          distance_km: act.distance ? (act.distance / 1000).toFixed(2) : 0,
          avg_power_watts: act.averagePower || 0,
          avg_hr: act.averageHR || 0,
          tss: act.tss || 0
        }, { onConflict: 'garmin_activity_id' });
      }
      return NextResponse.json({ success: true, count: data.length });
    }

    return NextResponse.json({ error: 'Nema zabilježenih aktivnosti', debug: data }, { status: 404 });
  } catch (err: any) {
    console.error('Sync Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export async function GET() {
  return POST();
}