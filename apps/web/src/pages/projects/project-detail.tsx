import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProject, useAddPaperToProject, useRemovePaperFromProject, useAddMemberToProject, useRemoveMemberFromProject } from "@/features/projects/hooks/use-projects";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api-client";

function useSearchUsers(email: string) {
  return useQuery({
    queryKey: ["searchUsers", email],
    queryFn: async () => {
      if (!email || email.length < 2) return [];
      const res = await api.get<{ success: boolean; data: any[] }>(`/auth/search?email=${encodeURIComponent(email)}`);
      return res.data.data;
    },
    enabled: email.length >= 2,
  });
}

function useSearchPapers(query: string) {
  return useQuery({
    queryKey: ["searchPapers", query],
    queryFn: async () => {
      if (!query || query.length < 3) return [];
      const res = await api.get<{ success: boolean; data: any[] }>(`/papers?q=${encodeURIComponent(query)}&pageSize=10`);
      return res.data.data;
    },
    enabled: query.length >= 3,
  });
}
import { toast } from "sonner";
import { FileText, Users, Trash2, Plus } from "lucide-react";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const [activeTab, setActiveTab] = useState<"papers" | "members" | "reports" | "gaps">("papers");

  if (isLoading) {
    return (
      <main className="container py-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="container py-8">
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Project not found or you do not have access.
        </div>
      </main>
    );
  }

  return (
    <main className="container py-8 space-y-8">
      <PageHeader
        title={project.title}
        description={project.description || "No description provided."}
      />

      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "papers" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("papers")}
        >
          Papers ({project.papers?.length || 0})
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "members" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("members")}
        >
          Members ({project.members?.length || 0})
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "reports" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("reports")}
        >
          Reports
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "gaps" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("gaps")}
        >
          Gaps
        </button>
      </div>

      <div>
        {activeTab === "papers" && <PapersTab projectId={project._id} papers={project.papers} />}
        {activeTab === "members" && <MembersTab projectId={project._id} members={project.members} ownerId={project.ownerId} />}
        {activeTab === "reports" && <ReportsTab projectId={project._id} />}
        {activeTab === "gaps" && <GapsTab projectId={project._id} />}
      </div>
    </main>
  );
}

function ReportsTab({ projectId }: { projectId: string }) {
  // In a full implementation, this would use useReports(projectId)
  // and have a button to create a new report.
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <FileText className="mx-auto h-8 w-8 mb-4 opacity-50" />
        <p>No reports in this project yet.</p>
        <p className="text-sm mt-2">Create reports and assign them to this project to share with members.</p>
      </div>
    </div>
  );
}

function GapsTab({ projectId }: { projectId: string }) {
  // In a full implementation, this would use useGaps({ projectId })
  // and have a button to create a new gap analysis.
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <FileText className="mx-auto h-8 w-8 mb-4 opacity-50" />
        <p>No research gaps in this project yet.</p>
        <p className="text-sm mt-2">Generate gap analyses for this project to share with members.</p>
      </div>
    </div>
  );
}

