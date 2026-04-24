import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import HomePage from './pages/HomePage'
import JoinPage from './pages/JoinPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import ResultPage from './pages/ResultPage'
import LoginPage from './pages/host/LoginPage'
import RegisterPage from './pages/host/RegisterPage'
import DashboardPage from './pages/host/DashboardPage'
import QuizEditorPage from './pages/host/QuizEditorPage'
import QuizLobbyPage from './pages/host/QuizLobbyPage'
import QuizControlPage from './pages/host/QuizControlPage'
import QuizResultsPage from './pages/host/QuizResultsPage'
import ProtectedRoute from './components/ProtectedRoute'

// Hydrate token from localStorage synchronously before any component renders
useAuthStore.getState().loadFromStorage()

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public participant routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:roomCode" element={<JoinPage />} />
        <Route path="/lobby/:roomCode" element={<LobbyPage />} />
        <Route path="/game/:roomCode" element={<GamePage />} />
        <Route path="/result/:roomCode" element={<ResultPage />} />

        {/* Host auth routes */}
        <Route path="/host/login" element={<LoginPage />} />
        <Route path="/host/register" element={<RegisterPage />} />

        {/* Protected host routes */}
        <Route path="/host/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/host/quiz/new" element={<ProtectedRoute><QuizEditorPage /></ProtectedRoute>} />
        <Route path="/host/quiz/:quizId" element={<ProtectedRoute><QuizEditorPage /></ProtectedRoute>} />
        <Route path="/host/lobby/:roomCode" element={<ProtectedRoute><QuizLobbyPage /></ProtectedRoute>} />
        <Route path="/host/control/:roomCode" element={<ProtectedRoute><QuizControlPage /></ProtectedRoute>} />
        <Route path="/host/results/:roomCode" element={<ProtectedRoute><QuizResultsPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
