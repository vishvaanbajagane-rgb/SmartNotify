import { useGetAnalytics } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { AlertCircle } from "lucide-react"

const COLORS = {
  notify: 'hsl(152, 100%, 50%)',
  digest: 'hsl(45, 100%, 50%)',
  mute: 'hsl(215, 20%, 65%)',
  chart1: 'hsl(152, 100%, 50%)',
  chart2: 'hsl(215, 100%, 60%)',
  chart3: 'hsl(45, 100%, 50%)',
  chart4: 'hsl(280, 100%, 60%)',
}

export function Analytics() {
  const { data, isLoading, error } = useGetAnalytics()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-secondary animate-pulse rounded" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-[400px] bg-secondary animate-pulse rounded-lg" />
          <div className="h-[400px] bg-secondary animate-pulse rounded-lg" />
          <div className="h-[400px] bg-secondary animate-pulse rounded-lg lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center text-destructive">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Analytics Engine Offline</h2>
        <p className="font-mono text-sm opacity-80 mt-2">Unable to process historical data.</p>
      </div>
    )
  }

  const customTooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    fontFamily: 'monospace',
    color: 'hsl(var(--foreground))'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Macro Analytics</h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">System-wide pattern recognition</p>
      </div>

      <Card className="border-white/5">
        <CardHeader>
          <CardTitle className="text-lg">Daily Routing Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNotify" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.notify} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.notify} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDigest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.digest} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.digest} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMute" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.mute} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.mute} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
                <Area type="monotone" dataKey="notify" name="Notify" stroke={COLORS.notify} fillOpacity={1} fill="url(#colorNotify)" />
                <Area type="monotone" dataKey="digest" name="Digest" stroke={COLORS.digest} fillOpacity={1} fill="url(#colorDigest)" />
                <Area type="monotone" dataKey="mute" name="Mute" stroke={COLORS.mute} fillOpacity={1} fill="url(#colorMute)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Topology by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.messageTypeDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#888" fontSize={11} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.messageTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(215, 100%, ${Math.max(40, 80 - index * 5)}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Conversation Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.conversationTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.conversationTypeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Confidence Histogram</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.confidenceDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(0,255,136,0.05)' }} />
                  <Bar dataKey="value" fill={COLORS.chart1} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
