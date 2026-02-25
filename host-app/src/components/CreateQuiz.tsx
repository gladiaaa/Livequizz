import { useState } from "react";

type QuizQuestion = {
  question: string;
  answers: string[];
  correctIndex: number;
};

type QuizDefinition = {
  title: string;
  questions: {
    id: number;
    title: string;
    choices: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
    durationMs: number;
  }[];
};

interface Props {
  onCreate: (quiz: QuizDefinition) => void;
}

export default function CreateQuiz({ onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        answers: ["", "", "", ""],
        correctIndex: 0,
      },
    ]);
  };

  const createQuiz = () => {
    const quiz: QuizDefinition = {
      title,
      questions: questions.map((q, index) => ({
        id: index,
        title: q.question,
        choices: q.answers as [string, string, string, string],
        correctIndex: q.correctIndex as 0 | 1 | 2 | 3,
        durationMs: 10000,
      })),
    };

    onCreate(quiz);
  };

  return (
    <div>
      <h2>Créer un Quiz</h2>

      <input
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <button onClick={addQuestion}>Ajouter une question</button>

      {questions.map((q, index) => (
        <div key={index}>
          <input
            placeholder="Question"
            value={q.question}
            onChange={(e) => {
              const updated = [...questions];
              updated[index].question = e.target.value;
              setQuestions(updated);
            }}
          />

          {q.answers.map((a, i) => (
            <input
              key={i}
              placeholder={`Réponse ${i + 1}`}
              value={a}
              onChange={(e) => {
                const updated = [...questions];
                updated[index].answers[i] = e.target.value;
                setQuestions(updated);
              }}
            />
          ))}
        </div>
      ))}

      <button onClick={createQuiz}>Créer le quiz</button>
    </div>
  );
}