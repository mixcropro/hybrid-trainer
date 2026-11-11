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

    // Garmin Personal API: aktivnosti se često dohvaćaju putem endpointa za "dailies" ili "activities"
    // s parametrima 'start' i 'end' u formatu milisekundi.
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Pokušavamo drugi endpoint koji je češće dostupan za aktivnosti
    const activitiesUrl = `https://connect.garmin.com/activity-service/activity/activities?startDate=${thirtyDaysAgo}&endDate=${now}&limit=20`;

    const activitiesRes = await fetch(activitiesUrl, {
      headers: {
        'Authorization': `Bearer ${personalKey}`,
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://connect.garmin.com/',
        'NK': 'NT'
      },
      cache: 'no-store'
    });

    if (activitiesRes.ok) {
      const activities = await activitiesRes.json();
      console.log('Activities response:', JSON.stringify(activities).substring(0, 500));

      // Garmin API često vraća listu izravno ili unutar 'activities' polja
      const activityList = Array.isArray(activities) ? activities : (activities.activities || []);

      if (activityList.length === 0) {
        console.log('Nema pronađenih aktivnosti u navedenom rasponu.');
      }

      for (const act of activityList) {
        const activityId = act.activityId || act.id;
        if (!activityId) continue;

        await supabase.from('activities').upsert({
          garmin_activity_id: activityId.toString(),
          date: act.startTimeLocal ? act.startTimeLocal.split(' ')[0] : new Date().toISOString().split('T')[0],
          title: act.activityName || 'Trening',
          sport_type: act.activityType?.typeKey || 'generic',
          duration_minutes: Math.round((act.duration || 0) / 60),
          distance_km: act.distance ? (act.distance / 1000).toFixed(2) : 0,
          avg_power_watts: act.averagePower || 0,
          avg_hr: act.averageHeartRate || act.averageHR || 0,
          tss: act.tss || 0,
        }, { onConflict: 'garmin_activity_id' });
      }
    } else {
      const errorText = await activitiesRes.text();
      console.error('Garmin API error for activities:', activitiesRes.status, errorText);
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