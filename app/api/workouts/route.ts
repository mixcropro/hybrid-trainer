import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, sport_type, title, duration_minutes, distance_km, avg_power_watts, avg_hr, rpe, notes } = body;

    // Izračun procjene TSS-a ako nije zadan
    let tss = body.tss;
    if (!tss && duration_minutes) {
      const rpeFactor = (rpe || 5) / 10;
      tss = Math.round((duration_minutes * rpeFactor * 1.1));
    }

    const { data, error } = await supabase
      .from('activities')
      .insert([{ date, sport_type, title, duration_minutes, distance_km, avg_power_watts, avg_hr, tss, rpe, notes }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, activity: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: activities } = await supabase.from('activities').select('*').order('date', { ascending: false }).limit(20);
    const { data: scheduled } = await supabase.from('scheduled_workouts').select('*').order('scheduled_date', { ascending: true });
    return NextResponse.json({ activities, scheduled });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID nije zadan' }, { status: 400 });

    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
