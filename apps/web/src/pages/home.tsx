import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  FileText,
  Lightbulb,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Cpu,
  Activity,
  AlertTriangle,
  Bookmark,
  Sparkles,
  History,
  FolderKanban,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/features/auth";
import { useHomeOverview } from "@/features/home/hooks/use-home-overview";
import { PaperCard } from "@/components/paper-card";
import { Bar, BarChart, ResponsiveContainer, Tooltip } from "recharts";

export function HomePage() {
  const navigate = useNavigate();
  const { data: me } = useCurrentUser();
  const { data, isLoading, isError } = useHomeOverview();

  // Search input state at home page
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = localSearchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (isError || !data) {
    return <HomeErrorFallback />;
  }

  return (
    <div className="w-full space-y-10 select-none pb-10">
      {/* 1. Header / Hero Section based on Mode */}
      {data.mode === "guest" ? (
        <GuestHero
          query={localSearchQuery}
          setQuery={setLocalSearchQuery}
          submitSearch={handleSearchSubmit}
        />
      ) : (
        <UserHero
          name={me?.user?.fullName || me?.user?.email || "Researcher"}
          query={localSearchQuery}
          setQuery={setLocalSearchQuery}
          submitSearch={handleSearchSubmit}
        />
      )}

      {/* 2. Admin Health summary (If Admin Mode) */}
      {data.mode === "admin" && data.admin && <AdminHealthSummary admin={data.admin} />}

      {/* 3. Guest System Snapshot (If Guest Mode) */}
      {data.mode === "guest" && data.summary && (
        <GuestSystemSnapshot summary={data.summary} />
      )}

      {/* 3. Primary Workspace snapshot cards for Logged-in Users */}
      {data.mode !== "guest" && data.workspace && (
        <WorkspaceSnapshot workspace={data.workspace} />
      )}

      {/* 4. Guest explanation Pipeline under Hero */}
      {data.mode === "guest" && <PipelineSection />}

      {/* 5. Capability cards for Guest */}
      {data.mode === "guest" && <CapabilityCards />}

      {/* 6. Dashboard grid for User / Admin */}
      {data.mode !== "guest" && data.workspace && (
        <WorkspaceDetailGrid workspace={data.workspace} />
      )}

      {/* 7. Live Research Signals (Visible to all, shows data.trends) */}
      <LiveSignalsSection trends={data.trends} recentPapers={data.recentPapers} />
    </div>
  );
}

// ==================== SUBCOMPONENTS ====================

// 1. Guest Hero Section
function GuestHero({
  query,
  setQuery,
  submitSearch
}: {
  query: string;
  setQuery: (val: string) => void;
  submitSearch: (e: React.FormEvent) => void;
}) {
  return (
    <div className="text-center py-12 md:py-20 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
        AI-assisted publication trend analysis
      </h1>
      <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Unlock deep scientific insights. Norm and embed literature corpora with hybrid AI search,
        automatic trend intelligence, qualitative research gap detection, and evidence-backed RAG reports.
      </p>

      {/* Simple prominent search input */}
      <form onSubmit={submitSearch} className="max-w-2xl mx-auto relative flex items-center gap-2 px-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search research papers by concept, question or topic..."
            className="w-full pl-11 pr-4 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-card font-semibold"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold active:scale-[0.98] transition-transform duration-105 shadow-sm">
          Search
        </Button>
      </form>

      {/* CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button variant="outline" size="sm" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-50 dark:hover:bg-slate-900/50 font-bold h-10 px-5 transition-all" asChild>
          <Link to="/trends">Explore Trends</Link>
        </Button>
        <Button size="sm" className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold h-10 px-5 shadow-sm transition-all" asChild>
          <Link to="/reports?create=true">Generate Report</Link>
        </Button>
        <Button variant="ghost" size="sm" className="rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold h-10 px-4" asChild>
          <Link to="/login">Sign in <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  );
}

// 2. Logged-in User Hero Section
function UserHero({
  name,
  query,
  setQuery,
  submitSearch
}: {
  name: string;
  query: string;
  setQuery: (val: string) => void;
  submitSearch: (e: React.FormEvent) => void;
}) {
  return (
    <div className="py-6 border-b border-slate-100 dark:border-slate-900 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {name}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here is an overview of your research cockpit and system indicators today.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-slate-200 dark:border-slate-800 bg-card h-8" asChild>
            <Link to="/search">Search Papers</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-slate-200 dark:border-slate-800 bg-card h-8" asChild>
            <Link to="/trends">Explore Trends</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-slate-200 dark:border-slate-800 bg-card h-8" asChild>
            <Link to="/research-gaps">Research Gaps</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-slate-200 dark:border-slate-800 bg-card h-8" asChild>
            <Link to="/projects">Projects</Link>
          </Button>
          <Button size="sm" className="rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white h-8" asChild>
            <Link to="/reports?create=true" className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Create Report</Link>
          </Button>
        </div>
      </div>

      {/* Simple search form for user cockpit */}
      <form onSubmit={submitSearch} className="max-w-2xl relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search normalized corpus instantly..."
            className="w-full pl-10 pr-4 h-10 rounded-lg border-slate-200 dark:border-slate-800 bg-card font-medium"
          />
        </div>
        <Button type="submit" size="sm" className="h-10 px-4 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold active:scale-[0.98] transition-transform duration-100 shadow-sm">
          Search
        </Button>
      </form>
    </div>
  );
}

