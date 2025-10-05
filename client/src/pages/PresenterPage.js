import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PresenterResults from '../components/PresenterResults';
import socket from '../socket';

export default function PresenterPage() {
  const { sessionCode } = useParams();
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!sessionCode) return;
    socket.emit('join-session', { sessionCode, role: 'presenter' }, (res) => {
      if (!res || !res.ok) console.warn('join failed', res);
    });

    const onSnapshot = (snap) => setSession(snap);
    const onSessionUpdate = (payload) => setSession(prev => ({ ...prev, ...payload }));
    socket.on('session-snapshot', onSnapshot);
    socket.on('session-update', onSessionUpdate);

    return () => {
      socket.off('session-snapshot', onSnapshot);
      socket.off('session-update', onSessionUpdate);
    };
  }, [sessionCode]);

  const activate = (questionId) => {
    socket.emit('presenter-activate-question', { sessionId: session.sessionId, questionId }, (res) => {
      if (!res.ok) console.warn(res);
    });
  };
  const closeQ = (questionId) => {
    socket.emit('presenter-close-question', { sessionId: session.sessionId, questionId }, (res) => {
      if (!res.ok) console.warn(res);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Control del Presentador — Sessió {sessionCode}</h2>

      {!session && <div>Carregant...</div>}

      {session && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-2">Preguntes</h4>
            <ul className="space-y-2">
              {session.questions.map(q => (
                <li key={q.id} className="border p-2 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{q.title}</div>
                      <div className="text-sm text-gray-600">{q.type}</div>
                    </div>
                    <div className="space-x-2">
                      {!q.active ? (
                        <button onClick={() => activate(q.id)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Activar</button>
                      ) : (
                        <button onClick={() => closeQ(q.id)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Tancar</button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-2">Resultats (temps real)</h4>
            <PresenterResults socket={socket} session={session} />
          </div>
        </div>
      )}
    </div>
  );
}
