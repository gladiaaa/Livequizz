type Props = { players: string[] }

export function WaitingLobby({ players }: Props) {
  return (
    <div className="phase-container waiting-container">
      <h1>Lobby</h1>
      <div className="waiting-message">En attente du host…</div>

      <div className="player-list">
        {players.map((p) => (
          <div key={p} className="player-chip">
            {p}
          </div>
        ))}
      </div>
    </div>
  )
}