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
import { RefreshCw, Play, AlertCircle, CheckCircle2, XCircle, Ban } from "lucide-react";

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
        <div className="mx-auto max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Access denied</h1>
          <p className="mt-2 text-muted-foreground">
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

  const renderStatusBadge = (run: ApiSyncRun) => {
    const status = run.runStatus;
    switch (status) {
      case "running":
        return (
          <Badge variant="outline" className="flex w-fit items-center gap-1.5 bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0.5">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span className="capitalize">Running</span>
          </Badge>
        );
      case "succeeded":
        return (
          <Badge variant="outline" className="flex w-fit items-center gap-1.5 bg-green-500/10 text-green-500 border-green-500/20 px-2 py-0.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="capitalize">Succeeded</span>
          </Badge>
        );
      case "failed":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="flex w-fit items-center gap-1.5 bg-destructive/10 text-destructive border-destructive/20 px-2 py-0.5 cursor-pointer">
                <XCircle className="h-3.5 w-3.5" />
                <span className="capitalize">Failed</span>
              </Badge>
            </TooltipTrigger>
            {run.errorMessage && (
              <TooltipContent className="max-w-xs bg-popover text-popover-foreground border border-border shadow-md">
                <p className="text-xs font-mono">{run.errorMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="flex w-fit items-center gap-1.5 bg-slate-500/10 text-slate-500 border-slate-500/20 px-2 py-0.5">
            <Ban className="h-3.5 w-3.5" />
            <span className="capitalize">Cancelled</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="px-2 py-0.5">
            {status}
          </Badge>
        );
    }
  };

  const renderTableSkeleton = () => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <TableRow key={`ske-${idx}`} className="hover:bg-transparent">
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
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
    <main className="container py-8 space-y-8">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Sync management"
          description="Trigger and monitor academic API synchronisation from sources like OpenAlex."
        />
        <div className="flex justify-start">
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium relative z-0">
            <Play className="h-4 w-4 fill-current" />
            Trigger new sync
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold tracking-tight">Run History</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {isError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-2 text-sm font-medium text-destructive">
              Failed to load synchronization runs from the server.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : !isLoading && (!runs || runs.length === 0) ? (
          <div className="rounded-lg border border-dashed p-16 text-center space-y-4">
            <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-1">
              <h3 className="text-lg font-medium">No sync runs recorded</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Start pulling papers by triggering a new synchronization job using the button above.
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} size="sm">
              Trigger your first sync
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
            <TooltipProvider>
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-semibold">Search Query</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-center">Fetched</TableHead>
                    <TableHead className="font-semibold text-center">Inserted</TableHead>
                    <TableHead className="font-semibold text-center">Updated</TableHead>
                    <TableHead className="font-semibold text-center">Duplicates</TableHead>
                    <TableHead className="font-semibold">Started At</TableHead>
                    <TableHead className="font-semibold">Finished At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    renderTableSkeleton()
                  ) : (
                    runs?.map((run) => (
                      <TableRow key={run._id} className="hover:bg-muted/30">
                        <TableCell className="font-medium max-w-[240px] truncate" title={run.searchText}>
                          {run.searchText ?? "N/A"}
                        </TableCell>
                        <TableCell>{renderStatusBadge(run)}</TableCell>
                        <TableCell className="text-center font-mono text-xs">{run.totalFetched}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-green-500 font-semibold">{run.totalInserted}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-blue-500">{run.totalUpdated}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">{run.totalDuplicates}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(run.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "—"}
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
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleTriggerSync} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Trigger New Synchronization
              </DialogTitle>
              <DialogDescription>
                Synchronize academic papers from OpenAlex live directory using a custom search topic.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="searchText" className="font-medium">
                  Search Query Topic <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="searchText"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="e.g. large language model education"
                  required
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearFrom" className="font-medium">
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPages" className="font-medium">
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
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={triggerSyncMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={triggerSyncMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px] gap-2"
              >
                {triggerSyncMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
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
