import { useEffect } from "react"
import { motion } from "framer-motion"
import { useGetDashboardStats } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Cell as PieCell } from "recharts"
import { Activity, Bell, BellOff, MessageSquare, ShieldAlert, Zap } from "lucide-react"
import { formatNumber, formatPercentage, formatDate } from "@/lib/utils"
import { Link } from "wouter"

const COLORS = {
  notify: 'hsl(152, 100%, 50%)',
  digest: 'hsl(45, 100%, 50%)',
  mute: 'hsl(215, 20%, 65%)',
}

export function Dashboard() {
  const { data: stats, isLoading, error } = useGetDashboardStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-secondary animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-secondary animate-pulse rounded-lg" />)}
        </div>
        <div className="h-96 bg-secondary animate-pulse rounded-lg" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-6 text-center text-destructive">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Failed to load telemetry</h2>
        <p className="font-mono text-sm opacity-80 mt-2">Check connection to API core.</p>
      </div>
    )
  }

  const actionData = [
    { name: 'Notify', value: stats.notifyCount, color: COLORS.notify },
    { name: 'Digest', value: stats.digestCount, color: COLORS.digest },
    { name: 'Mute', value: stats.muteCount, color: COLORS.mute },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Live routing telemetry</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Receiving Signals
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Ingested" value={formatNumber(stats.totalMessages)} icon={MessageSquare} />
        <StatCard title="Push Notifications" value={formatNumber(stats.notifyCount)} icon={Bell} trend={((stats.notifyCount / stats.totalMessages) * 100).toFixed(1) + "% of total"} color="text-primary" />
        <StatCard title="Silenced (Mute/Digest)" value={formatNumber(stats.muteCount + stats.digestCount)} icon={BellOff} trend="Noise reduction" color="text-muted-foreground" />
        <StatCard title="Avg Confidence" value={formatPercentage(stats.averageConfidence)} icon={Activity} trend="AI certainty" color="text-primary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.messagesByType} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="type" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'monospace' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.messagesByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(215, 100%, ${Math.max(40, 80 - index * 5)}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Action Split</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={actionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {actionData.map((entry, index) => (
                          <PieCell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'monospace' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-xs font-mono">
                  {actionData.map(d => (
                    <div key={d.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Threat Detection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-destructive" />
                    <span className="font-mono text-sm">Scams Blocked</span>
                  </div>
                  <span className="text-xl font-bold text-destructive">{stats.scamCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <span className="font-mono text-sm">Urgent Escalated</span>
                  </div>
                  <span className="text-xl font-bold text-orange-500">{stats.urgentCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Live Feed Column */}
        <div className="lg:col-span-1">
          <Card className="h-full border-primary/20 shadow-[0_0_20px_rgba(0,255,136,0.05)]">
            <CardHeader className="border-b border-border/50 bg-secondary/50">
              <CardTitle className="text-lg flex items-center justify-between">
                Live Intercepts
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {stats.recentMessages.slice(0, 8).map((mp) => (
                  <Link key={mp.message.messageId} href={`/predictions/${mp.message.messageId}`}>
                    <div className="p-4 hover:bg-secondary/40 cursor-pointer transition-colors group">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={mp.prediction.action as any} className="scale-90 origin-left">
                          {mp.prediction.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {(mp.prediction.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 text-foreground/90 group-hover:text-foreground transition-colors">
                        {mp.message.messageText || "[Media Message]"}
                      </p>
                      <div className="mt-2 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                        {mp.prediction.messageType} • {mp.message.conversationType}
                      </div>
                    </div>
                  </Link>
                ))}
                {stats.recentMessages.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground font-mono text-sm">
                    No signals intercepted yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, color = "text-foreground" }: any) {
  return (
    <Card className="overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">{title}</span>
          <Icon className={`w-5 h-5 ${color} opacity-80`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${color}`}>{value}</span>
        </div>
        {trend && (
          <div className="mt-2 text-xs text-muted-foreground font-mono">
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
