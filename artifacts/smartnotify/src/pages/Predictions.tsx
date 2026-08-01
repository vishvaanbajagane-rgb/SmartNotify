import { useState } from "react"
import { useListMessages, useExportPredictions } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, AlertCircle } from "lucide-react"
import { Link } from "wouter"
import { formatDate } from "@/lib/utils"

export function Predictions() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Use the generated hook with params
  const { data: messages, isLoading, error } = useListMessages({
    search: search || undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    messageType: typeFilter !== "all" ? typeFilter : undefined,
  })

  // We fetch export directly or use the query? The requirement says:
  // "Export CSV button that triggers useExportPredictions() and creates a download link"
  const { refetch: exportData, isFetching: isExporting } = useExportPredictions({
    query: { enabled: false }
  })

  const handleExport = async () => {
    try {
      const { data } = await exportData()
      if (data?.csvContent) {
        const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'predictions_export.csv')
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (data?.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      }
    } catch (e) {
      console.error("Export failed", e)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictions Log</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Raw classification ledger</p>
        </div>
        <Button onClick={handleExport} disabled={isExporting} variant="outline" className="font-mono border-primary/20 hover:bg-primary/10 hover:text-primary text-xs">
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "EXPORTING..." : "EXPORT CSV"}
        </Button>
      </div>

      <Card className="border-white/5">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search message text..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 font-mono bg-secondary/50 border-white/10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[150px] font-mono bg-secondary/50 border-white/10">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ALL ACTIONS</SelectItem>
                  <SelectItem value="notify">NOTIFY</SelectItem>
                  <SelectItem value="digest">DIGEST</SelectItem>
                  <SelectItem value="mute">MUTE</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px] font-mono bg-secondary/50 border-white/10">
                  <SelectValue placeholder="Message Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ALL TYPES</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="scam">Scam</SelectItem>
                  <SelectItem value="business_update">Business Update</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-white/5">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-secondary animate-pulse rounded" />)}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-destructive">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-mono">Failed to fetch ledger data</p>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-mono">
            No entries found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/80 font-mono text-xs text-muted-foreground border-b border-border/50 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium w-1/3">Message Context</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium text-center">Decision</th>
                  <th className="px-6 py-4 font-medium text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {messages.map((row) => (
                  <tr key={row.message.messageId} className="hover:bg-secondary/40 transition-colors group cursor-pointer" onClick={() => window.location.href = `/predictions/${row.message.messageId}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-mono text-xs">
                      {formatDate(row.message.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="line-clamp-2 text-foreground/90">
                        {row.message.messageText || `[Media: ${row.message.mediaType}]`}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground font-mono">
                        {row.message.senderUserId || 'Unknown Sender'} 
                        {row.message.groupId ? ' • Group' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-[10px] bg-secondary border-border">
                        {row.prediction.messageType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge variant={row.prediction.action as any}>
                        {row.prediction.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-xs">
                      <span className={row.prediction.confidence > 0.9 ? "text-primary" : "text-muted-foreground"}>
                        {(row.prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
