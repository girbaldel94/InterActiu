import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JoinPage() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const onJoin = (e) => {
    e.preventDefault();
    if (!code) return;
    navigate(`/join/${code.toUpperCase()}`);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Unir-se a sessió — InterActiu (MVP)</h1>
      <form onSubmit={onJoin} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Introdueix el session code (ex: ABC123)"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Unir-se</button>
        </div>
      </form>
      <div className="mt-6 text-sm text-gray-600">
        Si ets presentador, accedeix a <code>/presenter/SEU_CODI</code>
      </div>
    </div>
  );
}
