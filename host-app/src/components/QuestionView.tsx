interface Props {
  question: unknown;
}

export default function QuestionView({ question }: Props) {
  return (
    <div className="card">
      <h2>Question</h2>
      <pre>{JSON.stringify(question)}</pre>
    </div>
  );
}