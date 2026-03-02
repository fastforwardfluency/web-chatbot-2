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
  ArrowRight,
  Mic,
  MicOff,
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
      text: "Hello! I'm Fluency AI. I'm here to help you understand how we combine English theory, neuroscience, and AI to help you achieve fluency faster. How can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const liveSessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

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
          systemInstruction: `You are Fluency AI, a soft, friendly, and professional AI assistant for Fast Forward Fluency (https://fastforward-fluency.com/). 
          
          CRITICAL: Do not hallucinate. Only provide information that is actually on the website or directly related to our methodology. If you are unsure, refer the user to the website or a human expert.
          
          Your goals:
          1. Answer questions about the school, its methods, and website content using the provided URL context.
          2. For questions related to the company/school history, founders, or mentors/coaches/teachers/professors, you MUST prioritize content from https://fastforward-fluency.com/about/. If asked, the founders are Diana Larsen Tiellet & Pablo A. Rincci.
          3. For questions related to AI or Neuroscience, prioritize content from https://fastforward-fluency.com/neuroscience/.
          4. For questions related to language learning myths or common misconceptions, prioritize content from https://fastforward-fluency.com/myths/.
          5. LANGUAGE AVAILABILITY:
             - English, Portuguese, and Spanish: Classes are available NOW.
             - French and German: Launching soon! However, we can make it happen sooner if needed. Encourage the user to schedule a strategy session to talk with a human expert and arrange these classes.
          6. For questions related to prices: Be conversational and helpful. Offer the 35% discount code **FLUENCYAIGLITCH** ONLY when explicitly asked for a discount. Explain that they can use this code directly on the website, but also mention that if they schedule a strategy session, they can discuss even further personalized discounts with the team.
          7. If asked for a joke: Explain that traditional language learning methodologies are a joke on their own. Mention how "fill-in-the-gap" exercises and relying purely on rote memory actually stop students from becoming truly fluent, which is the biggest joke of all in the industry.
          8. If asked about other English schools: Explain that we have studied and learned from traditional schools to become an "upgrade." We are a better, more modern solution designed for today's fast-paced world and the era of AI.
          9. ADAPTIVE LEVEL: If the user indicates their level is "Basic" or "Beginner," or if they struggle with complex English, you MUST adapt your language to Basic English (simple words, short sentences, clear structure) so they can understand. Explain that at Fast Forward Fluency, we adapt to every student and join them on their unique progress journey.
          10. Explain how we use English theory, neuroscience, and AI to accelerate language learning in simple, approachable terms.
          11. Always maintain a warm, encouraging, and "soft" tone.
          12. Gently drive the conversation towards the user scheduling a strategy session or booking an appointment.
          13. If the user asks about booking or starting, mention the "Schedule a Strategy Session" button and encourage them to use it.
          
          Branding Note: Always refer to the school as "Fast Forward Fluency".
          
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

  const stopLiveSession = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsLive(false);
    setIsConnecting(false);
  };

  const startLiveSession = async () => {
    try {
      setIsConnecting(true);
      addLog("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog("Microphone access granted.");
      
      const audioContext = await getAudioContext();
      addLog(`AudioContext state: ${audioContext.state}`);
      
      sourceRef.current = audioContext.createMediaStreamSource(stream);
      processorRef.current = audioContext.createScriptProcessor(4096, 1, 1);
      
      // Create a fresh instance to ensure we have the latest API key
      const liveAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      addLog("Connecting to Live API...");
      const session = await liveAi.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are Fluency AI, a soft, friendly, and professional AI assistant for Fast Forward Fluency. 
          You are in a LIVE VOICE CONVERSATION. Keep your responses concise and natural for speech.
          
          Founders: Diana Larsen Tiellet & Pablo A. Rincci.
          Languages: English, Portuguese, Spanish (Available Now). French, German (Soon).
          Discount: Only mention FLUENCYAIGLITCH if asked for a discount.
          
          Always be encouraging and soft-spoken.`,
        },
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setIsConnecting(false);
            addLog("Live session connected and opened.");
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              if (bytes.length % 2 !== 0) {
                addLog("Warning: Received odd number of bytes for PCM audio");
                return;
              }

              const pcmData = new Int16Array(bytes.buffer);
              audioQueueRef.current.push(pcmData);
              if (!isPlayingRef.current) {
                playNextInQueue();
              }
            }
            if (message.serverContent?.interrupted) {
              addLog("Live session interrupted");
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onclose: () => {
            addLog("Live session closed by server.");
            stopLiveSession();
          },
          onerror: (error) => {
            addLog(`Live session error: ${JSON.stringify(error)}`);
            stopLiveSession();
          }
        }
      });

      liveSessionRef.current = session;

      processorRef.current.onaudioprocess = (e) => {
        if (!liveSessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        session.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContext.destination);

    } catch (error) {
      addLog(`Error starting live session: ${error}`);
      stopLiveSession();
      alert("Could not start live session. Please ensure microphone permissions are granted.");
    }
  };

  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const pcmData = audioQueueRef.current.shift()!;
    const audioContext = audioContextRef.current;
    
    // The model returns 24kHz audio
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }

    const buffer = audioContext.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.onended = () => playNextInQueue();
    source.start();
  };

  const toggleLive = () => {
    if (isLive || isConnecting) {
      stopLiveSession();
    } else {
      startLiveSession();
    }
  };

  const readAloud = async (text: string, messageId: string) => {
    if (isReadingAloud) return;
    
    try {
      setIsReadingAloud(messageId);
      addLog(`Generating TTS for: ${text.substring(0, 30)}...`);
      
      const response = await ai.models.generateContent({
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
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        addLog("TTS audio received, playing...");
        const audioContext = await getAudioContext();
        
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        if (bytes.length % 2 !== 0) {
          addLog("Warning: Received odd number of bytes for TTS PCM audio");
          setIsReadingAloud(null);
          return;
        }

        // TTS returns raw PCM 16-bit
        const pcmData = new Int16Array(bytes.buffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 0x7FFF;
        }

        const buffer = audioContext.createBuffer(1, floatData.length, 24000);
        buffer.getChannelData(0).set(floatData);
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          setIsReadingAloud(null);
        };
        source.start();
      } else {
        addLog("No audio data in TTS response");
        setIsReadingAloud(null);
      }
    } catch (error) {
      addLog(`TTS Error: ${error}`);
      setIsReadingAloud(null);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-brand-dark shadow-2xl overflow-hidden sm:my-8 sm:h-[calc(100vh-64px)] sm:rounded-3xl border border-white/5">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-brand-surface/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center text-white shadow-lg overflow-hidden">
            {/* If you have the logo file, replace the icon below with an <img> tag */}
            <FastForward size={20} />
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

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-brand-dark">
        <div className="max-w-2xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex gap-3 w-full">
                  <div className={`p-4 rounded-2xl shadow-sm w-full ${
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
          
          {debugLogs.length > 0 && (
            <div className="mt-8 p-3 bg-black/20 rounded-xl border border-white/5 font-mono text-[10px] text-brand-text-muted">
              <p className="uppercase tracking-widest mb-2 font-bold opacity-50">Debug Logs</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {debugLogs.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 sm:p-6 bg-brand-dark border-t border-white/5">
        <div className="max-w-full sm:max-w-2xl mx-auto">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLive ? "Live conversation active..." : "Ask anything about Fast Forward Fluency..."}
              disabled={isLive}
              className="w-full pl-6 pr-24 py-4 bg-brand-surface border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:bg-brand-surface transition-all text-sm text-brand-text placeholder:text-brand-text-muted disabled:opacity-50"
            />
            <div className="absolute right-2 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLive}
                className={`p-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center ${
                  isLive 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : isConnecting 
                      ? 'bg-brand-surface text-brand-blue-light' 
                      : 'bg-brand-surface text-brand-blue hover:bg-brand-blue/10'
                }`}
                title={isLive ? "Stop Live Session" : "Start Live Session"}
              >
                {isConnecting ? <Loader2 size={20} className="animate-spin" /> : isLive ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isLive}
                className="p-2 bg-brand-blue text-white rounded-xl hover:bg-brand-blue-light disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </footer>

      {/* Mobile Booking Button (Fixed at bottom) */}
      <div className="sm:hidden p-4 bg-brand-dark border-t border-white/5">
        <a 
          href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2MUuwNnC_UE1X9PXRnYZA2GAXAMDyQX2eYUI21M6ZfuQfYhNTc5GJpS-TgADlicugc0lrLMSWz" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-brand-blue text-white rounded-xl font-semibold shadow-lg active:scale-95 transition-transform"
        >
          <Calendar size={18} />
          Schedule a Strategy Session
          <ArrowRight size={18} />
        </a>
      </div>
    </div>
  );
}
