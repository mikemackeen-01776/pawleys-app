// app/enter-score/page.tsx
'use client'

import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Player = { id: string; first_name: string; last_name: string }
type Round = { id: string }
type HoleOption = number

export default function EnterScorePage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [holes] = useState<HoleOption[]>(Array.from({ length: 18 }, (_, i) => i + 1))

  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [selectedRound, setSelectedRound] = useState('')
  const [selectedHole, setSelectedHole] = useState<number | ''>('')
  const [grossScore, setGrossScore] = useState<number | ''>('')

  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, first_name, last_name')
        .order('last_name', { ascending: true })

      if (playersError) {
        setError(playersError.message)
        return
      }

      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('id')
        .order('id', { ascending: true })

      if (roundsError) {
        setError(roundsError.message)
        return
      }

      setPlayers(playersData || [])
      setRounds(roundsData || [])
    }

    loadData()
  }, [])

  async function handleFinalizeRound2() {
    const { data, error } = await supabase.rpc('award_round2_points')

    if (error) {
      alert(error.message) // e.g. "Round 2 not complete yet..."
    } else {
      alert('Round 2 points awarded successfully')
      // TODO: if you later show standings here, refetch them now
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus(null)
    setError(null)

    if (!selectedPlayer || !selectedRound || !selectedHole || !grossScore) {
      setError('Please select player, round, hole, and enter a gross score.')
      return
    }

    // Look up group for this player + round
    const { data: groupData, error: groupError } = await supabase
      .from('group_players')
      .select('group_id, groups!inner(round_id)')
      .eq('player_id', selectedPlayer)
      .eq('groups.round_id', selectedRound)
      .single()

    if (groupError || !groupData) {
      setError('Could not find group for this player and round.')
      return
    }

    const groupId = groupData.group_id as string

    // Look up course for this round
    const { data: roundData, error: roundError } = await supabase
      .from('rounds')
      .select('course_id')
      .eq('id', selectedRound)
      .single()

    if (roundError || !roundData) {
      setError('Could not find course for this round.')
      return
    }

    const courseId = roundData.course_id as string
    const scoreId = `${selectedPlayer}-${selectedRound}-H${selectedHole}`

    // First try to update existing row
    const { data: updateData, error: updateError } = await supabase
      .from('scores')
      .update({
        gross_score: Number(grossScore),
      })
      .eq('id', scoreId)
      .select('id')

    if (updateError) {
      setError(updateError.message)
      return
    }

    // If nothing was updated, insert new row
    if (!updateData || updateData.length === 0) {
      const { error: insertError } = await supabase.from('scores').insert({
        id: scoreId,
        player_id: selectedPlayer,
        round_id: selectedRound,
        course_id: courseId,
        group_id: groupId,
        hole_number: Number(selectedHole),
        gross_score: Number(grossScore),
      })

      if (insertError) {
        setError(insertError.message)
        return
      }
    }

    setStatus('Score saved.')
  }

  return (
    <main style={{ padding: '1.5rem', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont' }}>
      <h1>Enter Score</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {status && !error && <p style={{ color: 'green' }}>{status}</p>}

      <form onSubmit={handleSubmit}>
        {/* existing controls unchanged */}
        {/* ... your Player / Round / Hole / Gross score inputs ... */}

        <button type="submit">Save score</button>

        <button
          type="button"
          onClick={handleFinalizeRound2}
          style={{ marginTop: '1rem', marginLeft: '1rem' }}
        >
          Finalize Round 2
        </button>
      </form>
    </main>
  )
}
