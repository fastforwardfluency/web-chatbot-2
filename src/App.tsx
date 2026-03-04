import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
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
  ArrowRight,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modality, LiveServerMessage } from "@google/genai";

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
      text: "Hello! I'm the Fast Forward Fluency Assistant. I'm here to help you understand how we combine English theory, neuroscience, and AI to help you achieve fluency faster. How can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

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
      // Limit history to last 6 messages to keep prompt size small and fast
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const streamResponse = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: input }] }
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `You are the Fast Forward Fluency Assistant ("More than English"). 
          Mission: Transform language learning into professional confidence using neuroscience.
          
          ### KEY INFO
          - Founders: Diana Larsen Tiellet & Pablo A. Rincci.
          - Methodology: 4 Pillars (Dopamine Hook, System 1 Shift, Hebbian Learning, Amygdala Bypass).
          - Offerings: Business English (16 sessions), Interview Mastery (8), Travel (12), Mindset Mentorship.
          - Pricing (Monthly): Private (USD 270), The Mix (USD 216), Group (USD 162).
          - Discounts: 5% Quarterly, 8% Semiannual, 16.7% Annual. Promo: FLUENCYAIGLITCH (35% off).
          - AI Features: Brain Reports, Day After Protocol, Quarterly Audits.
          - Hiring: Mentors needed (fluent, tech-open).
          
          ### RULES
          - Goal: Conversion. Encourage scheduling a "Strategy Session".
          - Tone: Warm, professional, encouraging.
          - Length: Start with very short, concise answers. Elaborate only if asked.
          - CTA: Redirect to "Schedule a Strategy Session" button.`,
        }
      });

      const modelMessageId = (Date.now() + 1).toString();
      let fullText = "";
      let displayedText = "";
      let streamFinished = false;

      setMessages(prev => [...prev, {
        id: modelMessageId,
        role: 'model',
        text: "",
        timestamp: new Date(),
      }]);

      setIsLoading(false);

      // Optimized typewriter effect
      const updateDisplay = () => {
        if (displayedText.length < fullText.length) {
          const diff = fullText.length - displayedText.length;
          // Faster catch-up logic
          const charsToAdd = diff > 100 ? Math.ceil(diff / 2) : (diff > 20 ? 5 : 2);
          
          displayedText += fullText.substring(displayedText.length, displayedText.length + charsToAdd);
          
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: displayedText } : msg
          ));
        }
        
        if (!streamFinished || displayedText.length < fullText.length) {
          requestAnimationFrame(() => setTimeout(updateDisplay, 20));
        }
      };

      updateDisplay();

      for await (const chunk of streamResponse) {
        if (chunk.text) {
          fullText += chunk.text;
        }
      }
      streamFinished = true;

      if (!fullText) {
        setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId ? { ...msg, text: "I'm sorry, I couldn't process that. Could you try again?" } : msg
        ));
      }
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

  const readAloud = async (text: string, messageId: string) => {
    if (isReadingAloud) return;
    
    try {
      setIsReadingAloud(messageId);
      
      // Prime the media channel on mobile browsers so volume buttons work correctly
      const primer = document.getElementById('media-primer') as HTMLAudioElement;
      if (primer) {
        primer.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
        primer.play().catch(() => {});
      }
      
      // Start API call and audio context resume in parallel for maximum speed
      const [response, audioContext] = await Promise.all([
        ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Zephyr' },
              },
            },
          },
        }),
        getAudioContext().then(async (ctx) => {
          if (ctx.state === 'suspended') await ctx.resume();
          return ctx;
        })
      ]);

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // Faster base64 to Uint8Array conversion
        const bytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
        
        if (bytes.length % 2 !== 0) {
          setIsReadingAloud(null);
          return;
        }

        // TTS returns raw PCM 16-bit. Optimized conversion to Float32.
        const pcmData = new Int16Array(bytes.buffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] * 0.000030517578125; // Equivalent to / 32768 but faster multiplication
        }

        const buffer = audioContext.createBuffer(1, floatData.length, 24000);
        buffer.getChannelData(0).set(floatData);
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          setIsReadingAloud(null);
        };
        source.start(0);
      } else {
        setIsReadingAloud(null);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsReadingAloud(null);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-brand-dark overflow-hidden sm:rounded-2xl border border-white/5">
      {/* Hidden audio element to prime media channel on mobile */}
      <audio id="media-primer" className="hidden" aria-hidden="true" />
      
      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-brand-dark">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex gap-3 w-full">
                  <div className={`p-3 sm:p-4 rounded-2xl shadow-sm w-full ${
                    message.role === 'user' 
                      ? 'bg-brand-blue text-white rounded-tr-none' 
                      : 'bg-brand-surface text-brand-text rounded-tl-none border border-white/5'
                  }`}>
                    <div className="markdown-body text-sm leading-relaxed">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-[10px] opacity-50 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {message.role === 'model' && (
                        <button
                          onClick={() => readAloud(message.text, message.id)}
                          disabled={isReadingAloud !== null}
                          className={`p-1.5 rounded-lg transition-all hover:bg-white/10 ${
                            isReadingAloud === message.id ? 'text-brand-blue-light animate-pulse' : 'text-brand-text-muted'
                          }`}
                          title="Read Aloud"
                        >
                          {isReadingAloud === message.id ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                        </button>
                      )}
                    </div>
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
              <div className="flex gap-3 items-center text-brand-blue-light bg-brand-surface px-4 py-2 rounded-full border border-white/5">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs font-medium italic">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-2 sm:p-6 bg-brand-dark border-t border-white/5">
        <div className="max-w-full sm:max-w-2xl mx-auto">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Fast Forward Fluency... "
              className="w-full pl-6 pr-16 py-3 sm:py-4 bg-brand-surface border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:bg-brand-surface transition-all text-base sm:text-sm text-brand-text placeholder:text-[9px] sm:placeholder:text-sm placeholder:text-brand-text-muted disabled:opacity-50"
            />
            <div className="absolute right-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-brand-blue text-white rounded-xl hover:bg-brand-blue-light disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </footer>

      {/* Mobile Booking Button (Fixed at bottom) */}
      <div className="sm:hidden p-2 bg-brand-dark border-t border-white/5">
        <a 
          href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2MUuwNnC_UE1X9PXRnYZA2GAXAMDyQX2eYUI21M6ZfuQfYhNTc5GJpS-TgADlicugc0lrLMSWz" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-blue text-white rounded-xl font-semibold shadow-lg active:scale-95 transition-transform text-sm"
        >
          <Calendar size={18} />
          Schedule a Strategy Session
          <ArrowRight size={18} />
        </a>
      </div>
    </div>
  );
}
