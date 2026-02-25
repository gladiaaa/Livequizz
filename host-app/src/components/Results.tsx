interface Props {
  results: unknown;
  onNext: () => void;
  onEnd: () => void;
}

export default function Results({ results, onNext, onEnd }: Props) {
  return (
    <div className="card">
      <h2>Résultats</h2>
      <pre>{JSON.stringify(results)}</pre>

      <button className="btn" onClick={onNext}>
        Question suivante
      </button>

      <button className="btn" onClick={onEnd}>
        Terminer
      </button>
    </div>
  );
}