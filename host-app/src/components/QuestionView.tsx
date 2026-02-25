interface Question {
  id: number;
  title: string;
  choices: [string, string, string, string];
  endsAt: number;
}

interface Props {
  question: Question;
}

export default function QuestionView({ question }: Props) {
  return (
    <div>
      <h2>{question.title}</h2>

      {question.choices.map((choice, index) => (
        <div key={index}>
          {index + 1}. {choice}
        </div>
      ))}
    </div>
  );
}