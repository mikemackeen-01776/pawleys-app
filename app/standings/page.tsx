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
    async function loadStandings() {
      try {
        const res = await fetch('/api/standings')
        if (!res.ok) {
          throw new Error('Failed to load standings')
        }
        const data = await res.json()
        setRows(data.rows)
      } catch (err: any) {
        setError(String(err.message || err))
      } finally {
        setLoading(false)
      }
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

