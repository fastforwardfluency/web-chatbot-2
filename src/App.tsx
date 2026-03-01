import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  User, 
  FastForward, 
  Calendar, 
  Sparkles, 
  Brain, 
  Globe,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! I'm Fluency AI. I'm here to help you understand how we combine English theory, neuroscience, and AI to help you achieve fluency faster. How can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: input }] }
        ],
        config: {
          systemInstruction: `You are Fluency AI, a soft, friendly, and professional AI assistant for FastForward Fluency (https://fastforward-fluency.com/). 
          
          Your goals:
          1. Answer questions about the school, its methods, and website content using the provided URL context.
          2. Explain how we use English theory, neuroscience, and AI to accelerate language learning in simple, approachable terms.
          3. Always maintain a warm, encouraging, and "soft" tone.
          4. Gently drive the conversation towards the user scheduling a strategy session or booking an appointment.
          5. If the user asks about booking or starting, mention the "Schedule a Strategy Session" button and encourage them to use it.
          
          Neuroscience Integration (Simple Terms):
          - **Brain-Friendly Learning**: We use "Neuroplasticity" to help your brain create new English-speaking pathways.
          - **Spaced Repetition**: We time your practice perfectly so you never forget what you've learned.
          - **Active Recall**: Instead of just reading, we help your brain "pull" information out, which makes it stick 10x better.
          - **Benefit**: You learn faster with less frustration because we work *with* your brain, not against it.
          
          AI Integration (Simple Terms):
          - **Personalized Tutor**: Our AI tools act like a 24/7 tutor that knows exactly what you need to work on.
          - **Real-Time Feedback**: Get instant, gentle corrections during practice.
          - **Adaptive Content**: The lessons change based on your progress, so you're always challenged but never overwhelmed.
          - **Benefit**: You get a completely custom experience that evolves as you do.
          
          Personalized Learning Path Feature:
          - If a user asks for a "Personalized Path" or "Where should I start?", ask them two simple questions:
            a) What is your current English level? (Beginner, Intermediate, or Advanced)
            b) What is your main goal? (e.g., Business, Travel, Academic, or General Fluency)
          - Based on their answers, suggest a path:
            - **Beginner + General**: "Fluency Foundation" - Focus on natural acquisition and confidence.
            - **Intermediate + Business**: "Professional Accelerator" - Focus on high-level communication and leadership.
            - **Advanced + Academic**: "Mastery & Nuance" - Focus on sophisticated expression and critical thinking.
          - Always end the suggestion with an invitation to schedule a strategy session to confirm their path with a human expert.
          
          Always be helpful and concise. If you don't know something specifically, refer them to the website or suggest scheduling a call with a human expert.`,
          tools: [{ urlContext: {} }],
        }
      });

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "I'm sorry, I couldn't process that. Could you try again?",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having a little trouble connecting right now. Please try again in a moment!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-2xl overflow-hidden sm:my-8 sm:h-[calc(100vh-64px)] sm:rounded-3xl border border-black/5">
      {/* Header */}
      <header className="px-6 py-4 border-b border-black/5 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-olive rounded-full flex items-center justify-center text-white shadow-lg">
            <FastForward size={20} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold tracking-tight text-brand-ink">Fluency AI</h1>
            <p className="text-[10px] uppercase tracking-widest text-brand-olive/60 font-semibold">FastForward Fluency</p>
          </div>
        </div>
        
        <a 
          href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2MUuwNnC_UE1X9PXRnYZA2GAXAMDyQX2eYUI21M6ZfuQfYhNTc5GJpS-TgADlicugc0lrLMSWz" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-olive text-white rounded-full text-sm font-medium hover:bg-brand-olive/90 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Calendar size={16} />
          Schedule a Strategy Session
        </a>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-brand-cream/30">
        <div className="max-w-2xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
                    message.role === 'user' ? 'bg-brand-olive text-white' : 'bg-white text-brand-olive border border-brand-olive/10'
                  }`}>
                    {message.role === 'user' ? <User size={16} /> : <FastForward size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-brand-olive text-white rounded-tr-none' 
                      : 'bg-white text-brand-ink rounded-tl-none border border-black/5'
                  }`}>
                    <div className="markdown-body text-sm leading-relaxed">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                    <p className={`text-[10px] mt-2 opacity-50 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex justify-start"
            >
              <div className="flex gap-3 items-center text-brand-olive/60 bg-white/50 px-4 py-2 rounded-full border border-black/5">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs font-medium italic">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-6 bg-white border-t border-black/5">
        <div className="max-w-2xl mx-auto">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about FastForward Fluency..."
              className="w-full pl-6 pr-14 py-4 bg-brand-cream/50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-olive/20 focus:bg-white transition-all text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-brand-olive text-white rounded-xl hover:bg-brand-olive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </footer>

      {/* Mobile Booking Button (Fixed at bottom) */}
      <div className="sm:hidden p-4 bg-white border-t border-black/5">
        <a 
          href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2MUuwNnC_UE1X9PXRnYZA2GAXAMDyQX2eYUI21M6ZfuQfYhNTc5GJpS-TgADlicugc0lrLMSWz" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-brand-olive text-white rounded-xl font-semibold shadow-lg active:scale-95 transition-transform"
        >
          <Calendar size={18} />
          Schedule a Strategy Session
          <ArrowRight size={18} />
        </a>
      </div>
    </div>
  );
}
