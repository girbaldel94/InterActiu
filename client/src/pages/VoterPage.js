import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VoterInput from '../components/VoterInput';
import socket from '../socket';

export default function VoterPage() {
  const { sessionCode } = useParams();
  const [session, setSession] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);

  useEffect(() => {
    if (!sessionCode) return;
    socket.emit('join-session', { sessionCode, role: 'voter' }, (res) => {
      if (!res || !res.ok) {
        console.warn('No session or join failed', res);
      }
    });

    const onSnapshot = (snap) => {
      setSession(snap);
      if (snap.currentQuestionId) {
        const q = snap.questions.find(x => x.id === snap.currentQuestionId);
        setActiveQuestion(q || null);
      } else {
        setActiveQuestion(null);
      }
    };

    const onQuestionActivated = ({ question }) => setActiveQuestion(question);
    const onQuestionClosed = () => setActiveQuestion(null);
    const onVoteUpdated = ({ questionId, results }) => {
      setActiveQuestion(prev => prev && prev.id === questionId ? { ...prev, results } : prev);
    };

    socket.on('session-snapshot', onSnapshot);
    socket.on('question-activated', onQuestionActivated);
    socket.on('question-closed', onQuestionClosed);
    socket.on('vote-updated', onVoteUpdated);

    return () => {
      socket.off('session-snapshot', onSnapshot);
      socket.off('question-activated', onQuestionActivated);
      socket.off('question-closed', onQuestionClosed);
      socket.off('vote-updated', onVoteUpdated);
    };
  }, [sessionCode]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Sessió: {sessionCode}</h2>

      {!activeQuestion && (
        <div className="p-6 bg-white rounded shadow">No hi ha cap pregunta activa. Espera a que el presentador activi una.</div>
      )}

      {activeQuestion && (
        <div className="p-6 bg-white rounded shadow space-y-4">
          <h3 className="text-lg font-bold">{activeQuestion.title}</h3>
          <VoterInput socket={socket} sessionId={session?.sessionId} question={activeQuestion} />
        </div>
      )}
    </div>
  );
}