// 3. Guest System Snapshot Card Component
function GuestSystemSnapshot({ summary }: { summary: any }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard
        label="PAPERS INDEXED"
        value={summary.totalPapers?.toLocaleString() || "0"}
        icon={BookOpen}
        onClick={() => navigate("/search")}
      />
      <KpiCard
        label="SEARCHES SERVED"
        value={summary.totalSearches?.toLocaleString() || "0"}
        icon={Search}
        isNeutral
      />
      <KpiCard
        label="ACTIVE USERS"
        value={summary.uniqueUsers?.toLocaleString() || "0"}
        icon={Users}
        isNeutral
      />
      <KpiCard
        label="EMERGING TREND"
        value={summary.topTrend || "N/A"}
        icon={TrendingUp}
        onClick={() => summary.topTrend ? navigate(`/trends/${encodeURIComponent(summary.topTrend)}`) : navigate("/trends")}
      />
    </div>
  );
}

// 4. Workspace Snapshot Cards
function WorkspaceSnapshot({ workspace }: { workspace: any }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard
        label="SAVED PAPERS"
        value={workspace.bookmarkCount.toLocaleString()}
        icon={Bookmark}
        onClick={() => navigate("/bookmarks")}
      />
      <KpiCard
        label="AI REPORTS"
        value={workspace.reportCount.toLocaleString()}
        icon={FileText}
        onClick={() => navigate("/reports")}
      />
      <KpiCard
        label="PROJECTS"
        value={workspace.projectCount.toLocaleString()}
        icon={FolderKanban}
        onClick={() => navigate("/projects")}
      />
      <KpiCard
        label="RECENT SEARCHES"
        value={workspace.recentSearches.length.toString()}
        icon={History}
        isNeutral
      />
    </div>
  );
}

// 5. Admin Mini Health Card
function AdminHealthSummary({ admin }: { admin: any }) {
  const reportsCount = (admin.reports?.queued || 0) + (admin.reports?.generating || 0);
  return (
    <div className="rounded-xl border border-dashed border-red-500/20 bg-red-500/5 dark:bg-red-950/5 p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-red-500/10 pb-2">
        <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          System Health indicators
        </h3>
        <Link to="/admin" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
          Admin Dashboard ➔
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 block">Pending Requests:</span>
          <Link to="/admin/papers" className="text-sm font-bold text-slate-800 dark:text-white hover:underline mt-0.5 block">
            {admin.pendingPaperRequests} papers
          </Link>
        </div>

        <div>
          <span className="text-slate-500 block">Embedding Queue:</span>
          <Link to="/admin/sync" className="text-sm font-bold text-slate-800 dark:text-white hover:underline mt-0.5 block">
            {admin.embedding.pending} pending
          </Link>
        </div>

        <div>
          <span className="text-slate-500 block">Sync Pipeline:</span>
          <Link to="/admin/sync" className="text-sm font-bold mt-0.5 block">
            {admin.sync.running ? (
              <span className="text-amber-500 font-bold animate-pulse">Running</span>
            ) : admin.sync.latest?.status === "failed" ? (
              <span className="text-red-500 font-bold">Latest Failed</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Idle</span>
            )}
          </Link>
        </div>

        <div>
          <span className="text-slate-500 block">Active AI Jobs:</span>
          <Link to="/reports" className="text-sm font-bold text-slate-800 dark:text-white hover:underline mt-0.5 block">
            {reportsCount} reports
          </Link>
        </div>
      </div>
    </div>
  );
}

