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
  .not('group_id', 'like', 'S%')   // ignore Sixes groups for score entry
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

    // If this is Round 2, write directly to round2_scores and STOP using scores
    if (selectedRound === 'R2') {
      // Update if exists
      const { data: updateData, error: updateError } = await supabase
        .from('round2_scores')
        .update({
          gross_score: Number(grossScore),
        })
        .eq('round_id', 2)                  // round2_scores uses integer 2
        .eq('player_id', selectedPlayer)
        .eq('hole_number', Number(selectedHole))
        .select('id')

      if (updateError) {
        setError(updateError.message)
        return
      }

      // If nothing was updated, insert new row
      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('round2_scores')
          .insert({
            round_id: 2,                         // integer
            group_code: groupId,                 // assumes group_id is 'G21' / 'G22'
            player_id: selectedPlayer,
            hole_number: Number(selectedHole),
            gross_score: Number(grossScore),
            yellow_ball: false,                  // or true if you later support it here
          })

        if (insertError) {
          setError(insertError.message)
          return
        }
      }

      setStatus('Round 2 score saved.')
      return
    }

    // Otherwise (Round 1 etc.), keep existing scores behavior
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
  <main
    style={{
      padding: '1.5rem',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont',
    }}
  >
    <h1>Enter Score</h1>

    {error && <p style={{ color: 'red' }}>{error}</p>}
    {status && !error && <p style={{ color: 'green' }}>{status}</p>}

    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Player:{' '}
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
          >
            <option value="">Select player</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Round:{' '}
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
          >
            <option value="">Select round</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Hole:{' '}
          <select
            value={selectedHole}
            onChange={(e) => setSelectedHole(Number(e.target.value))}
          >
            <option value="">Select hole</option>
            {holes.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Gross score:{' '}
          <input
            type="number"
            min={1}
            max={15}
            value={grossScore}
            onChange={(e) => setGrossScore(Number(e.target.value))}
          />
        </label>
      </div>

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
