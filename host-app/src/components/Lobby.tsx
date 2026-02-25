interface Player {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  answered: boolean;
}

interface Props {
  code: string;
  players: Player[];
  onStart: () => void;
}

export default function Lobby({ code, players, onStart }: Props) {
  return (
    <div>
      <h2>Code: {code}</h2>

      <ul>
        {players.map((p) => (
          <li key={p.id}>
            {p.name} - {p.score}
          </li>
        ))}
      </ul>

      <button onClick={onStart}>Démarrer</button>
    </div>
  );
}