function PapersTab({ projectId, papers }: { projectId: string; papers: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<{ id: string; title: string; year: number } | null>(null);

  const { data: searchResults, isLoading: isSearching } = useSearchPapers(searchTitle);
  const addPaper = useAddPaperToProject(projectId);
  const removePaper = useRemovePaperFromProject(projectId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaper) return toast.error("Please select a paper");
    try {
      await addPaper.mutateAsync({ paperId: selectedPaper.id });
      toast.success("Paper added successfully");
      setIsDialogOpen(false);
      setSelectedPaper(null);
      setSearchTitle("");
    } catch (err) {
      toast.error("Failed to add paper. It may already exist in the project.");
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this paper from the project?")) return;
    try {
      await removePaper.mutateAsync(id);
      toast.success("Paper removed");
    } catch (err) {
      toast.error("Failed to remove paper");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Paper</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Paper</DialogTitle>
              <DialogDescription>Enter the Paper Object ID to add it to this project.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2 relative">
                <Label>Search Paper by Title</Label>
                {selectedPaper ? (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-secondary/20">
                    <div className="text-sm">
                      <p className="font-medium line-clamp-2">{selectedPaper.title}</p>
                      <p className="text-muted-foreground text-xs">Year: {selectedPaper.year}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPaper(null)}>Change</Button>
                  </div>
                ) : (
                  <div>
                    <Input
                      value={searchTitle}
                      onChange={(e) => setSearchTitle(e.target.value)}
                      placeholder="e.g. LLM in education..."
                      autoComplete="off"
                    />
                    {searchTitle.length > 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                        {isSearching ? (
                          <div className="p-3 text-sm text-muted-foreground">Searching...</div>
                        ) : searchResults?.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">No papers found.</div>
                        ) : (
                          searchResults?.map((p: any) => (
                            <div
                              key={p.id}
                              className="p-3 hover:bg-secondary cursor-pointer border-b last:border-0"
                              onClick={() => setSelectedPaper({ id: p.id, title: p.title, year: p.year })}
                            >
                              <p className="font-medium text-sm line-clamp-2">{p.title}</p>
                              <p className="text-muted-foreground text-xs">Year: {p.year}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setSelectedPaper(null); setSearchTitle(""); }}>Cancel</Button>
                <Button type="submit" disabled={addPaper.isPending || !selectedPaper}>
                  {addPaper.isPending ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {papers?.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <FileText className="mx-auto h-8 w-8 mb-4 opacity-50" />
          <p>No papers in this project yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {papers.map((p) => {
            const paperObj = typeof p.targetId === 'object' && p.targetId !== null ? p.targetId : null;
            const paperId = paperObj ? paperObj._id : p.targetId;
            return (
              <Card key={paperId}>
                <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2">
                  <div>
                    {paperObj ? (
                      <>
                        <CardTitle className="text-base font-medium line-clamp-2">{paperObj.title}</CardTitle>
                        <CardDescription>Year: {paperObj.year} • {paperObj.authors?.slice(0,2).join(", ")}{paperObj.authors?.length > 2 ? " et al." : ""}</CardDescription>
                      </>
                    ) : (
                      <>
                        <CardTitle className="text-base font-medium font-mono text-muted-foreground">ID: {paperId}</CardTitle>
                        <CardDescription>Target Kind: {p.targetKind}</CardDescription>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemove(paperId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MembersTab({ projectId, members, ownerId }: { projectId: string; members: any[]; ownerId: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [role, setRole] = useState<"owner" | "member">("member");
  
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchEmail);
  const addMember = useAddMemberToProject(projectId);
  const removeMember = useRemoveMemberFromProject(projectId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return toast.error("Please select a user");
    try {
      await addMember.mutateAsync({ targetId: selectedUser.id, targetKind: "User", role });
      toast.success("Member added successfully");
      setIsDialogOpen(false);
      setSelectedUser(null);
      setSearchEmail("");
    } catch (err) {
      toast.error("Failed to add member.");
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this member from the project?")) return;
    try {
      await removeMember.mutateAsync(id);
      toast.success("Member removed");
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Member</DialogTitle>
              <DialogDescription>Add a User or Expert to this project.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                  >
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2 relative">
                <Label>Search User by Email</Label>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-secondary/20">
                    <div className="text-sm">
                      <p className="font-medium">{selectedUser.fullName}</p>
                      <p className="text-muted-foreground text-xs">{selectedUser.email}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
                  </div>
                ) : (
                  <div>
                    <Input
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="e.g. user@example.com..."
                      autoComplete="off"
                    />
                    {searchEmail.length > 1 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                        {isSearching ? (
                          <div className="p-3 text-sm text-muted-foreground">Searching...</div>
                        ) : searchResults?.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">No users found.</div>
                        ) : (
                          searchResults?.map((u: any) => (
                            <div
                              key={u.id}
                              className="p-3 hover:bg-secondary cursor-pointer border-b last:border-0"
                              onClick={() => setSelectedUser(u)}
                            >
                              <p className="font-medium text-sm">{u.fullName}</p>
                              <p className="text-muted-foreground text-xs">{u.email}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setSelectedUser(null); setSearchEmail(""); }}>Cancel</Button>
                <Button type="submit" disabled={addMember.isPending || !selectedUser}>
                  {addMember.isPending ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {members?.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Users className="mx-auto h-8 w-8 mb-4 opacity-50" />
          <p>No members in this project.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {members.map((m) => {
            const memberObj = typeof m.targetId === 'object' && m.targetId !== null ? m.targetId : null;
            const memberId = memberObj ? memberObj._id : m.targetId;
            const isPrimaryOwner = memberId === ownerId;
            return (
              <Card key={memberId}>
                <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2">
                  <div>
                    {memberObj ? (
                      <>
                        <CardTitle className="text-base font-medium">{memberObj.fullName || 'Unknown User'}</CardTitle>
                        <CardDescription>{memberObj.email} • <span className="capitalize">{m.role}</span> {isPrimaryOwner && "(Creator)"}</CardDescription>
                      </>
                    ) : (
                      <>
                        <CardTitle className="text-base font-medium">
                          {m.targetKind} (ID: <span className="font-mono text-muted-foreground text-sm">{memberId}</span>)
                        </CardTitle>
                        <CardDescription className="capitalize">
                          Role: {m.role} {isPrimaryOwner && "(Creator)"}
                        </CardDescription>
                      </>
                    )}
                  </div>
                  {!isPrimaryOwner && (
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemove(memberId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
