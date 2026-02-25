type Ranking = { name: string; score: number }

type Props = {
  rankings: Ranking[]
  me: string
  ended: boolean
}

export function ScoreScreen({ rankings, me, ended }: Props) {
  const sorted = [...rankings].sort((a, b) => b.score - a.score)

  return (
    <div className="phase-container score-screen">
      <h1 className="leaderboard-title">{ended ? 'Quiz terminé' : 'Leaderboard'}</h1>
      {ended ? <div className="ended-message">Merci d’avoir joué 🎉</div> : null}

      <div className="leaderboard">
        {sorted.map((p, i) => (
          <div
            key={`${p.name}-${i}`}
            className={`leaderboard-item ${p.name === me ? 'is-me' : ''}`}
          >
            <div className="leaderboard-rank">{i + 1}</div>
            <div className="leaderboard-name">{p.name}</div>
            <div className="leaderboard-score">{p.score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}