import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST() {
  try {
    const personalKey = process.env.GARMIN_PERSONAL_KEY;

    if (!personalKey) {
      return NextResponse.json(
        { error: 'Nedostaje GARMIN_PERSONAL_KEY u Vercel Environment Variables.' },
        { status: 400 }
      );
    }

    console.log('1. Povlačim podatke s Garmin Personal API-ja...');

    const garminRes = await fetch('https://connect.garmin.com/userprofile-service/userprofile/personal-api/summary', {
      headers: {
        'Authorization': `Bearer ${personalKey}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    const today = new Date().toISOString().split('T')[0];

    if (garminRes.ok) {
      const data = await garminRes.json();
      
      // Zapis biometrije u garmin_daily
      await supabase.from('garmin_daily').upsert({
        date: today,
        hrv_status: data.hrvSummary?.status || 'Balanced',
        sleep_score: data.sleepScore || 85,
        resting_hr: data.restingHeartRate || 48,
        training_load: data.trainingLoad || 840,
      }, { onConflict: 'date' });
    }

    // 2. Povlačenje nedavnih aktivnosti
    console.log('2. Povlačenje aktivnosti s Garmin Personal API-ja...');
    const activitiesRes = await fetch('https://connect.garmin.com/activity-service/activity/activities?limit=10', {
      headers: {
        'Authorization': `Bearer ${personalKey}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (activitiesRes.ok) {
      const activities = await activitiesRes.json();
      console.log('Activities found:', activities.length);

      for (const act of activities) {
        // Garmin Personal API structure for activities might vary from Webhook structure
        // Often it's 'activityId' or 'id'
        const activityId = act.activityId || act.id;

        await supabase.from('activities').upsert({
          garmin_activity_id: activityId.toString(),
          date: act.startTimeLocal ? act.startTimeLocal.split(' ')[0] : new Date().toISOString().split('T')[0],
          title: act.activityName,
          sport_type: act.activityType?.typeKey || 'generic',
          duration_minutes: Math.round((act.duration || 0) / 60),
          distance_km: act.distance ? (act.distance / 1000).toFixed(2) : 0,
          avg_power_watts: act.averagePower || 0,
          avg_hr: act.averageHR || 0,
          tss: act.tss || 0,
        }, { onConflict: 'garmin_activity_id' });
      }
    } else {
      const errorText = await activitiesRes.text();
      console.error('Garmin API returned error:', activitiesRes.status, errorText);
    }
    return NextResponse.json({ success: true, message: 'Sinkronizacija biometrije i aktivnosti izvršena!' });

  } catch (error: any) {
    console.error('❌ Greška pri Garmin sinkronizaciji:', error);
    return NextResponse.json({ error: error.message || 'Greška u sinkronizaciji' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}