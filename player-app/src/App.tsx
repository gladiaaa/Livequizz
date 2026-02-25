import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useWebSocket } from './hooks/useWebSocket'
import type {
  ClientMessage,
  ServerMessage,
  QuizPhase,
  QuizQuestion,
} from '@shared/index'

import { JoinScreen } from './Components/JoinScreen'
import { WaitingLobby } from './Components/WaitingLobby'
import { AnswerScreen } from './Components/AnswerScreen'
import { FeedbackScreen } from './Components/FeedbackScreen'
import { ScoreScreen } from './Components/ScoreScreen'

type LocalPhase = 'join' | QuizPhase
type Ranking = { name: string; score: number }

type AppState = {
  phase: LocalPhase

  quizCode: string
  name: string
  playerId: string | null

  players: string[]

  question: Omit<QuizQuestion, 'correctIndex'> | null
  questionIndex: number | null
  questionTotal: number | null
  remaining: number | null

  hasAnswered: boolean
  selectedIndex: number | null

  correctIndex: number | null
  distribution: number[]
  scores: Record<string, number>

  rankings: Ranking[]

  error: string | null
}

const initialState: AppState = {
  phase: 'join',
  quizCode: '',
  name: '',
  playerId: null,

  players: [],

  question: null,
  questionIndex: null,
  questionTotal: null,
  remaining: null,

  hasAnswered: false,
  selectedIndex: null,

  correctIndex: null,
  distribution: [],
  scores: {},

  rankings: [],

  error: null,
}

function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`)
}

function isQuizPhase(v: unknown): v is QuizPhase {
  return v === 'lobby' || v === 'question' || v === 'results' || v === 'leaderboard' || v === 'ended'
}

export default function App() {
  const wsUrl = useMemo(() => 'ws://localhost:3001', [])
  const { status, sendMessage, lastMessage } = useWebSocket(wsUrl)

  const [state, setState] = useState<AppState>(initialState)


  function handleJoin(quizCode: string, name: string) {
    setState((s) => ({
      ...s,
      quizCode,
      name,
      error: null,
      phase: 'lobby',
    }))

    const msg: ClientMessage = { type: 'join', quizCode, name }
    sendMessage(msg)
  }

  function handleAnswer(choiceIndex: number) {
    setState((s) => {
      if (s.phase !== 'question') return s
      if (!s.question) return s
      if (s.hasAnswered) return s

      const questionId = s.question.id
      const msg: ClientMessage = { type: 'answer', questionId, choiceIndex }
      sendMessage(msg)

      return {
        ...s,
        hasAnswered: true,
        selectedIndex: choiceIndex,
        error: null,
      }
    })
  }


  useEffect(() => {
    if (!lastMessage) return

    const msg: ServerMessage = lastMessage

    setState((s) => {
      switch (msg.type) {
        case 'joined': {
          return {
            ...s,
            phase: 'lobby',
            playerId: msg.playerId,
            players: msg.players,
            error: null,
          }
        }

        case 'question': {
          return {
            ...s,
            phase: 'question',
            question: msg.question,
            questionIndex: msg.index,
            questionTotal: msg.total,
            remaining: msg.question.timerSec, 
            hasAnswered: false,
            selectedIndex: null,
            correctIndex: null,
            distribution: [],
            scores: {},
            error: null,
          }
        }

        case 'tick': {
          return { ...s, remaining: msg.remaining }
        }

        case 'results': {
          const wasCorrect =
            s.selectedIndex !== null && s.selectedIndex === msg.correctIndex

          return {
            ...s,
            phase: 'results',
            correctIndex: msg.correctIndex,
            distribution: msg.distribution,
            scores: msg.scores,
            error: null,
          }
        }

        case 'leaderboard': {
          return {
            ...s,
            phase: 'leaderboard',
            rankings: msg.rankings,
            error: null,
          }
        }

        case 'ended': {
          return {
            ...s,
            phase: 'ended',
            error: null,
          }
        }

        case 'error': {
          return { ...s, error: msg.message }
        }

        case 'sync': {
          if (!isQuizPhase(msg.phase)) return s

          const phase = msg.phase

          if (phase === 'lobby') {
            const data = msg.data as { players?: string[] } | null
            return {
              ...s,
              phase,
              players: data?.players ?? s.players,
              error: null,
            }
          }

          if (phase === 'question') {
            const data = msg.data as
              | {
                  question?: Omit<QuizQuestion, 'correctIndex'>
                  index?: number
                  total?: number
                  remaining?: number
                }
              | null

            return {
              ...s,
              phase,
              question: data?.question ?? s.question,
              questionIndex: data?.index ?? s.questionIndex,
              questionTotal: data?.total ?? s.questionTotal,
              remaining: data?.remaining ?? s.remaining,
              error: null,
            }
          }

          if (phase === 'results') {
            const data = msg.data as
              | { correctIndex?: number; distribution?: number[]; scores?: Record<string, number> }
              | null
            return {
              ...s,
              phase,
              correctIndex: typeof data?.correctIndex === 'number' ? data.correctIndex : s.correctIndex,
              distribution: data?.distribution ?? s.distribution,
              scores: data?.scores ?? s.scores,
              error: null,
            }
          }

          if (phase === 'leaderboard') {
            const data = msg.data as { rankings?: Ranking[] } | null
            return {
              ...s,
              phase,
              rankings: data?.rankings ?? s.rankings,
              error: null,
            }
          }

          if (phase === 'ended') {
            return { ...s, phase, error: null }
          }

          return s
        }

        default:
          return assertNever(msg)
      }
    })
  }, [lastMessage, sendMessage])


  const statusClass =
    status === 'connected'
      ? 'status-connected'
      : status === 'connecting'
      ? 'status-connecting'
      : 'status-disconnected'

  return (
    <div className="app">
      <header className="app-header">
        <h2>Quiz / Player</h2>
        <span className={`status-badge ${statusClass}`}>{status}</span>
      </header>

      <main className="app-main">
        {state.phase === 'join' ? (
          <JoinScreen onJoin={handleJoin} error={state.error} />
        ) : state.phase === 'lobby' ? (
          <WaitingLobby players={state.players} />
        ) : state.phase === 'question' ? (
          <AnswerScreen
            question={state.question}
            remaining={state.remaining}
            hasAnswered={state.hasAnswered}
            selectedIndex={state.selectedIndex}
            onAnswer={handleAnswer}
          />
        ) : state.phase === 'results' ? (
          <FeedbackScreen
            wasCorrect={
              state.selectedIndex !== null &&
              state.correctIndex !== null &&
              state.selectedIndex === state.correctIndex
            }
            score={state.playerId ? state.scores[state.playerId] ?? null : null}
          />
        ) : state.phase === 'leaderboard' ? (
          <ScoreScreen rankings={state.rankings} me={state.name} ended={false} />
        ) : (
          <ScoreScreen rankings={state.rankings} me={state.name} ended={true} />
        )}
      </main>
    </div>
  )
}