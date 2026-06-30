import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, SendHorizonal } from "lucide-react";
import type { ProjectChatMessage } from "@trend/shared-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { projectChatApi } from "../api/project-chat.api";

interface ProjectChatPanelProps {
  projectId: string;
  paperCount: number;
}

export function ProjectChatPanel({ projectId, paperCount }: ProjectChatPanelProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const historyQuery = useQuery({
    queryKey: ["project-chat", projectId],
    queryFn: () => projectChatApi.listHistory(projectId),
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => projectChatApi.sendMessage(projectId, text),
    onSuccess: () => {
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["project-chat", projectId] });
    },
  });

  const messages = historyQuery.data ?? [];
  const pendingUserMessage = sendMutation.isPending
    ? ({
        id: "pending-user",
        projectId,
        userId: "me",
        role: "user",
        content: sendMutation.variables ?? message,
        citedPaperIds: [],
        createdAt: new Date().toISOString(),
      } satisfies ProjectChatMessage)
    : null;

  const visibleMessages = useMemo(
    () => (pendingUserMessage ? [...messages, pendingUserMessage] : messages),
    [messages, pendingUserMessage],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleMessages.length]);

  const submit = () => {
    const text = message.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Project Chat</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ask AI about the {paperCount} papers added to this project.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          Project RAG
        </Badge>
      </div>

      <div className="flex h-[520px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-5 py-5 dark:bg-black/20">
          {historyQuery.isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading chat history...
            </div>
          ) : visibleMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:bg-zinc-800 dark:text-slate-200">
                No messages yet
              </div>
              <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Ask questions about methodologies, limitations, trends, or gaps in your project's papers.
              </p>
            </div>
          ) : (
            visibleMessages.map((item) => (
              <div
                key={item.id}
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    item.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-zinc-950 dark:text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{item.content}</p>
                  {item.role === "assistant" && item.citedPaperIds.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
                      {item.citedPaperIds.map((paperId) => (
                        <Link key={paperId} to={`/papers/${paperId}`}>
                          <Badge variant="outline" className="rounded-full bg-slate-50 dark:bg-zinc-900">
                            Paper {paperId.slice(-6)}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-slate-400">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                AI is reading project papers...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {sendMutation.isError && (
          <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            Failed to send question. Check your LLM provider or try again later.
          </div>
        )}

        <div className="border-t border-slate-100 p-4 dark:border-white/10">
          <div className="flex gap-3">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              maxLength={2000}
              rows={2}
              placeholder="Ask AI about papers in this project..."
              className="min-h-[48px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              disabled={sendMutation.isPending}
            />
            <Button
              type="button"
              onClick={submit}
              disabled={!message.trim() || sendMutation.isPending}
              className="h-auto rounded-xl px-4"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
