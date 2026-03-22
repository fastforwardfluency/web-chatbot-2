import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, CheckCircle, ExternalLink, Send, User, Bot, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { getChatResponse } from './services/geminiService';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function App() {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "*FastForward Fluency Assistant* is active. How can I help you today? (This is a simulator for your WhatsApp bot logic)."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isSimulatorOpen) scrollToBottom();
  }, [messages, isSimulatorOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role as 'user' | 'model',
        parts: [{ text: m.content }]
      }));
      
      const response = await getChatResponse(userMessage, history);
      setMessages(prev => [...prev, { role: 'model', content: response || "I'm sorry, I couldn't process that request." }]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Sorry, I'm having trouble connecting right now. Please try again later.";
      setMessages(prev => [...prev, { role: 'model', content: `*Error:* ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-6 font-serif">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-[#5A5A40]/10 relative overflow-hidden">
        <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
          <MessageSquare size={40} />
        </div>
        
        <h1 className="text-3xl font-bold text-[#5A5A40] mb-2">WA Business Bot</h1>
        <p className="text-sm font-sans uppercase tracking-widest opacity-60 mb-8">FastForward Fluency Service</p>
        
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-8 flex items-center gap-3 text-emerald-700">
          <CheckCircle size={24} />
          <span className="font-sans font-medium">Service is Active & Running</span>
        </div>

        <div className="space-y-4 text-left font-sans text-sm text-[#1a1a1a]/70 mb-8">
          <p>This application is operating as a WhatsApp Business Chatbot backend.</p>
          <div className="p-4 bg-[#f5f5f0] rounded-xl border border-[#5A5A40]/5">
            <p className="font-bold text-[#5A5A40] mb-1">Webhook URL:</p>
            <code className="block break-all text-xs bg-white p-2 rounded border border-[#5A5A40]/10">
              {window.location.origin}/api/whatsapp/webhook
            </code>
          </div>
        </div>

        <button 
          onClick={() => setIsSimulatorOpen(true)}
          className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-sans font-bold hover:bg-[#4a4a35] transition-all shadow-md flex items-center justify-center gap-2"
        >
          <MessageSquare size={20} />
          Open Bot Simulator
        </button>

        <div className="mt-8 pt-6 border-t border-[#5A5A40]/10">
          <a 
            href="https://fastforward-fluency.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#5A5A40] hover:underline font-medium"
          >
            Visit Website <ExternalLink size={16} />
          </a>
        </div>

        {/* Simulator Overlay */}
        <AnimatePresence>
          {isSimulatorOpen && (
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="absolute inset-0 bg-white z-50 flex flex-col"
            >
              <div className="p-4 border-b border-[#5A5A40]/10 flex items-center justify-between bg-[#f5f5f0]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
                    <Bot size={18} />
                  </div>
                  <span className="font-bold text-[#5A5A40]">WA Bot Simulator</span>
                </div>
                <button onClick={() => setIsSimulatorOpen(false)} className="p-2 hover:bg-black/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f5f0]/30">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-sans ${
                      msg.role === 'user' 
                        ? 'bg-[#5A5A40] text-white rounded-tr-none' 
                        : 'bg-white border border-[#5A5A40]/10 text-[#1a1a1a] rounded-tl-none shadow-sm'
                    }`}>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#5A5A40]/10 p-3 rounded-2xl rounded-tl-none shadow-sm">
                      <Loader2 size={16} className="animate-spin text-[#5A5A40]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="p-4 border-t border-[#5A5A40]/10 bg-white">
                <div className="relative">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-[#f5f5f0] border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-[#5A5A40]"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#5A5A40] text-white rounded-lg disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-[10px] text-center mt-2 opacity-40 uppercase tracking-tighter">Testing FastForward Fluency AI Logic</p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
