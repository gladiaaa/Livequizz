import { useMemo, useState } from 'react'

type Props = {
  onJoin: (quizCode: string, name: string) => void
  error: string | null
}

export function JoinScreen({ onJoin, error }: Props) {
  const [quizCode, setQuizCode] = useState('')
  const [name, setName] = useState('')

  const canJoin = useMemo(() => quizCode.trim().length >= 4 && name.trim().length >= 2, [quizCode, name])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canJoin) return
    onJoin(quizCode.trim().toUpperCase(), name.trim())
  }

  return (
    <div className="phase-container">
      <form className="join-form" onSubmit={submit}>
        <h1>Rejoindre</h1>

        {error ? <div className="error-message">{error}</div> : null}

        <div className="form-group">
          <label>Code</label>
          <input
            className="code-input"
            value={quizCode}
            onChange={(e) => setQuizCode(e.target.value)}
            placeholder="ABC123"
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label>Pseudo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alice"
            autoComplete="off"
          />
        </div>

        <button className="btn-primary" disabled={!canJoin}>
          Go
        </button>
      </form>
    </div>
  )
}