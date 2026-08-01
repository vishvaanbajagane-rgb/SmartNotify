import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useListMessages } from "@workspace/api-client-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Square, FastForward, Activity, Smartphone } from "lucide-react"

// Types matching the API schema
type SimulatedMessage = {
  id: string;
  text: string;
  sender: string;
  time: string;
  type: string;
  prediction: {
    action: 'notify' | 'digest' | 'mute';
    confidence: number;
    reason: string;
  };
}

export function Simulate() {
  const { data: messages } = useListMessages()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1) // 1x, 2x, 5x
  const [stream, setStream] = useState<SimulatedMessage[]>([])
  const currentIndex = useRef(0)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isPlaying && messages && messages.length > 0) {
      const processNext = () => {
        if (currentIndex.current >= messages.length) {
          currentIndex.current = 0; // loop
        }
        
        const nextMsg = messages[currentIndex.current]
        const simMsg: SimulatedMessage = {
          id: nextMsg.message.messageId + '-' + Date.now(),
          text: nextMsg.message.messageText || '[Media]',
          sender: nextMsg.message.senderUserId || (nextMsg.message.conversationType === 'group' ? 'Group Chat' : 'Unknown'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: nextMsg.message.conversationType,
          prediction: {
            action: nextMsg.prediction.action,
            confidence: nextMsg.prediction.confidence,
            reason: nextMsg.prediction.reason
          }
        }

        // 1. Show "analyzing" state
        setProcessingId(simMsg.id)
        setStream(prev => [...prev.slice(-7), simMsg]) // Keep last 8

        // 2. Resolve prediction after delay
        timeout = setTimeout(() => {
          setProcessingId(null)
          currentIndex.current += 1
          
          // Next message scheduling
          timeout = setTimeout(processNext, 1500 / speed)
        }, 800 / speed)
      }

      processNext()
    }

    return () => clearTimeout(timeout)
  }, [isPlaying, messages, speed])

  const toggleSpeed = () => {
    setSpeed(s => s === 1 ? 2 : s === 2 ? 5 : 1)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Simulation</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Watch the router process messages in real-time</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSpeed}
            className="font-mono border-white/10"
          >
            <FastForward className="w-4 h-4 mr-2" />
            {speed}x SPEED
          </Button>
          <Button 
            onClick={() => setIsPlaying(!isPlaying)}
            variant={isPlaying ? "destructive" : "default"}
            className="font-mono w-32"
          >
            {isPlaying ? (
              <><Square className="w-4 h-4 mr-2 fill-current" /> STOP</>
            ) : (
              <><Play className="w-4 h-4 mr-2 fill-current" /> START</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-8 min-h-0">
        {/* Device View */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-[320px] h-[650px] bg-black rounded-[3rem] border-8 border-secondary shadow-2xl overflow-hidden flex flex-col">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-secondary rounded-b-xl z-20" />
            
            <div className="bg-secondary/50 p-4 pt-8 text-center border-b border-white/5 shadow-md z-10 shrink-0 backdrop-blur-md">
              <h3 className="font-bold text-sm">Lock Screen</h3>
              <p className="text-xs text-muted-foreground">Notification Center</p>
            </div>
            
            <div className="flex-1 overflow-hidden p-4 space-y-3 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center flex flex-col justify-end pb-12 relative">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              
              <AnimatePresence mode="popLayout">
                {stream.filter(m => processingId !== m.id && m.prediction.action === 'notify').map((msg) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="relative z-10 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                        <MessageSquareIcon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">WhatsApp</span>
                      <span className="text-xs text-white/50 ml-auto">{msg.time}</span>
                    </div>
                    <div className="pl-7">
                      <div className="font-semibold text-sm text-white">{msg.sender}</div>
                      <div className="text-sm text-white/80 line-clamp-2">{msg.text}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Engine View */}
        <div className="flex flex-col min-h-0 bg-secondary/20 rounded-xl border border-white/5 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none grid grid-cols-[1px_1fr] md:grid-cols-[1px_1fr] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          <div className="p-4 bg-secondary/80 border-b border-white/5 flex items-center justify-between shrink-0 relative z-10">
            <h3 className="font-mono font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Router Processing Stream
            </h3>
            {isPlaying && (
              <div className="flex items-center gap-2 text-xs font-mono text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ANALYZING
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10 flex flex-col-reverse">
            <AnimatePresence initial={false}>
              {[...stream].reverse().map((msg) => {
                const isProcessing = msg.id === processingId;
                return (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded border font-mono text-sm relative overflow-hidden transition-colors ${
                      isProcessing ? 'bg-secondary border-primary/50' : 'bg-black/40 border-white/5'
                    }`}
                  >
                    {isProcessing && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary animate-pulse" />
                    )}
                    
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-muted-foreground truncate max-w-[70%]">
                        [{msg.sender}] {msg.text}
                      </div>
                      <div className="text-xs shrink-0">
                        {isProcessing ? (
                          <span className="text-primary animate-pulse">EVALUATING...</span>
                        ) : (
                          <span className="text-muted-foreground">{msg.time}</span>
                        )}
                      </div>
                    </div>

                    {!isProcessing && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant={msg.prediction.action}>{msg.prediction.action}</Badge>
                          <span className={msg.prediction.confidence > 0.9 ? 'text-primary' : 'text-muted-foreground'}>
                            {(msg.prediction.confidence * 100).toFixed(1)}% CONF
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground/80 italic line-clamp-1 border-l border-white/10 pl-2">
                          {msg.prediction.reason}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {!isPlaying && stream.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono h-full">
                Press START to begin ingestion simulation
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
