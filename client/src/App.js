import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import socket from './socket';
import JoinPage from './pages/JoinPage';
import PresenterPage from './pages/PresenterPage';
import VoterPage from './pages/VoterPage';

function App() {
  useEffect(() => {
    socket.connect();
    return () => { socket.disconnect(); };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/join" />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/join/:sessionCode" element={<VoterPage />} />
          <Route path="/presenter/:sessionCode" element={<PresenterPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
