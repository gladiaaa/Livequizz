interface Results {
  counts: [number, number, number, number];
  correctIndex: 0 | 1 | 2 | 3;
}

interface Props {
  results: Results;
  onNext: () => void;
}

export default function Results({ results, onNext }: Props) {
  return (
    <div>
      <h2>Résultats</h2>

      {results.counts.map((count, index) => (
        <div key={index}>
          Réponse {index + 1}: {count} votes
          {index === results.correctIndex && " ✅"}
        </div>
      ))}

      <button onClick={onNext}>Question suivante</button>
    </div>
  );
}