// 6. Pipeline explanation Section
function PipelineSection() {
  return (
    <div className="rounded-xl border bg-slate-50/50 dark:bg-slate-900/10 p-6 space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">
          Academic Intel Pipeline
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          How raw academic metadata is transformed into actionable research insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch text-xs text-center">
        {/* Step 1 */}
        <div className="bg-card border rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center mx-auto mb-2">1</div>
            <h4 className="font-bold text-slate-800 dark:text-white">Corpus Sourcing</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              OpenAlex Live Index combined with manual PDF upload and custom team internal directories.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card border rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center mx-auto mb-2">2</div>
            <h4 className="font-bold text-slate-800 dark:text-white">Vector Norm</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Metadata normalization, content-structure quality gate filtering, and 768-D dense vector embedding.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center mx-auto mb-2">3</div>
            <h4 className="font-bold text-slate-800 dark:text-white">AI Analysis</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Vector retrieval semantic search, multi-axis trend charting, and algorithmic gap discovery.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-card border rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center mx-auto mb-2">4</div>
            <h4 className="font-bold text-blue-700 dark:text-blue-300">Evidence Direction</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              RAG synthesized reports, structured citation matrix, and conversational research project cockpit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. Capability Cards (6 blocks)
function CapabilityCards() {
  const capabilities = [
    {
      title: "Semantic Search",
      desc: "Go beyond keywords. Find papers via vector-dense embeddings mapped by neural understanding.",
      icon: Compass
    },
    {
      title: "Trend Intelligence",
      desc: "Visualize multi-year publication volumes, citation spikes, and topic comparison charts.",
      icon: TrendingUp
    },
    {
      title: "Research Gaps",
      desc: "Systematic algorithmic detection of underserved areas, discrepancies, and new research directions.",
      icon: Lightbulb
    },
    {
      title: "RAG Reports",
      desc: "Structured evidence-backed analytical documents generated directly on top of filtered corpora.",
      icon: FileText
    },
    {
      title: "Project Chat",
      desc: "Collaborate and query files in real-time inside structured workspaces with persistent memory.",
      icon: Users
    },
    {
      title: "Local AI via Ollama",
      desc: "Optional local model provider for project chat / lightweight local AI tasks when configured.",
      icon: Cpu,
      isDisclaimer: true
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest text-center">
        Platform Core Capabilities
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capabilities.map((c) => (
          <div key={c.title} className="rounded-xl border bg-card p-5 shadow-sm flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <c.icon className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.title}</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {c.desc}
              </p>
            </div>
            {c.isDisclaimer && (
              <span className="text-[9px] font-mono text-slate-400 block border-t border-slate-100 dark:border-slate-800/60 pt-2">
                * Note: Gemini remains standard for heavy RAG report synthesis.
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 8. Workspace Detail Grid (Logged-in details)
function WorkspaceDetailGrid({ workspace }: { workspace: any }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Col 1: Recent Searches */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-slate-400" />
          Recent Searches
        </h3>
        {workspace.recentSearches.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent searches. Try querying the search box above.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {workspace.recentSearches.slice(0, 5).map((s: any, idx: number) => (
              <li
                key={`s-${idx}`}
                onClick={() => navigate(`/search?q=${encodeURIComponent(s.query)}`)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 px-1 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-white truncate" title={s.query}>
                    {s.query}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {s.resultCount} results
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Col 2: Latest Reports */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          Latest Reports
        </h3>
        {workspace.latestReports.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <p>No reports generated yet.</p>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" asChild>
              <Link to="/reports?create=true">Generate First Report</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {workspace.latestReports.slice(0, 5).map((r: any) => (
              <li
                key={r.id}
                onClick={() => navigate(`/reports/${r.id}`)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 px-1 rounded-lg transition-all"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-800 dark:text-white truncate block" title={r.topic || r.query}>
                    {r.topic || r.query}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                  r.status === "ready" ? "bg-emerald-50 text-emerald-600 border border-emerald-200/20" :
                  r.status === "failed" ? "bg-red-50 text-red-600 border border-red-200/20" :
                  "bg-amber-50 text-amber-600 border border-amber-200/20 animate-pulse"
                }`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Col 3: Latest Projects */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
          Latest Projects
        </h3>
        {workspace.latestProjects.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <p>No research projects created.</p>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" asChild>
              <Link to="/projects">Create Project</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {workspace.latestProjects.slice(0, 5).map((p: any) => (
              <li
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 px-1 rounded-lg transition-all"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-800 dark:text-white truncate block" title={p.title}>
                    {p.title}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Updated: {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {p.paperCount} papers
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// 8. Live Research Signals (Publication Velocity + Trending Topics + Rising Keywords)
function LiveSignalsSection({ trends, recentPapers }: { trends: any; recentPapers: any[] }) {
  const navigate = useNavigate();

  // Xử lý dữ liệu Velocity và gán YTD nếu cần
  const velocityData = (trends.yearlyTotalPapers || []).map((p: any) => ({
    name: p.year > trends.lastCompleteYear ? `${p.year} (YTD)` : p.year.toString(),
    value: p.count
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-100 dark:border-slate-900 pt-8">
      {/* Main Column: Chart & Recent Papers */}
      <div className="lg:col-span-8 space-y-8">
        {/* Publication Velocity Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Publication Velocity
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Annual volume of academic papers indexed within the current corpus scope.
            </p>
          </div>

          <div className="h-48 w-full text-xs">
            {velocityData.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed rounded-lg text-slate-400 text-xs">
                No yearly trend data yet. Sync more papers to populate this chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData} barSize={24}>
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Papers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">
              Recent Indexed Papers
            </h3>
            <Button variant="link" size="sm" className="text-xs font-bold p-0 h-auto" asChild>
              <Link to="/search">Explore Library</Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {recentPapers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No recent papers found. Click "Explore Library" to run search.
              </div>
            ) : (
              recentPapers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  id={paper.id}
                  journal={paper.journalName || "Unknown Journal"}
                  date={paper.publicationDate ? new Date(paper.publicationDate).toLocaleDateString() : paper.publicationYear.toString()}
                  title={paper.title}
                  abstract={paper.abstractText || "No abstract available"}
                  authors={paper.authors?.map((a: any) => a.displayName).join(", ") || "Unknown Author"}
                  score={paper.dataQualityScore?.toFixed(2) || "N/A"}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Column: Topics & Keywords */}
      <div className="lg:col-span-4 space-y-6">
        {/* Trending Topics */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            Trending Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {trends.topics.length === 0 ? (
              <span className="text-xs text-slate-400">No trending topics.</span>
            ) : (
              trends.topics.slice(0, 6).map((topic: any, idx: number) => {
                const colors = [
                  "bg-blue-50 text-blue-600 border-blue-200/30",
                  "bg-emerald-50 text-emerald-600 border-emerald-200/30",
                  "bg-purple-50 text-purple-600 border-purple-200/30",
                  "bg-slate-50 text-slate-700 border-slate-200/30"
                ];
                const colorClass = colors[idx % colors.length];
                return (
                  <button
                    key={topic.topic}
                    onClick={() => navigate(`/trends/${encodeURIComponent(topic.topic)}`)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border hover:opacity-85 transition-all text-left ${colorClass}`}
                  >
                    {topic.topic}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Rising Keywords */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            Rising Keywords
          </h3>
          <ul className="space-y-2 text-xs">
            {trends.risingKeywords.length === 0 ? (
              <li className="text-slate-400">No rising keywords.</li>
            ) : (
              trends.risingKeywords.slice(0, 8).map((k: any, idx: number) => (
                <li
                  key={`k-${idx}`}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(k.keyword)}`)}
                  className="p-2 border rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-900/20 cursor-pointer transition-all space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 dark:text-white">{k.keyword}</span>
                    <span className="text-[10px] font-bold text-emerald-600">+{Math.round(k.momentum * 100)}%</span>
                  </div>
                  {k.warning && (
                    <div className="flex items-center gap-1 text-[9px] text-amber-600 font-mono">
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                      <span>{k.warning}</span>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// 9. Standard KPI Card Sub-component
function KpiCard({
  label,
  value,
  icon: Icon,
  isNeutral = false,
  onClick
}: {
  label: string;
  value: string;
  icon: any;
  isNeutral?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between transition-all select-none focus:outline-none focus:ring-1 focus:ring-ring ${
        onClick ? "cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20" : ""
      }`}
    >
      <div className="space-y-1">
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
          {label}
        </span>
        <span className="text-2xl font-extrabold text-slate-900 dark:text-white block font-mono">
          {value}
        </span>
      </div>
      <div className={`p-2 rounded-xl border shrink-0 ${isNeutral ? "bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/20" : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/20"}`}>
        <Icon className={`w-4 h-4 ${isNeutral ? "text-slate-400" : "text-blue-600"}`} />
      </div>
    </div>
  );
}

// 10. Home Skeletons (Loading state)
function HomeSkeleton() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={`ske-k-${idx}`} className="h-20 w-full rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={`ske-col-${idx}`} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// 11. Home Error Fallback View
function HomeErrorFallback() {
  return (
    <div className="w-full max-w-md mx-auto py-16 text-center space-y-4">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-500/80" />
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to load overview</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[36ch] mx-auto leading-relaxed">
        Home overview failed to load. You can still search papers or explore trends.
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/search">Search Papers</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to="/trends">Explore Trends</Link>
        </Button>
      </div>
    </div>
  );
}
