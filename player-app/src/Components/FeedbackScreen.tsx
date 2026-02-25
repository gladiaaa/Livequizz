type Props = {
  wasCorrect: boolean
  score: number | null
}

export function FeedbackScreen({ wasCorrect, score }: Props) {
  const cls = wasCorrect ? 'correct' : 'incorrect'

  return (
    <div className="phase-container feedback-container">
      <div className={`feedback ${cls}`}>
        <div className="feedback-icon" />
      </div>

      <div className="feedback-text">{wasCorrect ? 'Correct !' : 'Incorrect'}</div>

      <div className="feedback-score">{typeof score === 'number' ? `${score} pts` : ''}</div>
    </div>
  )
}