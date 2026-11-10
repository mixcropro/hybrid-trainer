import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET() {
  const { data: profile } = await supabase.from('user_profile').select('*').limit(1).maybeSingle();
  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    const { data: existing } = await supabase.from('user_profile').select('id').limit(1).maybeSingle();

    let result;
    if (existing) {
      result = await supabase.from('user_profile').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      result = await supabase.from('user_profile').insert([updateData]);
    }

    if (result.error) throw result.error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}