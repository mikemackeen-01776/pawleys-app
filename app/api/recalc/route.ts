// app/api/recalc/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  const { error } = await supabase.rpc('recalc_all_scores')

  if (error) {
    console.error('Recalc error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

