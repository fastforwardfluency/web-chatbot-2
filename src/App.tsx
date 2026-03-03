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
      const streamResponse = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
          ...messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: input }] }
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `You are the Fast Forward Fluency Assistant. Your motto is "More than English." 
          Your mission is to transform language learning into professional confidence using a neuroscience-based approach.
          
          ### IDENTITY & MISSION
          - **Name**: Fast Forward Fluency Assistant.
          - **Founders**: Diana Larsen Tiellet & Pablo A. Rincci (Mention only if explicitly asked).
          - **Legal Entity**: Diana Larsen Tiellet (CNPJ 43.063.620/0001-82), Rio de Janeiro, Brazil.
          
          ### CONVERSION & SALES STRATEGY
          - **Goal**: Always focus on conversion. Understand the client's specific needs first.
          - **Offerings**: Offer specific plans (Business, Interview, Travel) or monthly subscriptions (Private 1:1, Group, or The Mix).
          - **Call to Action**: Continuously encourage scheduling a **Strategy Session** with a specialist to personalize their journey.
          
          ### METHODOLOGY (The 4 Neuroscience Pillars)
          1. **The Dopamine Hook**: We use high-interest topics (Leadership, Global Trends) to engage the brain's Reward System. Boredom shuts down learning; interest releases Dopamine, acting as a "Save Button" for memory.
          2. **System 1 Shift**: We move English from System 2 (slow translation) to System 1 (fast, intuitive instinct). High-speed interaction builds Myelin sheaths for automatic responses.
          3. **Hebbian Learning**: "Neurons that fire together, wire together." Grammar is internalized through usage and Synaptogenesis (forming new connections), not drills.
          4. **Amygdala Bypass**: We create a "Low-Affective Filter" environment to prevent the "freeze" response, keeping the brain in a state of neuroplasticity.
          
          ### PROGRAMS & PRICING
          - **Business English** (16 sessions): For corporate authority and negotiations.
          - **Job Interview Mastery** (8 sessions): Specialized behavioral question prep.
          - **Travel & Living Abroad** (12 sessions): Practical fluency for international life.
          - **Mindset Mentorship**: Hybrid video + 1:1 sessions to unblock psychological barriers.
          - **Monthly Rates**: Private 1:1 (USD 270), The Mix (USD 216), Group Sessions (USD 162).
          
          ### DISCOUNTS & PARTNERSHIPS
          - **Standard**: 5% Quarterly, 8% Semiannual, 16.7% (2 months free) Annual.
          - **Special**: Mention partnership with https://cursohub.com/ for special offers.
          - **Promo Code**: Use FLUENCYAIGLITCH for a 35% discount if explicitly asked.
          - **Note**: Credit card payments incur a 4% fee.
          
          ### AI FEATURES (The Feedback Loop)
          - **Personalized Brain Reports**: Delivered after every session. Provides Precision Error Correction and Vocabulary Realignment.
          - **Day After Protocol**: Interactive Slides (processed 60k faster than text), Deep-Dive Podcasts (auditory encoding), and Infographics to fight the "Forgetting Curve."
          - **Quarterly Audits**: Objective diagnostic reports every 3 months evaluating phonetic accuracy and lexical range.
          
          ### POLICIES (T&C)
          - **Absences**: Individuals get 1 makeup/month (24h notice). No makeup for group sessions.
          - **Changes**: Upgrades are immediate; downgrades or cancellations require 30-day notice.
          - **Termination**: Requires at least 1-month notice.
          
          ### RECRUITMENT
          - We are hiring mentors! Requirements: Fluent English, passion for growth, openness to technology/AI. 100% online.
          
          ### STRATEGY & MYTH-BUSTING
          - **Living Abroad**: Not necessary; we create immersion digitally.
          - **Accents**: Clarity over "sounding native." Your accent is your identity.
          - **Adult Learning**: Adult brains are highly capable due to neuroplasticity.
          - **Grammar**: Speaking comes first; perfection is a result, not a prerequisite.
          - **Action**: Redirect leads to "Schedule a Strategy Session" (use the button in the UI).
          
          Always be warm, professional, and encouraging. 
          **CRITICAL RESPONSE LENGTH RULE**: Provide very short, concise answers at first. If the user asks for more details, follows up on a topic, or says "tell me more," elaborate more in each subsequent response.`,
        }
      });

      const modelMessageId = (Date.now() + 1).toString();
      let fullText = "";
      let displayedText = "";
      let streamFinished = false;

      // Initial empty message to show loading state is over and text is coming
      setMessages(prev => [...prev, {
        id: modelMessageId,
        role: 'model',
        text: "",
        timestamp: new Date(),
      }]);

      setIsLoading(false);

      // Typewriter effect to make text appear "written" slowly
      const updateDisplay = () => {
        if (displayedText.length < fullText.length) {
          // Calculate how many characters to add. 
          // If we're falling behind, we add more characters to keep up, but still maintain the "writing" feel.
          const diff = fullText.length - displayedText.length;
          const charsToAdd = diff > 50 ? Math.ceil(diff / 5) : 1;
          
          displayedText += fullText.substring(displayedText.length, displayedText.length + charsToAdd);
          
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: displayedText } : msg
          ));
        }
        
        if (!streamFinished || displayedText.length < fullText.length) {
          setTimeout(updateDisplay, 40); // Slower updates (40ms instead of 10ms)
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
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-brand-dark shadow-2xl overflow-hidden sm:my-8 sm:h-[calc(100vh-64px)] sm:rounded-3xl border border-white/5">
      {/* Header */}
      <header className="px-4 py-2 sm:px-6 sm:py-4 border-b border-white/5 bg-brand-surface/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 w-full justify-center sm:w-auto sm:justify-start">
          <div className="w-10 h-10 bg-[#1a1c1e] rounded-full flex items-center justify-center text-white shadow-lg border border-white/10 overflow-hidden">
            <img 
              src="https://fastforward-fluency.com/wp-content/uploads/2026/03/FFF-AI-logo-50x50p.png" 
              alt="Fast Forward Fluency" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
              }}
              referrerPolicy="no-referrer"
            />
            <FastForward size={20} className="fallback-icon hidden" />
          </div>
          <div>
            <h1 className="font-poppins text-xl font-bold tracking-tight text-brand-text">Fluency AI</h1>
            <p className="text-[10px] uppercase tracking-widest text-brand-blue-light font-semibold">Fast Forward Fluency</p>
          </div>
        </div>
        
        <a 
          href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2MUuwNnC_UE1X9PXRnYZA2GAXAMDyQX2eYUI21M6ZfuQfYhNTc5GJpS-TgADlicugc0lrLMSWz" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-full text-sm font-medium hover:bg-brand-blue-light transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Calendar size={16} />
          Schedule a Strategy Session
        </a>
      </header>

      {/* Hidden audio element to prime media channel on mobile */}
      <audio id="media-primer" className="hidden" aria-hidden="true" />
      
      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-brand-dark">
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
