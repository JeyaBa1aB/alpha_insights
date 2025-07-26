import React, { useState, useRef, useEffect } from 'react';
import GradientButton from './GradientButton';
import GlassmorphicCard from './GlassmorphicCard';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const mockAgents = ['Portfolio', 'Research', 'Support', 'Education'];

const AIChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Hi! I am your Alpha Insights AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setTimeout(() => {
      setMessages(msgs => [...msgs, { sender: 'ai', text: `Agent (${mockAgents[Math.floor(Math.random()*mockAgents.length)]}): Here's a mock response to "${input}".` }]);
    }, 800);
    setInput('');
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50">
        {!open && (
          <GradientButton onClick={() => setOpen(true)} className="rounded-full w-16 h-16 flex items-center justify-center text-2xl shadow-lg">
            💬
          </GradientButton>
        )}
        {open && (
          <GlassmorphicCard className="w-80 h-[420px] flex flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg text-white">AI Chat</span>
              <button className="text-white text-xl font-bold hover:text-indigo-400" onClick={() => setOpen(false)}>&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto mb-2 px-1">
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-2 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-3 py-2 rounded-xl max-w-[70%] ${msg.sender === 'user' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-white/30 text-gray-900'}`}>{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className="flex gap-2" onSubmit={handleSend}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <GradientButton type="submit" className="px-4">Send</GradientButton>
            </form>
          </GlassmorphicCard>
        )}
      </div>
    </>
  );
};

export default AIChatWidget;
