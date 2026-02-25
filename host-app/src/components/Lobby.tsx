interface Player {
  name: string;
}

interface Props {
  code: string;
  players: Player[];
  onStart: () => void;
}

export default function Lobby({ code, players, onStart }: Props) {
  return (
    <div className="card">
      <h2>Salle d'attente</h2>
      <h3>Code du quiz : {code}</h3>

      <div className="grid">
        {players.map((player, i) => (
          <div key={i} className="card">
            {player.name}
          </div>
        ))}
      </div>

      <button className="btn" onClick={onStart}>
        Démarrer
      </button>
    </div>
  );
}