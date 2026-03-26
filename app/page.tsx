// app/page.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  const [status, setStatus] = useState<string | null>(null)

  async function handleRecalc() {
    setStatus('Recalculating...')
    try {
      const res = await fetch('/api/recalc', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setStatus(`Error: ${data.error || 'Unknown error'}`)
        return
      }
      setStatus('Scores recalculated.')
    } catch (err: any) {
      setStatus(`Error: ${err.message || 'Network error'}`)
    }
  }

  return (
    <main style={{ padding: '1.5rem', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont' }}>
      <h1>Pawleys Tournament Tracker</h1>

      {status && (
        <p style={{ color: status.startsWith('Error') ? 'red' : 'green' }}>
          {status}
        </p>
      )}

      <button onClick={handleRecalc} style={{ marginBottom: '1rem' }}>
        Recalculate scores
      </button>

      <p>Welcome to the scoring app for our Pawleys trip.</p>

      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
        <li style={{ marginBottom: '0.5rem' }}>
          <Link href="/enter-score">Enter a score</Link>
        </li>
        <li>
          <Link href="/standings">View standings</Link>
        </li>
      </ul>
    </main>
  )
}

