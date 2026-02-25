import { useState } from "react";

interface Question {
  question: string;
  answers: string[];
  correctIndex: number;
}

interface Props {
  onCreate: (quiz: unknown) => void;
}

export default function CreateQuiz({ onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

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

  const updateQuestion = (index: number, updated: Question) => {
    const copy = [...questions];
    copy[index] = updated;
    setQuestions(copy);
  };

  const handleSubmit = () => {
    onCreate({ title, questions });
  };

  return (
    <div className="card">
      <h2>Créer un Quiz</h2>

      <input
        className="input"
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <button className="btn" onClick={addQuestion}>
        Ajouter une question
      </button>

      {questions.map((q, i) => (
        <div key={i} className="card">
          <input
            className="input"
            placeholder="Question"
            value={q.question}
            onChange={(e) =>
              updateQuestion(i, { ...q, question: e.target.value })
            }
          />

          {q.answers.map((a, ai) => (
            <input
              key={ai}
              className="input"
              placeholder={`Réponse ${ai + 1}`}
              value={a}
              onChange={(e) => {
                const updatedAnswers = [...q.answers];
                updatedAnswers[ai] = e.target.value;
                updateQuestion(i, { ...q, answers: updatedAnswers });
              }}
            />
          ))}

          <select
            className="input"
            value={q.correctIndex}
            onChange={(e) =>
              updateQuestion(i, {
                ...q,
                correctIndex: Number(e.target.value),
              })
            }
          >
            <option value={0}>Réponse 1 correcte</option>
            <option value={1}>Réponse 2 correcte</option>
            <option value={2}>Réponse 3 correcte</option>
            <option value={3}>Réponse 4 correcte</option>
          </select>
        </div>
      ))}

      <button className="btn" onClick={handleSubmit}>
        Créer le quiz
      </button>
    </div>
  );
}