import React, { useState } from 'react';

export default function VoterInput({ socket, sessionId, question }) {
  const [selected, setSelected] = useState('');
  const [ratingValues, setRatingValues] = useState(() => {
    if (question.type === 'rating') {
      const obj = {};
      question.items.forEach(it => obj[it] = 3);
      return obj;
    }
    return {};
  });
  const [textVal, setTextVal] = useState('');

  React.useEffect(() => {
    if (question.type === 'rating') {
      const obj = {};
      question.items.forEach(it => obj[it] = 3);
      setRatingValues(obj);
    } else {
      setSelected('');
      setTextVal('');
    }
  }, [question.id]);

  const submitMultiple = () => {
    socket.emit('vote', { sessionId, questionId: question.id, vote: selected }, (res) => {});
  };

  const submitRating = () => {
    Object.entries(ratingValues).forEach(([item, value]) => {
      socket.emit('vote', { sessionId, questionId: question.id, vote: { item, value } });
    });
  };

  const submitText = () => {
    socket.emit('vote', { sessionId, questionId: question.id, vote: { text: textVal } });
    setTextVal('');
  };

  if (question.type === 'multiple') {
    return (
      <div className="space-y-3">
        {question.options.map(opt => (
          <label key={opt} className="flex items-center space-x-2">
            <input type="radio" name="opt" value={opt} checked={selected===opt} onChange={() => setSelected(opt)} />
            <span>{opt}</span>
          </label>
        ))}
        <div>
          <button onClick={submitMultiple} disabled={!selected} className="px-3 py-1 bg-blue-600 text-white rounded">Enviar vot</button>
        </div>
      </div>
    );
  }

  if (question.type === 'rating') {
    return (
      <div className="space-y-4">
        {question.items.map(item => (
          <div key={item}>
            <div className="flex justify-between">
              <div>{item}</div>
              <div>{ratingValues[item]}</div>
            </div>
            <input
              type="range"
              min="1" max="5"
              value={ratingValues[item]}
              onChange={(e) => setRatingValues(prev => ({ ...prev, [item]: Number(e.target.value) }))}
            />
          </div>
        ))}
        <div>
          <button onClick={submitRating} className="px-3 py-1 bg-blue-600 text-white rounded">Enviar puntuacions</button>
        </div>
      </div>
    );
  }

  if (question.type === 'wordcloud') {
    return (
      <div className="space-y-3">
        <textarea className="w-full border rounded p-2" rows={3} value={textVal} onChange={e => setTextVal(e.target.value)} placeholder="Escriu alguna paraula o frase..." />
        <div>
          <button onClick={submitText} disabled={!textVal.trim()} className="px-3 py-1 bg-blue-600 text-white rounded">Enviar</button>
        </div>
      </div>
    );
  }

  return null;
}
