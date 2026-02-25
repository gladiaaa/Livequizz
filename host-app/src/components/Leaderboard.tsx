interface Props {
  players: unknown[];
}

export default function Leaderboard({ players }: Props) {
  return (
    <div className="card">
      <h2>Classement Final</h2>
      <p>Total joueurs : {players.length}</p>
    </div>
  );
}