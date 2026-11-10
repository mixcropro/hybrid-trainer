import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Službeni Garmin Webhook Endpoint
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Garmin šalje obavijest o novim aktivnostima (Activities Push)
    if (body.activities) {
      for (const act of body.activities) {
        await supabase.from('activities').upsert({
          garmin_activity_id: act.activityId,
          date: act.startTimeLocal ? act.startTimeLocal.split(' ')[0] : new Date().toISOString().split('T')[0],
          sport_type: mapGarminSport(act.activityType),
          raw_garmin_type: act.activityType,
          title: act.activityName || 'Garmin Trening',
          duration_minutes: Math.round((act.durationInSeconds || 0) / 60),
          distance_km: act.distanceInMeters ? Number((act.distanceInMeters / 1000).toFixed(2)) : null,
          avg_power_watts: act.averagePowerWatts || null,
          avg_hr: act.averageHeartRateInBeatsPerMinute || null,
          max_hr: act.maxHeartRateInBeatsPerMinute || null,
          calories: act.activeKilocalories || null,
          tss: act.trainingStressScore || Math.round((act.durationInSeconds / 60) * 0.8),
        }, { onConflict: 'garmin_activity_id' });
      }
    }

    // 2. Garmin šalje obavijest o dnevnom zdravlju i oporavku (Dailies / Sleep / HRV Push)
    if (body.dailies || body.sleeps || body.hrv) {
      const today = new Date().toISOString().split('T')[0];
      const dailyData = body.dailies?.[0] || {};
      const sleepData = body.sleeps?.[0] || {};
      const hrvData = body.hrv?.[0] || {};

      await supabase.from('garmin_daily').upsert({
        date: dailyData.calendarDate || today,
        hrv_status: hrvData.hrvSummary?.status || 'Balanced',
        sleep_score: sleepData.sleepScores?.overall?.value || 80,
        resting_hr: dailyData.restingHeartRateInBeatsPerMinute || 50,
        training_load: dailyData.userBodyBattery || 85,
      }, { onConflict: 'date' });
    }

    // Garmin API zahtijeva HTTP 200 OK odgovor kako bi potvrdio da je obavijest primljena
    return NextResponse.json({ status: 'SUCCESS' }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Greška na Garmin Webhooku:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Pomoćna funkcija za mapiranje Garmin tipova sportova
function mapGarminSport(type: string = ''): string {
  const t = type.toLowerCase();
  if (t.includes('run')) return 'run';
  if (t.includes('cyc') || t.includes('bike')) return 'bike';
  if (t.includes('swim')) return 'swim';
  if (t.includes('strength')) return 'strength';
  if (t.includes('walk') || t.includes('hike')) return 'walk';
  return 'other';
}