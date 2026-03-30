// app/standings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type StandingRow = {
  id: string
  first_name: string
  last_name: string
  total_points: number
}

export default function StandingsPage() {
  const [rows, setRows] = useState<StandingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

 useEffect(() => {
  async function loadStandings().catch((err) => {
  setError(String(err))
  setLoading(false)
}){, [])
    setLoading(true)
    setError(null)

 const { data: playersData, error: playersError } = await supabase
  .from('players')
  .select('id, first_name, last_name')

if (playersError) {
  setError(playersError.message)
  setLoading(false)
  return
}

const { data: standingsDataRaw, error: standingsError } = await supabase
  .from('player_standings')
  .select('player_id, total_points')

if (standingsError) {
  setError(standingsError.message)
  setLoading(false)
  return
}

const standingsMap = new Map(
  (standingsDataRaw ?? []).map((row) => [row.player_id, Number(row.total_points ?? 0)])
)

const list = (playersData ?? [])
  .map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    total_points: standingsMap.get(p.id) ?? 0,
  }))
  .sort(
    (a, b) =>
      b.total_points - a.total_points || a.id.localeCompare(b.id)
  )

setRows(list)
    setLoading(false)
  }

  loadStandings()
}, [])

  if (loading) return <main style={{ padding: '1rem' }}>Loading standings…</main>
  if (error) return <main style={{ padding: '1rem' }}>Error: {error}</main>

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Pawleys Invitational Standings</h1>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Player</th>
            <th>Total Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.first_name} {r.last_name}</td>
              <td>{r.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}

