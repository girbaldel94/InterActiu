import React, { useEffect, useState } from 'react';

function BarChart({ counts }) {
  const total = Object.values(counts).reduce((a,b) => a + b, 0) || 0;
  return (
    <div className="space-y-2">
      {Object.entries(counts).map(([opt, cnt]) => {
        const pct = total ? Math.round((cnt / total) * 100) : 0;
        return (
          <div key={opt}>
            <div className="flex justify-between text-sm mb-1">
              <div>{opt}</div>
              <div>{cnt} ({pct}%)</div>
            </div>
            <div className="w-full bg-gray-200 h-4 rounded">
              <div style={{ width: `${pct}%` }} className="h-4 rounded bg-blue-600" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatingList({ results, items }) {
  return (
    <div className="space-y-2">
      {items.map(item => {
        const sum = results.sums[item] || 0;
        const count = results.counts[item] || 0;
        const avg = count ? (sum / count).toFixed(2) : '—';
        return (
          <div key={item} className="flex justify-between">
            <div>{item}</div>
            <div className="font-semibold">{avg}</div>
          </div>
        );
      })}
    </div>
  );
}

function WordCloud({ wordsArray }) {
  const freq = {};
  wordsArray.forEach(w => { if (!w) return; freq[w] = (freq[w] || 0) + 1; });
  const entries = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 60);
  const maxCount = entries[0] ? entries[0][1] : 1;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([word, count]) => {
        const size = 12 + Math.round((count / maxCount) * 28);
        return <span key={word} style={{ fontSize: `${size}px` }} className="inline-block">{word}</span>;
      })}
    </div>
  );
}

export default function PresenterResults({ socket, session }) {
  const [activeQuestion, setActiveQuestion] = useState(null);

  useEffect(() => {
    if (!session) return;
    const q = session.currentQuestionId ? session.questions.find(x => x.id === session.currentQuestionId) : null;
    setActiveQuestion(q);
  }, [session]);

  useEffect(() => {
    const onVoteUpdated = ({ questionId, results }) => {
      if (!activeQuestion) return;
      if (questionId === activeQuestion.id) {
        setActiveQuestion(prev => ({ ...prev, results }));
      }
    };
    socket.on('vote-updated', onVoteUpdated);
    socket.on('question-activated', (payload) => {
      setActiveQuestion(payload.question);
    });
    socket.on('question-closed', () => {
      setActiveQuestion(null);
    });
    return () => {
      socket.off('vote-updated', onVoteUpdated);
      socket.off('question-activated');
      socket.off('question-closed');
    };
  }, [socket, activeQuestion]);

  if (!activeQuestion) {
    return <div>No hi ha pregunta activa. Activa una per veure resultats en temps real.</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">{activeQuestion.title}</h3>
      <div>
        {activeQuestion.type === 'multiple' && (
          <BarChart counts={activeQuestion.results.counts || {}} />
        )}
        {activeQuestion.type === 'rating' && (
          <RatingList results={activeQuestion.results || { sums: {}, counts: {} }} items={activeQuestion.items || []} />
        )}
        {activeQuestion.type === 'wordcloud' && (
          <WordCloud wordsArray={activeQuestion.results.words || []} />
        )}
      </div>
    </div>
  );
}
