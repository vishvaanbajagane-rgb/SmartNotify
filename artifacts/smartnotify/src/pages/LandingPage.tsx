import { motion } from "framer-motion"
import { ArrowRight, BrainCircuit, Activity, ShieldAlert, Cpu, Zap, Database } from "lucide-react"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground mission-grid overflow-x-hidden selection:bg-primary/30">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono font-bold text-xl text-primary">
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
            SmartNotify AI
          </div>
          <div className="hidden md:flex items-center gap-6 font-mono text-sm">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Architecture</a>
            <a href="#pipeline" className="text-muted-foreground hover:text-primary transition-colors">Pipeline</a>
            <a href="#tech" className="text-muted-foreground hover:text-primary transition-colors">Stack</a>
            <Link href="/dashboard" className="text-primary hover:text-primary/80 transition-colors">Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              System Active v1.0.0
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-bold tracking-tight">
              Tame the <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
                Chaos.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted-foreground max-w-lg font-mono leading-relaxed">
              A precision AI command center that routes WhatsApp notifications in real-time. 
              Zero noise. Maximum explainability.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="font-mono text-lg h-14 px-8 group">
                  Enter Mission Control
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/simulate">
                <Button variant="outline" size="lg" className="font-mono text-lg h-14 px-8 border-primary/20 hover:bg-primary/10">
                  Run Live Simulation
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
            <div className="glass-panel p-6 rounded-2xl border border-primary/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              
              {/* Fake Terminal / Feed */}
              <div className="space-y-4 font-mono text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 border-b border-white/5 pb-2">
                  <span>LIVE_STREAM // WA_INGEST</span>
                  <span className="text-primary animate-pulse">REC_ACTIVE</span>
                </div>
                
                {[
                  { text: "Mom: Call me when you land!", type: "personal", action: "notify", confidence: 99.4 },
                  { text: "MegaSale: 50% OFF ALL ITEMS TODAY ONLY!!!", type: "promotion", action: "mute", confidence: 98.1 },
                  { text: "Uber: Your driver is arriving in 2 mins.", type: "urgent", action: "notify", confidence: 97.8 },
                  { text: "Project Alpha Group: 14 unread messages", type: "group", action: "digest", confidence: 92.5 }
                ].map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.2) }}
                    className="p-3 bg-black/40 rounded border border-white/5 flex flex-col gap-2"
                  >
                    <div className="text-gray-300 truncate">{msg.text}</div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex gap-2">
                        <Badge variant={msg.action as any}>{msg.action}</Badge>
                        <span className="text-muted-foreground">[{msg.type}]</span>
                      </div>
                      <span className="text-primary">{msg.confidence}% CONF</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Divider */}
      <section className="border-y border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto py-8 px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Processing Latency", value: "< 50ms" },
            { label: "Classification Acc", value: "98.4%" },
            { label: "Noise Reduction", value: "73%" },
            { label: "Signals per Msg", value: "12+" }
          ].map((stat, i) => (
            <div key={i} className="text-center font-mono">
              <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Intelligence Architecture</h2>
            <p className="text-muted-foreground font-mono max-w-2xl mx-auto">
              Not just a regex filter. A multi-layered neural pipeline evaluating context, urgency, and relationships.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: BrainCircuit, title: "Contextual Awareness", desc: "Understands the difference between a boss asking for an update and a newsletter sending one." },
              { icon: Activity, title: "Urgency Detection", desc: "Bypasses all rules for genuinely critical alerts: OTPs, rideshares, flight changes." },
              { icon: ShieldAlert, title: "Scam & Spam Shield", desc: "Pattern recognition catches phishing attempts and unsolicited promotions before they buzz." }
            ].map((feature, i) => (
              <div key={i} className="glass-panel p-8 rounded-xl border-t-primary/20 hover:bg-secondary/40 transition-colors">
                <feature.icon className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline Diagram */}
      <section id="pipeline" className="py-24 px-6 bg-black/40 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Decision Pipeline</h2>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0" />
            
            <div className="space-y-12">
              {[
                { step: "01", title: "Ingestion & Metadata", desc: "Raw text, sender ID, group context, and forward count extracted." },
                { step: "02", title: "Vector Embeddings", desc: "Message mapped to semantic space to understand intent." },
                { step: "03", title: "Signal Extraction", desc: "Confidence scores generated for Spam, Scam, Urgency, and Trust." },
                { step: "04", title: "Final Routing", desc: "Rules engine + ML classifier assigns NOTIFY, DIGEST, or MUTE." }
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col md:flex-row items-center gap-8 md:even:flex-row-reverse group">
                  <div className="w-16 h-16 rounded-full bg-secondary border border-primary/30 flex items-center justify-center font-mono text-primary font-bold z-10 shadow-[0_0_15px_rgba(0,255,136,0.2)] group-hover:bg-primary group-hover:text-black transition-colors">
                    {item.step}
                  </div>
                  <div className="flex-1 glass-panel p-6 rounded-lg w-full">
                    <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-muted-foreground text-sm font-mono">{item.desc}</p>
                  </div>
                  <div className="hidden md:block flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Powered By</h2>
          <div className="flex flex-wrap justify-center gap-8 opacity-60 font-mono text-xl tracking-widest uppercase">
            <span>React</span>
            <span className="text-primary">•</span>
            <span>Vite</span>
            <span className="text-primary">•</span>
            <span>Tailwind</span>
            <span className="text-primary">•</span>
            <span>Recharts</span>
            <span className="text-primary">•</span>
            <span>FastAPI</span>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to see it in action?</h2>
          <p className="text-muted-foreground font-mono mb-10">
            Deploy the simulation and watch the router categorize incoming messages live.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="font-mono text-xl h-16 px-10">
              Initialize Dashboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
