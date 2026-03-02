import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GameSelection from './pages/GameSelection';
import ChessGame from './pages/ChessGame';
import CheckersGame from './pages/CheckersGame';
import ForgotPassword from './pages/ForgotPassword'; // ✅ NOUVELLE PAGE
import ResetPassword from './pages/ResetPassword';   // ✅ NOUVELLE PAGE

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/game-selection" element={<GameSelection />} />
          <Route path="/chess" element={<ChessGame />} />
          <Route path="/checkers" element={<CheckersGame />} />
          
          {/* ✅ NOUVELLES ROUTES POUR LA RÉINITIALISATION DE MOT DE PASSE */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;