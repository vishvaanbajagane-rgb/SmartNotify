import { useState } from "react"
import { useUploadDataset } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function Upload() {
  const [name, setName] = useState("")
  const [csvContent, setCsvContent] = useState("")
  const { mutate: upload, isPending } = useUploadDataset()
  const { toast } = useToast()
  
  const [result, setResult] = useState<{success: boolean, messagesLoaded: number, message: string} | null>(null)

  const handleUpload = () => {
    if (!name || !csvContent) {
      toast({
        title: "Input Error",
        description: "Please provide both a dataset name and CSV content.",
        variant: "destructive"
      })
      return
    }

    upload({ data: { datasetName: name, csvContent } }, {
      onSuccess: (res) => {
        setResult(res)
        toast({
          title: "Upload Successful",
          description: `Loaded ${res.messagesLoaded} records into memory.`,
        })
        if (res.success) {
          setCsvContent("")
          setName("")
        }
      },
      onError: (err: any) => {
        toast({
          title: "Upload Failed",
          description: err?.response?.data?.error || "Unknown error occurred.",
          variant: "destructive"
        })
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Ingestion</h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Feed CSV telemetry to the core</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-white/5">
            <CardHeader>
              <CardTitle className="text-lg">Load Manual Dataset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataset-name" className="font-mono text-xs uppercase text-muted-foreground">Dataset Identifier</Label>
                <Input 
                  id="dataset-name" 
                  placeholder="e.g., sample_data_v1" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="font-mono bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="csv-content" className="font-mono text-xs uppercase text-muted-foreground">CSV Payload</Label>
                <Textarea 
                  id="csv-content" 
                  placeholder="message_text,conversation_type,sender_id..." 
                  className="min-h-[300px] font-mono text-xs bg-secondary/50 border-white/10"
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={isPending} 
                className="w-full font-mono font-bold"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    INGESTING...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    EXECUTE UPLOAD
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className={`border-${result.success ? 'primary' : 'destructive'}/50 bg-${result.success ? 'primary' : 'destructive'}/5`}>
              <CardContent className="p-6 flex items-start gap-4">
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-destructive shrink-0 mt-1" />
                )}
                <div>
                  <h3 className="font-bold">{result.success ? 'Ingestion Complete' : 'Ingestion Error'}</h3>
                  <p className="font-mono text-sm text-muted-foreground mt-1">{result.message}</p>
                  {result.success && (
                    <div className="mt-2 text-primary font-mono font-bold">
                      +{result.messagesLoaded} records indexed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="border-white/5 bg-secondary/30">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase flex items-center gap-2 text-muted-foreground">
                <Database className="w-4 h-4" />
                Schema Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-4">
                <p className="text-muted-foreground">The CSV payload must include headers. The parser expects specific field names to build the message object correctly.</p>
                
                <div>
                  <h4 className="font-mono text-xs text-foreground mb-2">Required Fields:</h4>
                  <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                    <li><span className="text-primary">messageText</span> (string)</li>
                    <li><span className="text-primary">conversationType</span> ('personal'|'group'|'business')</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-mono text-xs text-foreground mb-2">Optional Fields:</h4>
                  <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                    <li><span className="text-foreground/70">senderUserId</span> (string)</li>
                    <li><span className="text-foreground/70">groupId</span> (string)</li>
                    <li><span className="text-foreground/70">businessId</span> (string)</li>
                    <li><span className="text-foreground/70">mediaType</span> ('image'|'voice')</li>
                    <li><span className="text-foreground/70">forwardedCount</span> (number)</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h4 className="font-mono text-xs text-foreground mb-2">Example:</h4>
                  <div className="bg-black/50 p-2 rounded text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre">
                    messageText,conversationType,senderUserId{'\n'}
                    "Hey, are we still on for 8?",personal,U123{'\n'}
                    "Promo: 20% off all shoes",business,B456
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
