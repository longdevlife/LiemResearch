import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth";
import { useSyncRuns, useTriggerSync, type ApiSyncRun } from "@/features/admin";
import { useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  RefreshCw, 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Database, 
  Activity, 
  FileText, 
  Sparkles 
} from "lucide-react";

export function AdminSyncPage() {
  const { data: currentUserData } = useCurrentUser();
  const isAdmin = currentUserData?.user?.role === "admin";

  const { data: runs, isLoading, isError, refetch } = useSyncRuns(isAdmin);
  const triggerSyncMutation = useTriggerSync();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState("large language model education");
  const [yearFrom, setYearFrom] = useState(2022);
  const [maxPages, setMaxPages] = useState(1);

  if (!isAdmin) {
    return (
      <main className="container py-16">
        <div className="mx-auto max-w-md text-center space-y-4">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500/80 stroke-[1.5]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] dark:text-white">Access denied</h1>
          <p className="text-sm text-[#787774] dark:text-slate-400 max-w-[40ch] mx-auto">
            Only administrators are allowed to access the Synchronization Pipeline.
          </p>
        </div>
      </main>
    );
  }

  const handleTriggerSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) {
      toast.error("Please enter a search query.");
      return;
    }

    triggerSyncMutation.mutate(
      {
        searchText: searchText.trim(),
        yearFrom,
        maxPages,
      },
      {
        onSuccess: () => {
          toast.success("Synchronization job queued successfully!", {
            description: "The worker process will process your sync run shortly.",
          });
          setIsDialogOpen(false);
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
          const errMsg = axiosErr?.response?.data?.error?.message ?? "Failed to trigger sync.";
          toast.error(errMsg);
        },
      }
    );
  };

  // Tính toán chỉ số thống kê động từ runs thực tế
  const totalRuns = runs?.length ?? 0;
  const totalInserted = runs?.reduce((acc, r) => acc + (r.totalInserted || 0), 0) ?? 0;
  const isPipelineRunning = runs?.some((r) => r.runStatus === "running") ?? false;

  const renderStatusBadge = (run: ApiSyncRun) => {
    const status = run.runStatus;
    switch (status) {
      case "running":
        return (
          <Badge 
            variant="outline" 
            className="flex w-fit items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded-full border bg-[#E1F3FE] text-[#1F6C9F] border-[#C4E6FD] dark:bg-[#1A2633] dark:text-[#93C5FD] dark:border-[#25394E] animate-pulse"
          >
            <RefreshCw className="h-3 w-3 animate-spin stroke-[1.5]" />
            <span className="capitalize">Running</span>
          </Badge>
        );
      case "succeeded":
        return (
          <Badge 
            variant="outline" 
            className="flex w-fit items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded-full border bg-[#EDF3EC] text-[#346538] border-[#D5E3D2] dark:bg-[#1C2C20] dark:text-[#86EFAC] dark:border-[#2C402E]"
          >
            <CheckCircle2 className="h-3 w-3 stroke-[1.5]" />
            <span className="capitalize">Succeeded</span>
          </Badge>
        );
      case "failed":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="flex w-fit items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded-full border bg-[#FDEBEC] text-[#9F2F2D] border-[#F9D5D6] dark:bg-[#2D1C1C] dark:text-[#FCA5A5] dark:border-[#452020] cursor-pointer"
              >
                <XCircle className="h-3 w-3 stroke-[1.5]" />
                <span className="capitalize">Failed</span>
              </Badge>
            </TooltipTrigger>
            {run.errorMessage && (
              <TooltipContent className="max-w-xs bg-popover text-popover-foreground border border-border shadow-xs">
                <p className="text-xs font-mono">{run.errorMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
        );
      case "cancelled":
        return (
          <Badge 
            variant="outline" 
            className="flex w-fit items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded-full border bg-muted/50 text-muted-foreground border-border"
          >
            <Ban className="h-3 w-3 stroke-[1.5]" />
            <span className="capitalize">Cancelled</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="px-2.5 py-0.5 text-[11px] font-medium rounded-full">
            {status}
          </Badge>
        );
    }
  };

  const renderTableSkeleton = () => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <TableRow key={`ske-${idx}`} className="hover:bg-transparent">
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      </TableRow>
    ));
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader
          title="Sync management"
          description="Trigger and monitor academic API synchronisation from sources like OpenAlex."
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-muted-foreground hover:text-foreground gap-2 active:scale-[0.98] transition-transform duration-100 rounded-lg border border-[#EAEAEA] dark:border-[#26334A] h-9"
          >
            <RefreshCw className="h-3.5 w-3.5 stroke-[1.5]" />
            Refresh Runs
          </Button>
        </div>
      </div>

      {/* Bento Stats & Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Papers Fetched */}
        <div className="bg-card dark:bg-[#111B27] border border-[#EAEAEA] dark:border-[#26334A] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] dark:text-slate-400 uppercase tracking-wider">Papers Fetched</span>
            <div className="p-1.5 rounded-lg bg-[#EDF3EC] dark:bg-[#1C2C20]">
              <Database className="h-4 w-4 text-[#346538] dark:text-[#86EFAC] stroke-[1.5]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-[#111111] dark:text-white">
              {isLoading ? "—" : totalInserted}
            </span>
            <span className="text-xs text-[#787774] dark:text-slate-400">papers</span>
          </div>
        </div>

        {/* Card 2: Total Runs */}
        <div className="bg-card dark:bg-[#111B27] border border-[#EAEAEA] dark:border-[#26334A] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] dark:text-slate-400 uppercase tracking-wider">Total Sync Runs</span>
            <div className="p-1.5 rounded-lg bg-[#E1F3FE] dark:bg-[#1A2633]">
              <Activity className="h-4 w-4 text-[#1F6C9F] dark:text-[#93C5FD] stroke-[1.5]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-[#111111] dark:text-white">
              {isLoading ? "—" : totalRuns}
            </span>
            <span className="text-xs text-[#787774] dark:text-slate-400">runs</span>
          </div>
        </div>

        {/* Card 3: Pipeline Status */}
        <div className="bg-card dark:bg-[#111B27] border border-[#EAEAEA] dark:border-[#26334A] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] dark:text-slate-400 uppercase tracking-wider">Pipeline Status</span>
            <div className={`p-1.5 rounded-lg ${isPipelineRunning ? "bg-amber-500/10" : "bg-[#EDF3EC] dark:bg-[#1C2C20]"}`}>
              <Sparkles className={`h-4 w-4 stroke-[1.5] ${isPipelineRunning ? "text-amber-500 animate-pulse" : "text-[#346538] dark:text-[#86EFAC]"}`} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {isPipelineRunning ? (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping absolute" />
                <span className="h-2 w-2 rounded-full bg-amber-500 relative" />
                <span className="text-sm font-semibold text-amber-500 ml-1">Sync Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#346538] dark:bg-[#86EFAC]" />
                <span className="text-sm font-semibold text-[#346538] dark:text-[#86EFAC]">System Idle</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Action Control Card */}
        <div className="bg-card dark:bg-[#111B27] border border-dashed border-[#EF4444]/30 dark:border-[#EF4444]/20 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-center h-[120px]">
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            className="w-full bg-[#111111] hover:bg-[#2F3437] dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black gap-2 font-bold h-11 active:scale-[0.98] transition-transform duration-100 rounded-lg shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-current stroke-[1.5]" />
            Trigger New Sync
          </Button>
          <p className="text-[10px] text-center text-[#787774] dark:text-slate-400 mt-2 tracking-wide font-medium">
            Authorized administrators only
          </p>
        </div>
      </div>

      {/* Run History List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-[#111111] dark:text-white">Run History Log</h2>

        {isError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 stroke-[1.5]" />
            <p className="text-sm font-semibold text-red-500">
              Failed to load synchronization runs from the server.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="active:scale-[0.98] transition-transform duration-100 border-red-500/30 text-red-500 hover:bg-red-500/10" 
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        ) : !isLoading && (!runs || runs.length === 0) ? (
          <div className="rounded-xl border border-dashed border-[#EAEAEA] dark:border-[#26334A] p-20 text-center space-y-6">
            <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground/30 stroke-[1.5]" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#111111] dark:text-white">No sync runs recorded</h3>
              <p className="text-sm text-[#787774] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Start pulling papers by triggering a new synchronization job using the action controller card above.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#EAEAEA] dark:border-[#26334A] bg-card text-card-foreground shadow-[0_2px_12px_rgba(0,0,0,0.015)] overflow-hidden">
            <TooltipProvider>
              <Table>
                <TableHeader className="bg-[#FBFBFA] dark:bg-[#162235]/40 border-b border-[#EAEAEA] dark:border-[#26334A]">
                  <TableRow>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[#787774] dark:text-slate-400 h-11">Search Query</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[#787774] dark:text-slate-400 h-11">Status</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[#787774] dark:text-slate-400 h-11 text-center">Fetched</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[#787774] dark:text-slate-400 h-11 text-center">Inserted</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[#787774] dark:text-slate-400 h-11 text-center">Updated</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[#787774] dark:text-slate-400 h-11 text-center">Duplicates</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[#787774] dark:text-slate-400 h-11">Started At</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[#787774] dark:text-slate-400 h-11">Finished At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#EAEAEA] dark:divide-[#26334A]">
                  {isLoading ? (
                    renderTableSkeleton()
                  ) : (
                    runs?.map((run) => (
                      <TableRow key={run._id} className="hover:bg-[#F9F9F8]/80 dark:hover:bg-[#162235]/30 border-b border-[#EAEAEA] dark:border-[#26334A] transition-colors duration-150">
                        <TableCell className="font-semibold text-sm max-w-[240px] truncate text-[#111111] dark:text-white py-3.5" title={run.searchText}>
                          {run.searchText ?? "N/A"}
                        </TableCell>
                        <TableCell className="py-3.5">{renderStatusBadge(run)}</TableCell>
                        <TableCell className="text-center font-mono text-xs font-semibold text-[#111111] dark:text-white py-3.5">{run.totalFetched}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-[#346538] dark:text-[#86EFAC] font-bold py-3.5">+{run.totalInserted}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-[#1F6C9F] dark:text-[#93C5FD] font-semibold py-3.5">{run.totalUpdated}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-[#787774] dark:text-slate-500 py-3.5">{run.totalDuplicates}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-3.5">
                          {new Date(run.startedAt).toLocaleString("vi-VN", { hour12: false })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-3.5">
                          {run.finishedAt ? new Date(run.finishedAt).toLocaleString("vi-VN", { hour12: false }) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-xl border border-[#EAEAEA] dark:border-[#26334A] dark:bg-[#121E31] p-6 shadow-md">
          <form onSubmit={handleTriggerSync} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#111111] dark:text-white">
                <RefreshCw className="h-5 w-5 text-primary stroke-[1.5]" />
                Trigger New Synchronization
              </DialogTitle>
              <DialogDescription className="text-sm text-[#787774] dark:text-slate-400">
                Synchronize academic papers from OpenAlex live directory using a custom search topic.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="searchText" className="font-semibold text-sm text-[#111111] dark:text-white">
                  Search Query Topic <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="searchText"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="e.g. large language model education"
                  required
                  className="w-full rounded-lg border-[#EAEAEA] dark:border-[#26334A] focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearFrom" className="font-semibold text-sm text-[#111111] dark:text-white">
                    Publication Year From
                  </Label>
                  <Input
                    id="yearFrom"
                    type="number"
                    min={1900}
                    max={2100}
                    value={yearFrom}
                    onChange={(e) => setYearFrom(parseInt(e.target.value) || 2022)}
                    required
                    className="rounded-lg border-[#EAEAEA] dark:border-[#26334A] focus-visible:ring-1 focus-visible:ring-ring h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPages" className="font-semibold text-sm text-[#111111] dark:text-white">
                    Max Pages (200 records/pg)
                  </Label>
                  <Input
                    id="maxPages"
                    type="number"
                    min={1}
                    max={50}
                    value={maxPages}
                    onChange={(e) => setMaxPages(parseInt(e.target.value) || 1)}
                    required
                    className="rounded-lg border-[#EAEAEA] dark:border-[#26334A] focus-visible:ring-1 focus-visible:ring-ring h-10"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t border-[#EAEAEA] dark:border-[#26334A] pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={triggerSyncMutation.isPending}
                className="active:scale-[0.98] transition-transform duration-100 rounded-lg border border-[#EAEAEA] dark:border-[#26334A] h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={triggerSyncMutation.isPending}
                className="bg-[#111111] hover:bg-[#2F3437] dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black active:scale-[0.98] transition-transform duration-100 min-w-[100px] gap-2 rounded-lg h-10"
              >
                {triggerSyncMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin stroke-[1.5]" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current stroke-[1.5]" />
                    Start Sync
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
