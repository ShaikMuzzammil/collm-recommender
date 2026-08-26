"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  BrainCircuit, LayoutDashboard, Network, Box, FlaskConical, Zap, Database,
  Download, Code2, Cpu, BarChart3, FolderOpen, MessageSquare, ChevronLeft,
  ChevronRight, Menu, LogOut, User, Settings, Moon, Sun, Activity, Bell, Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useStore, type TabId } from "@/lib/store";
import { cn } from "@/lib/utils";

// Section imports
import DashboardSection from "@/components/collm/DashboardSection";
import TrainingSection from "@/components/collm/TrainingSection";
import EvaluationSection from "@/components/collm/EvaluationSection";
import AnalyticsSection from "@/components/collm/AnalyticsSection";
import WorkspaceSection from "@/components/collm/WorkspaceSection";
import ExportSection from "@/components/collm/ExportSection";
import ContactSection from "@/components/collm/ContactSection";

// Lazy-loaded existing sections
import dynamic from "next/dynamic";
const ArchitectureSection = dynamic(() => import("@/components/collm/ArchitectureSection"), { ssr: false });
const ModelsSection = dynamic(() => import("@/components/collm/ModelsSection"), { ssr: false });
const ExperimentsSection = dynamic(() => import("@/components/collm/ExperimentsSection"), { ssr: false });
const RecommendSection = dynamic(() => import("@/components/collm/RecommendSection"), { ssr: false });
const DatasetsSection = dynamic(() => import("@/components/collm/DatasetsSection"), { ssr: false });
const ApiDocsSection = dynamic(() => import("@/components/collm/ApiDocsSection"), { ssr: false });

interface NavItem { id: TabId; label: string; icon: any; badge?: string; group: string; }

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",    label: "Dashboard",       icon: LayoutDashboard, group: "overview" },
  { id: "architecture", label: "Architecture",    icon: Network,         group: "overview" },
  { id: "models",       label: "Collab Models",   icon: Box,             group: "overview" },
  { id: "training",     label: "Training",        icon: Cpu,             group: "ml", badge: "Live" },
  { id: "evaluation",   label: "Evaluation",      icon: FlaskConical,    group: "ml" },
  { id: "experiments",  label: "Experiments",     icon: BarChart3,       group: "ml" },
  { id: "recommend",    label: "Inference",        icon: Zap,             group: "ml" },
  { id: "analytics",    label: "Analytics",       icon: Activity,        group: "insights" },
  { id: "datasets",     label: "Datasets",        icon: Database,        group: "data" },
  { id: "workspace",    label: "Workspace",       icon: FolderOpen,      group: "data" },
  { id: "export",       label: "Export & Reports",icon: Download,        group: "data" },
  { id: "api-docs",     label: "API Docs",        icon: Code2,           group: "dev" },
  { id: "contact",      label: "Contact",         icon: MessageSquare,   group: "dev" },
];

const GROUPS: Record<string, string> = {
  overview: "Overview", ml: "Machine Learning", insights: "Insights", data: "Data", dev: "Developer",
};

const SECTION_MAP: Record<TabId, React.ComponentType> = {
  dashboard: DashboardSection,
  architecture: ArchitectureSection as any,
  models: ModelsSection as any,
  training: TrainingSection,
  evaluation: EvaluationSection,
  experiments: ExperimentsSection as any,
  recommend: RecommendSection as any,
  analytics: AnalyticsSection,
  datasets: DatasetsSection as any,
  workspace: WorkspaceSection,
  export: ExportSection,
  "api-docs": ApiDocsSection as any,
  contact: ContactSection,
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen } = useStore();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ActiveSection = SECTION_MAP[activeTab] ?? DashboardSection;

  const navGroups = Object.entries(GROUPS).map(([key, label]) => ({
    key, label,
    items: NAV_ITEMS.filter(n => n.group === key),
  }));

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading CoLLM Platform…</span>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-border flex-shrink-0", !sidebarOpen && "justify-center px-2")}>
        <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <BrainCircuit className="size-4 text-emerald-500" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
              <div className="text-emerald-500 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">CoLLM</div>
              <div className="text-foreground text-sm font-semibold whitespace-nowrap leading-tight">Research Platform</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <TooltipProvider delayDuration={0}>
          {navGroups.map(group => (
            <div key={group.key} className="mb-3">
              {sidebarOpen && (
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
                  {group.label}
                </div>
              )}
              {group.items.map(item => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                const btn = (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all",
                      active ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                      !sidebarOpen && "justify-center px-2"
                    )}
                  >
                    <Icon className={cn("size-4 flex-shrink-0", active && "text-emerald-400")} />
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 text-left truncate whitespace-nowrap">
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {sidebarOpen && item.badge && (
                      <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">{item.badge}</Badge>
                    )}
                  </button>
                );
                return !sidebarOpen ? (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                      {item.label}
                      {item.badge && <Badge className="bg-emerald-600 text-white text-[9px] px-1.5">{item.badge}</Badge>}
                    </TooltipContent>
                  </Tooltip>
                ) : btn;
              })}
            </div>
          ))}
        </TooltipProvider>
      </div>

      {/* User footer */}
      <div className={cn("border-t border-border p-3 flex-shrink-0", !sidebarOpen && "flex justify-center")}>
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex items-center gap-2 w-full rounded-lg hover:bg-secondary/60 p-2 transition-colors", !sidebarOpen && "justify-center w-auto")}>
                <Avatar className="size-7 flex-shrink-0">
                  <AvatarImage src={session.user.image ?? undefined} />
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">{session.user.name?.[0]}</AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 text-left overflow-hidden">
                      <div className="text-xs font-medium truncate">{session.user.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{session.user.email}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setActiveTab("workspace")}><FolderOpen className="size-3.5 mr-2" />Workspace</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="size-3.5 mr-2" /> : <Moon className="size-3.5 mr-2" />}Toggle Theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => signOut({ callbackUrl: "/sign-in" })}>
                <LogOut className="size-3.5 mr-2" />Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className={cn("space-y-1", !sidebarOpen && "hidden")}>
            <Link href="/sign-in" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs">Sign In</Button>
            </Link>
            <Link href="/sign-up" className="w-full">
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs">Sign Up Free</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 56 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm relative z-20 flex-shrink-0"
      >
        <SidebarContent />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-16 size-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors z-30"
        >
          {sidebarOpen ? <ChevronLeft className="size-3" /> : <ChevronRight className="size-3" />}
        </button>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -220 }} animate={{ x: 0 }} exit={{ x: -220 }} transition={{ duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 w-[220px] bg-card border-r border-border z-40 md:hidden flex flex-col">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card/30 backdrop-blur-sm flex items-center gap-3 px-4 flex-shrink-0">
          <Button variant="ghost" size="icon" className="md:hidden size-8" onClick={() => setMobileOpen(true)}>
            <Menu className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? "Dashboard"}
              </span>
              <span className="text-muted-foreground text-xs hidden sm:block">· CoLLM Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href="https://github.com/zyang1580/CoLLM" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="size-8"><Github className="size-4" /></Button>
            </a>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            {!session && (
              <div className="flex gap-1">
                <Link href="/sign-in"><Button variant="outline" size="sm" className="text-xs h-7">Sign In</Button></Link>
                <Link href="/sign-up"><Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700">Sign Up</Button></Link>
              </div>
            )}
          </div>
        </header>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="min-h-full"
            >
              <ActiveSection />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
