import * as React from "react"
import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import { Activity, BarChart3, Database, Home, LayoutDashboard, Play, Settings } from "lucide-react"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/predictions", label: "Predictions Feed", icon: Activity },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/simulate", label: "Live Simulation", icon: Play },
    { href: "/upload", label: "Dataset Upload", icon: Database },
  ]

  return (
    <div className="flex min-h-screen bg-background text-foreground mission-grid">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card/50 backdrop-blur-sm flex flex-col z-10 hidden md:flex sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/">
            <div className="flex items-center gap-2 font-mono font-bold text-xl text-primary cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
              SmartNotify AI
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all cursor-pointer font-mono text-sm",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_10px_rgba(0,255,136,0.05)]" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary" />
            System Online
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none h-96" />
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
