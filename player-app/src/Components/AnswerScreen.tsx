import type { QuizQuestion } from '@shared/index'

type Props = {
  question: Omit<QuizQuestion, 'correctIndex'> | null
  remaining: number | null
  hasAnswered: boolean
  selectedIndex: number | null
  onAnswer: (choiceIndex: number) => void
}

export function AnswerScreen({ question, remaining, hasAnswered, selectedIndex, onAnswer }: Props) {
  const timer = typeof remaining === 'number' ? remaining : null
  const timerClass =
    timer !== null && timer <= 3 ? 'danger' : timer !== null && timer <= 7 ? 'warning' : ''

  return (
    <div className="phase-container answer-screen">
      <div className={`answer-timer ${timerClass}`}>{timer !== null ? timer : '—'}</div>

      <div className="answer-question">{question?.text ?? 'Question…'}</div>

      <div className="answer-grid">
        {(question?.choices ?? []).slice(0, 4).map((c, idx) => {
          const isSelected = selectedIndex === idx
          return (
            <button
              key={idx}
              className={`answer-btn ${isSelected ? 'selected' : ''}`}
              disabled={hasAnswered}
              onClick={() => onAnswer(idx)}
            >
              {c}
            </button>
          )
        })}
      </div>

      {hasAnswered ? <div className="answered-message">Réponse envoyée…</div> : null}
    </div>
  )
}