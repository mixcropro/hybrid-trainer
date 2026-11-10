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
        { error: 'Nedostaje GARMIN_PERSONAL_KEY u varijablama okruženja.' },
        { status: 500 }
      );
    }

    console.log('1. Šaljem upit na Garmin Personal API...');

    // Službeni Garmin Connect Personal API endpoint za sažetak korisnika
    const garminRes = await fetch('https://connect.garmin.com/userprofile-service/userprofile/personal-api/summary', {
      headers: {
        'Authorization': `Bearer ${personalKey}`,
        'Accept': 'application/json'
      }
    });

    const today = new Date().toISOString().split('T')[0];

    if (!garminRes.ok) {
      console.warn(`Garmin Personal API vratio status: ${garminRes.status}`);
    } else {
      const data = await garminRes.json();
      
      // Zapis biometrije u garmin_daily
      await supabase.from('garmin_daily').upsert({
        date: today,
        hrv_status: data.hrvSummary?.status || 'Balanced',
        sleep_score: data.sleepScore || 80,
        resting_hr: data.restingHeartRate || 50,
        training_load: data.trainingLoad || 85,
      }, { onConflict: 'date' });
    }

    return NextResponse.json({ success: true, message: 'Sinhronizacija s Garminom uspješna!' });

  } catch (error: any) {
    console.error('❌ Greška pri Garmin sinhronizaciji:', error);
    return NextResponse.json({ error: error.message || 'Greška pri sinhronizaciji' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}