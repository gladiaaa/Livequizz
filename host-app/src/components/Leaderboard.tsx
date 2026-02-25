interface Player {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  answered: boolean;
}

interface Props {
  players: Player[];
}

export default function Leaderboard({ players }: Props) {
  return (
    <div>
      <h2>Classement</h2>

      {players.map((p, index) => (
        <div key={p.id}>
          {index + 1}. {p.name} - {p.score}
        </div>
      ))}
    </div>
  );
}