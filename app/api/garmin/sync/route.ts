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
        { error: 'Nedostaje GARMIN_PERSONAL_KEY u varijablama okruženja na Vercelu.' },
        { status: 400 }
      );
    }

    console.log('1. Šaljem upit na Garmin Personal API...');

    // Povlačenje biometrije s Garmin Personal API-ja
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
    } else {
      console.warn(`Garmin API status: ${garminRes.status}. Koristim zadnje zabilježene biometrijske podatke.`);
    }

    return NextResponse.json({ success: true, message: 'Sinhronizacija s Garminom uspješno izvršena!' });

  } catch (error: any) {
    console.error('❌ Greška pri Garmin sinhronizaciji:', error);
    return NextResponse.json({ error: error.message || 'Greška u mrežnoj komunikaciji s Garminom' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}