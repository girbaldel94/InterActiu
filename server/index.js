// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.json());

// In-memory sessions data
const sessionsData = {};

function createSampleSession() {
  const sessionId = nanoid(6);
  const code = 'ABC123';
  sessionsData[sessionId] = {
    id: sessionId,
    code,
    presenterId: null,
    currentQuestionId: null,
    questions: [
      {
        id: 'q1',
        type: 'multiple',
        title: 'Quina és la millor característica?',
        options: ['A', 'B', 'C', 'D'],
        active: false,
        results: { counts: { A: 0, B: 0, C: 0, D: 0 } }
      },
      {
        id: 'q2',
        type: 'rating',
        title: 'Avalua aquests aspectes',
        items: ['Contingut', 'Ponència', 'Durada'],
        active: false,
        results: { sums: { Contingut: 0, Ponència: 0, Durada: 0 }, counts: { Contingut: 0, Ponència: 0, Durada: 0 } }
      },
      {
        id: 'q3',
        type: 'wordcloud',
        title: "Paraules sobre l'esdeveniment",
        active: false,
        results: { words: [] }
      }
    ]
  };
  return sessionId;
}
const seededId = createSampleSession();

app.get('/api/session/:code', (req, res) => {
  const code = req.params.code;
  const session = Object.values(sessionsData).find(s => s.code === code);
  if (!session) return res.status(404).json({ error: 'No session' });
  res.json(session);
});

app.post('/api/session', (req, res) => {
  const sessionId = nanoid(6);
  const code = (Math.random().toString(36).slice(2, 8)).toUpperCase();
  sessionsData[sessionId] = { id: sessionId, code, presenterId: null, currentQuestionId: null, questions: [] };
  res.json(sessionsData[sessionId]);
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join-session', (payload, ack) => {
    try {
      const { sessionCode, role } = payload || {};
      const session = Object.values(sessionsData).find(s => s.code === sessionCode);
      if (!session) {
        if (ack) ack({ ok: false, error: 'No session' });
        return;
      }
      const room = `session_${session.id}`;
      socket.join(room);
      socket.data.sessionId = session.id;
      socket.data.role = role || 'voter';
      if (role === 'presenter') {
        session.presenterId = socket.id;
      }
      io.to(socket.id).emit('session-snapshot', {
        sessionId: session.id,
        code: session.code,
        questions: session.questions,
        currentQuestionId: session.currentQuestionId
      });

      if (ack) ack({ ok: true, sessionId: session.id });
      console.log(`${socket.id} joined room ${room} as ${role}`);
    } catch (err) {
      console.error(err);
      if (ack) ack({ ok: false, error: 'server error' });
    }
  });

  socket.on('presenter-activate-question', (payload, ack) => {
    const { sessionId, questionId } = payload || {};
    const session = sessionsData[sessionId];
    if (!session) return ack && ack({ ok: false, error: 'No session' });
    session.questions.forEach(q => q.active = false);
    const q = session.questions.find(x => x.id === questionId);
    if (!q) return ack && ack({ ok: false, error: 'No question' });
    q.active = true;
    session.currentQuestionId = q.id;

    if (q.type === 'multiple') {
      q.results.counts = {};
      q.options.forEach(opt => q.results.counts[opt] = 0);
    } else if (q.type === 'rating') {
      q.results = { sums: {}, counts: {} };
      q.items.forEach(it => { q.results.sums[it] = 0; q.results.counts[it] = 0; });
    } else if (q.type === 'wordcloud') {
      q.results.words = [];
    }

    const room = `session_${sessionId}`;
    io.to(room).emit('question-activated', { question: q });
    io.to(room).emit('session-update', { sessionId, questions: session.questions, currentQuestionId: session.currentQuestionId });
    if (ack) ack({ ok: true });
  });

  socket.on('presenter-close-question', (payload, ack) => {
    const { sessionId, questionId } = payload || {};
    const session = sessionsData[sessionId];
    if (!session) return ack && ack({ ok: false, error: 'No session' });
    const q = session.questions.find(x => x.id === questionId);
    if (!q) return ack && ack({ ok: false, error: 'No question' });
    q.active = false;
    if (session.currentQuestionId === questionId) session.currentQuestionId = null;

    const room = `session_${sessionId}`;
    io.to(room).emit('question-closed', { question: q });
    io.to(room).emit('session-update', { sessionId, questions: session.questions, currentQuestionId: session.currentQuestionId });
    if (ack) ack({ ok: true });
  });

  socket.on('vote', (payload, ack) => {
    const { sessionId, questionId, vote } = payload || {};
    const session = sessionsData[sessionId];
    if (!session) return ack && ack({ ok: false, error: 'No session' });

    const q = session.questions.find(x => x.id === questionId);
    if (!q) return ack && ack({ ok: false, error: 'No question' });
    if (!q.active) return ack && ack({ ok: false, error: 'Question not active' });

    if (q.type === 'multiple') {
      if (!q.results.counts[vote]) q.results.counts[vote] = 0;
      q.results.counts[vote] += 1;
    } else if (q.type === 'rating') {
      const { item, value } = vote;
      if (q.results.sums[item] === undefined) q.results.sums[item] = 0;
      if (q.results.counts[item] === undefined) q.results.counts[item] = 0;
      q.results.sums[item] += Number(value);
      q.results.counts[item] += 1;
    } else if (q.type === 'wordcloud') {
      const text = String(vote.text || '').trim();
      if (text.length) {
        const words = text.split(/\s+/).map(w => w.replace(/[^\wàèéíóúüÀÈÉÍÓÚÜñÑ'-]/g, '').toLowerCase()).filter(Boolean);
        q.results.words.push(...words);
      }
    }

    const room = `session_${sessionId}`;
    io.to(room).emit('vote-updated', { questionId: q.id, results: q.results, type: q.type });
    io.to(room).emit('session-update', { sessionId, questions: session.questions, currentQuestionId: session.currentQuestionId });

    if (ack) ack({ ok: true });
  });

  socket.on('disconnect', () => {
    console.log('socket disconnect', socket.id);
    Object.values(sessionsData).forEach(session => {
      if (session.presenterId === socket.id) session.presenterId = null;
    });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}. Sample session code: ${sessionsData[seededId].code}`);
});
