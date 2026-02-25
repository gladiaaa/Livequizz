import { useState } from "react";

interface Question {
  question: string;
  answers: string[];
  correctIndex: number;
}

interface Props {
  onCreate: (quiz: {
    title: string;
    questions: {
      id: number;
      title: string;
      choices: [string, string, string, string];
      correctIndex: 0 | 1 | 2 | 3;
      durationMs: number;
    }[];
  }) => void;
}

export default function CreateQuiz({ onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [durationMs, setDurationMs] = useState(10000); // durée par question (optionnel)

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        answers: ["", "", "", ""],
        correctIndex: 0,
      },
    ]);
  };

  const updateQuestion = (index: number, updated: Question) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const handleSubmit = () => {
    const quiz = {
      title: title.trim(),
      questions: questions.map((q, idx) => {
        const a0 = q.answers[0]?.trim() ?? "";
        const a1 = q.answers[1]?.trim() ?? "";
        const a2 = q.answers[2]?.trim() ?? "";
        const a3 = q.answers[3]?.trim() ?? "";

        return {
          id: idx + 1,
          title: q.question.trim(),
          choices: [a0, a1, a2, a3] as [string, string, string, string],
          correctIndex: q.correctIndex as 0 | 1 | 2 | 3,
          durationMs,
        };
      }),
    };

    onCreate(quiz);
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

      {/* Optionnel: durée pour toutes les questions */}
      <input
        className="input"
        type="number"
        min={1000}
        step={1000}
        placeholder="Durée par question (ms)"
        value={durationMs}
        onChange={(e) => setDurationMs(Number(e.target.value) || 10000)}
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