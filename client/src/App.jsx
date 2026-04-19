import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { BackendAuthConnection } from "./context/BackendAuthConnection.jsx";

import Login from "./src/diffPages/Login.jsx";
import Home from "./src/diffPages/Home_Page.jsx";
import Dashboard from "./src/diffPages/Dashboard.jsx";
import Study from "./src/diffPages/Study_Page.jsx";
import Create from "./src/diffPages/Create_Edit_Card.jsx";
import Leaderboard from "./src/diffPages/Leaderboard.jsx";
import QuizPage from "./src/diffPages/Quiz_Page";
import QuizBuilder from "./src/diffPages/QuizBuilder";

function ProtectedRoute({ children }) {
  const { user } = useContext(BackendAuthConnection);
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/study/:deckId" element={<ProtectedRoute><Study /></ProtectedRoute>} />
        <Route path="/study" element={<ProtectedRoute><Study /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
        <Route path="/create/:deckId" element={<ProtectedRoute><Create /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<Leaderboard />}/>
        <Route path="/quiz/:quizId" element={<QuizPage />}/>
        <Route path="/quiz-builder/:quizId/:deckId" element={<QuizBuilder />}/>
      </Routes>
    </BrowserRouter>
  );
}
