import { useRoute, Link } from "wouter"
import { useGetMessage } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, AlertTriangle, Shield, CheckCircle2, Bot, Fingerprint, Database, Activity } from "lucide-react"
import { getGetMessageQueryKey } from "@workspace/api-client-react"

export function PredictionDetail() {
  const [, params] = useRoute("/predictions/:messageId")
  const messageId = params?.messageId || ""

  const { data, isLoading, error } = useGetMessage(messageId, {
    query: {
      enabled: !!messageId,
      queryKey: getGetMessageQueryKey(messageId)
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-secondary animate-pulse rounded" />
        <div className="h-48 bg-secondary animate-pulse rounded-lg" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-secondary animate-pulse rounded-lg" />
          <div className="h-64 bg-secondary animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-bold text-destructive">Signal Not Found</h2>
        <p className="text-muted-foreground font-mono mt-2">The requested intercept record does not exist.</p>
        <Link href="/predictions">
          <Button variant="outline" className="mt-6">Return to Ledger</Button>
        </Link>
      </div>
    )
  }

  const { message, prediction } = data

  const getScoreColor = (score: number, invert = false) => {
    const s = invert ? 1 - score : score;
    if (s > 0.8) return 'bg-destructive'
    if (s > 0.5) return 'bg-amber-500'
    return 'bg-primary'
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/predictions">
        <Button variant="ghost" className="font-mono text-xs pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          BACK TO LEDGER
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Context & Signals */}
        <div className="flex-1 space-y-6">
          <Card className="border-primary/20 shadow-[0_0_30px_rgba(0,255,136,0.05)] bg-gradient-to-b from-card to-card/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono text-muted-foreground uppercase flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Intercepted Payload
                </CardTitle>
                <span className="text-xs font-mono text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-black/40 rounded-lg border border-white/5 font-sans text-lg leading-relaxed shadow-inner">
                {message.messageText ? (
                  message.messageText
                ) : (
                  <span className="italic text-muted-foreground flex items-center gap-2">
                    [Encrypted Media Payload: {message.mediaType}]
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline" className="text-xs font-mono border-white/10">{message.conversationType} chat</Badge>
                {message.senderUserId && <Badge variant="outline" className="text-xs font-mono border-white/10">Sender: {message.senderUserId}</Badge>}
                {message.forwardedCount > 0 && (
                  <Badge variant="outline" className="text-xs font-mono border-amber-500/30 text-amber-500">
                    Forwarded {message.forwardedCount}x
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Raw Signal Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-muted-foreground">Scam Probability</span>
                  <span className={prediction.scamProbability > 0.5 ? 'text-destructive' : 'text-primary'}>
                    {(prediction.scamProbability * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={prediction.scamProbability * 100} className="h-1 bg-secondary" indicatorColor={getScoreColor(prediction.scamProbability)} />
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-muted-foreground">Spam Probability</span>
                  <span className={prediction.spamProbability > 0.5 ? 'text-amber-500' : 'text-primary'}>
                    {(prediction.spamProbability * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={prediction.spamProbability * 100} className="h-1 bg-secondary" indicatorColor={getScoreColor(prediction.spamProbability)} />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-muted-foreground">Urgency Score</span>
                  <span className={prediction.urgencyScore > 0.7 ? 'text-orange-500' : 'text-muted-foreground'}>
                    {(prediction.urgencyScore * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={prediction.urgencyScore * 100} className="h-1 bg-secondary" indicatorColor={getScoreColor(prediction.urgencyScore, true)} />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-muted-foreground">Business Trust</span>
                  <span className="text-primary">
                    {(prediction.businessTrustScore * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={prediction.businessTrustScore * 100} className="h-1 bg-secondary" indicatorColor={getScoreColor(1 - prediction.businessTrustScore)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Decision */}
        <div className="md:w-96 space-y-6">
          <Card className="border-white/5 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Bot className="w-32 h-32" />
            </div>
            
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Routing Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-black/30 rounded-xl border border-white/5 relative">
                <div className="text-xs font-mono text-muted-foreground mb-3">ACTION RESOLUTION</div>
                <Badge variant={prediction.action as any} className="text-xl px-6 py-2 shadow-xl">
                  {prediction.action}
                </Badge>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm font-mono">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-primary">{(prediction.confidence * 100).toFixed(1)}% Confidence</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono text-muted-foreground uppercase">Classified As</div>
                <div className="font-mono bg-secondary/50 p-2 rounded border border-white/5 inline-block text-sm">
                  {prediction.messageType}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono text-muted-foreground uppercase">Explainability Trace</div>
                <p className="text-sm leading-relaxed text-foreground/80 italic border-l-2 border-primary/50 pl-3 py-1">
                  "{prediction.reason}"
                </p>
              </div>

              {prediction.personalizationFactors && prediction.personalizationFactors.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-2">
                    <Fingerprint className="w-3 h-3" />
                    Personalization Factors
                  </div>
                  <ul className="space-y-1">
                    {prediction.personalizationFactors.map((factor, i) => (
                      <li key={i} className="text-xs font-mono text-foreground/70 flex items-start gap-2">
                        <span className="text-primary mt-0.5">›</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
