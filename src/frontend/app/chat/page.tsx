'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const SUGESTOES = [
  'Quais 5 pacientes têm maior prioridade hoje?',
  'Quantas gestantes estão sem visita recente?',
  'Quais alertas abertos mais urgentes?',
  'Mostra cobertura geral e dos idosos 66+.',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      });

      if (!res.body) throw new Error('Sem body na resposta');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      setMessages(m => [...m, { role: 'assistant', content: '' }]);
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';
        for (const block of blocks) {
          const lines = block.split('\n');
          let event: string | null = null;
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7).trim();
            else if (line.startsWith('data: ')) data += line.slice(6);
          }
          if (event === 'message' && data) {
            assistantText += data;
            setMessages(m => {
              const copy = [...m];
              copy[copy.length - 1] = { role: 'assistant', content: assistantText };
              return copy;
            });
          }
          if (event === 'done') return;
        }
      }
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: `Erro: ${(err as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)]">
      {/* Header */}
      <div className="mb-6">
        <p className="t-section-label">Reunião Semanal</p>
        <h1 className="text-3xl font-bold mt-1" style={{ color: 'var(--grey-dark)' }}>
          Chat IA
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--grey-text)' }}>
          Pergunte sobre o território, prioridades, alertas e cobertura.
        </p>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-left p-4 rounded-2xl text-sm transition-all hover:border-[#004a80]/30"
              style={{
                background: 'var(--white)',
                border: '1px solid var(--grey-card)',
                color: 'var(--grey-dark)',
              }}
            >
              <span style={{ color: 'var(--blue-primary)', fontWeight: 600 }}>💡</span>{' '}
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 max-w-[88%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: m.role === 'user' ? 'var(--blue-primary)' : 'var(--grey-card)',
                border: '1px solid var(--grey-card)',
              }}
            >
              {m.role === 'user'
                ? <User size={14} color="#fff" />
                : <Bot size={14} style={{ color: 'var(--blue-primary)' }} />
              }
            </div>

            {/* Bubble */}
            <div
              className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={
                m.role === 'user'
                  ? { background: 'var(--blue-primary)', color: '#fff' }
                  : { background: 'var(--white)', border: '1px solid var(--grey-card)', color: 'var(--grey-dark)' }
              }
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {loading && (
          <div className="flex gap-3 max-w-[88%]">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'var(--grey-card)', border: '1px solid var(--grey-mid)' }}
            >
              <Bot size={14} style={{ color: 'var(--blue-primary)' }} />
            </div>
            <div
              className="px-4 py-3 rounded-2xl text-sm"
              style={{ background: 'var(--white)', border: '1px solid var(--grey-card)', color: 'var(--grey-text)' }}
            >
              <span className="animate-pulse">pensando…</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2 p-3 rounded-2xl"
        style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte alguma coisa…"
          disabled={loading}
          className="flex-1 bg-transparent px-2 py-1.5 text-sm focus:outline-none placeholder:opacity-40"
          style={{ color: 'var(--grey-dark)' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40 hover:opacity-80"
          style={{ background: 'var(--blue-primary)', color: '#fff' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
