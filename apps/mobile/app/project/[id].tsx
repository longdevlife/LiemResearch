import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import type { ProjectChatMessage, ProjectTeamChatMessage } from "@trend/shared-types";

import {
  useDeleteProjectTeamChat,
  useProject,
  useProjectChat,
  useProjectTeamChat,
  useSendProjectChat,
  useSendProjectTeamChat,
} from "@/features/projects";
import { useCreditBalance } from "@/features/credits";
import { useAuthStore } from "@/stores/auth-store";

type ChatMode = "team" | "ai";
type DisplayMessage =
  | { kind: "team"; message: ProjectTeamChatMessage; pending?: boolean }
  | { kind: "ai"; message: ProjectChatMessage };

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dateLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

function sameDay(a?: string, b?: string) {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function initials(fullName?: string, email?: string) {
  const source = fullName?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : source.slice(0, 2)).toUpperCase();
}

function Avatar({
  name,
  email,
  uri,
  ai = false,
}: {
  name?: string;
  email?: string;
  uri?: string;
  ai?: boolean;
}) {
  if (uri) return <Image source={{ uri }} className="h-8 w-8 rounded-full bg-slate-200" />;
  return (
    <View className={`h-8 w-8 items-center justify-center rounded-full ${ai ? "bg-violet-600" : "bg-cyan-600"}`}>
      {ai ? (
        <Ionicons name="sparkles" size={15} color="#FFFFFF" />
      ) : (
        <Text className="text-[10px] font-bold text-white">{initials(name, email)}</Text>
      )}
    </View>
  );
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listRef = useRef<FlatList<DisplayMessage>>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const currentUser = useAuthStore((state) => state.user);
  const projectQuery = useProject(id);
  const chatQuery = useProjectChat(id);
  const teamChatQuery = useProjectTeamChat(id);
  const sendChat = useSendProjectChat();
  const sendTeamChat = useSendProjectTeamChat();
  const deleteTeamChat = useDeleteProjectTeamChat();
  const creditQuery = useCreditBalance();
  const [chatMode, setChatMode] = useState<ChatMode>("team");
  const [message, setMessage] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const project = projectQuery.data;
  const isSending = sendChat.isPending || sendTeamChat.isPending;

  const teamMessages = useMemo<DisplayMessage[]>(() => {
    const messages: DisplayMessage[] = (teamChatQuery.data ?? []).map((item) => ({ kind: "team", message: item }));
    if (sendTeamChat.isPending && sendTeamChat.variables) {
      messages.push({
        kind: "team",
        pending: true,
        message: {
          id: "pending-team-message",
          projectId: id ?? "",
          sender: {
            id: currentUser?.id ?? "me",
            fullName: currentUser?.fullName,
            email: currentUser?.email,
            avatarUrl: currentUser?.avatarUrl,
          },
          content: sendTeamChat.variables.content,
          readBy: [],
          readCount: 1,
          isDeleted: false,
          createdAt: new Date().toISOString(),
        },
      });
    }
    return messages;
  }, [currentUser, id, sendTeamChat.isPending, sendTeamChat.variables, teamChatQuery.data]);

  const aiMessages = useMemo<DisplayMessage[]>(
    () => (chatQuery.data ?? []).map((item) => ({ kind: "ai", message: item })),
    [chatQuery.data],
  );
  const visibleMessages = chatMode === "team" ? teamMessages : aiMessages;

  const submitMessage = () => {
    const clean = message.trim();
    if (!id || clean.length === 0 || isSending) return;
    setMessage("");
    const callbacks = {
      onError: (error: any) => {
        setMessage((current) => current || clean);
        Alert.alert("Message not sent", error?.response?.data?.error?.message ?? "Please try again.");
      },
    };
    if (chatMode === "team") {
      sendTeamChat.mutate({ projectId: id, content: clean }, callbacks);
    } else {
      sendChat.mutate({ projectId: id, message: clean }, callbacks);
    }
  };

  const confirmDelete = (item: ProjectTeamChatMessage) => {
    if (!id || item.isDeleted) return;
    const canDelete =
      item.sender.id === currentUser?.id ||
      project?.ownerId === currentUser?.id ||
      currentUser?.role === "admin";
    if (!canDelete) return;
    Alert.alert("Unsend message?", "This message will be removed for everyone in the project.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unsend",
        style: "destructive",
        onPress: () =>
          deleteTeamChat.mutate(
            { projectId: id, messageId: item.id },
            {
              onError: (error: any) =>
                Alert.alert("Could not unsend", error?.response?.data?.error?.message ?? "Please try again."),
            },
          ),
      },
    ]);
  };

  const renderMessage = ({ item, index }: ListRenderItemInfo<DisplayMessage>) => {
    const previous = visibleMessages[index - 1];
    const createdAt = item.message.createdAt;
    const showDate = !previous || !sameDay(previous.message.createdAt, createdAt);

    if (item.kind === "team") {
      const chatMessage = item.message;
      const isMe = chatMessage.sender.id === currentUser?.id;
      const readByOthers = Math.max(0, chatMessage.readCount - (isMe ? 1 : 0));
      return (
        <>
          {showDate ? (
            <View className="my-4 items-center">
              <Text className="rounded-full bg-slate-200/80 px-3 py-1 text-[10px] font-semibold text-slate-500 dark:bg-[#26334A] dark:text-slate-300">
                {dateLabel(createdAt)}
              </Text>
            </View>
          ) : null}
          <View className={`mb-2 flex-row items-end ${isMe ? "justify-end" : "justify-start"}`}>
            {!isMe ? (
              <View className="mr-2">
                <Avatar
                  name={chatMessage.sender.fullName}
                  email={chatMessage.sender.email}
                  uri={chatMessage.sender.avatarUrl}
                />
              </View>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.85}
              onLongPress={() => confirmDelete(chatMessage)}
              delayLongPress={350}
              className={`max-w-[78%] px-4 py-2.5 ${
                isMe
                  ? "rounded-[20px] rounded-br-md bg-[#0A7CFF]"
                  : "rounded-[20px] rounded-bl-md bg-white dark:bg-[#26334A]"
              }`}
            >
              {!isMe ? (
                <Text className="mb-0.5 text-[10px] font-bold text-[#0891B2] dark:text-[#67E8F9]">
                  {chatMessage.sender.fullName ?? chatMessage.sender.email ?? "Member"}
                </Text>
              ) : null}
              <Text className={`text-[15px] leading-5 ${isMe ? "text-white" : "text-slate-900 dark:text-white"} ${chatMessage.isDeleted ? "italic opacity-70" : ""}`}>
                {chatMessage.isDeleted ? "Message was unsent" : chatMessage.content}
              </Text>
              <View className={`mt-1 flex-row items-center ${isMe ? "justify-end" : "justify-start"}`}>
                <Text className={`text-[9px] ${isMe ? "text-blue-100" : "text-slate-400"}`}>{formatTime(createdAt)}</Text>
                {isMe ? (
                  <>
                    <Text className="mx-1 text-[9px] text-blue-100">·</Text>
                    <Feather name={item.pending ? "clock" : "check-circle"} size={10} color="#DBEAFE" />
                    <Text className="ml-1 text-[9px] text-blue-100">
                      {item.pending ? "Sending" : readByOthers > 0 ? "Seen" : "Sent"}
                    </Text>
                  </>
                ) : null}
              </View>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    const aiMessage = item.message;
    const isMe = aiMessage.role === "user";
    return (
      <>
        {showDate ? (
          <View className="my-4 items-center">
            <Text className="rounded-full bg-slate-200/80 px-3 py-1 text-[10px] font-semibold text-slate-500 dark:bg-[#26334A] dark:text-slate-300">
              {dateLabel(createdAt)}
            </Text>
          </View>
        ) : null}
        <View className={`mb-2 flex-row items-end ${isMe ? "justify-end" : "justify-start"}`}>
          {!isMe ? <View className="mr-2"><Avatar ai /></View> : null}
          <View className={`max-w-[78%] px-4 py-2.5 ${isMe ? "rounded-[20px] rounded-br-md bg-[#0A7CFF]" : "rounded-[20px] rounded-bl-md bg-white dark:bg-[#26334A]"}`}>
            {!isMe ? <Text className="mb-0.5 text-[10px] font-bold text-violet-500">PaperLens AI</Text> : null}
            <Text className={`text-[15px] leading-5 ${isMe ? "text-white" : "text-slate-900 dark:text-white"}`}>{aiMessage.content}</Text>
            <Text className={`mt-1 text-[9px] ${isMe ? "text-right text-blue-100" : "text-slate-400"}`}>{formatTime(createdAt)}</Text>
          </View>
        </View>
      </>
    );
  };

  if (projectQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background dark:bg-[#0F1B2D]">
        <ActivityIndicator color="#0A7CFF" />
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6 dark:bg-[#0F1B2D]">
        <Text className="text-center text-foreground dark:text-white">Project not found</Text>
      </SafeAreaView>
    );
  }

  const activeQuery = chatMode === "team" ? teamChatQuery : chatQuery;

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2F5] dark:bg-[#0F1B2D]" edges={["top", "bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="border-b border-slate-200 bg-white px-3 py-2 dark:border-[#26334A] dark:bg-[#151F2E]">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full">
              <Feather name="chevron-left" size={26} color="#0A7CFF" />
            </TouchableOpacity>
            <View className="ml-1 h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br bg-[#0A7CFF]">
              <Feather name="users" size={18} color="#FFFFFF" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[16px] font-bold text-slate-900 dark:text-white" numberOfLines={1}>{project.title}</Text>
              <Text className="text-[11px] text-emerald-600 dark:text-emerald-400">{project.members.length} members · active now</Text>
            </View>
            <TouchableOpacity
              onPress={() => setDetailsOpen((value) => !value)}
              className={`h-10 w-10 items-center justify-center rounded-full ${detailsOpen ? "bg-blue-100 dark:bg-blue-950" : ""}`}
            >
              <Feather name="info" size={21} color="#0A7CFF" />
            </TouchableOpacity>
          </View>

          <View className="mt-2 flex-row rounded-xl bg-[#F0F2F5] p-1 dark:bg-[#0F1B2D]">
            {(["team", "ai"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setChatMode(mode)}
                className={`flex-1 items-center rounded-lg py-2 ${chatMode === mode ? "bg-white shadow-sm dark:bg-[#26334A]" : ""}`}
              >
                <Text className={`text-xs font-bold ${chatMode === mode ? "text-[#0A7CFF]" : "text-slate-500 dark:text-slate-400"}`}>
                  {mode === "team" ? "Team chat" : "PaperLens AI · 1 credit"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {detailsOpen ? (
            <View className="mt-2 rounded-xl bg-blue-50 p-3 dark:bg-[#172A46]">
              <Text className="text-sm text-slate-700 dark:text-slate-200" numberOfLines={3}>{project.description || "No project description."}</Text>
              <View className="mt-2 flex-row items-center">
                <Feather name="file-text" size={13} color="#64748B" />
                <Text className="ml-1 text-xs text-slate-500 dark:text-slate-400">{project.papers.length} papers</Text>
                <Feather name="users" size={13} color="#64748B" style={{ marginLeft: 16 }} />
                <Text className="ml-1 text-xs text-slate-500 dark:text-slate-400">{project.members.length} members</Text>
                <Text className="ml-auto text-xs font-bold text-amber-500">{creditQuery.data?.credits ?? "—"} cr</Text>
              </View>
            </View>
          ) : null}
        </View>

        {activeQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#0A7CFF" />
            <Text className="mt-3 text-xs text-slate-500 dark:text-slate-400">Loading conversation…</Text>
          </View>
        ) : activeQuery.isError ? (
          <View className="flex-1 items-center justify-center px-8">
            <Feather name="wifi-off" size={32} color="#94A3B8" />
            <Text className="mt-3 text-center font-bold text-slate-800 dark:text-white">Conversation unavailable</Text>
            <Text className="mt-1 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
              {(activeQuery.error as any)?.response?.data?.error?.message ?? "Check your connection or project access."}
            </Text>
            <TouchableOpacity onPress={() => activeQuery.refetch()} className="mt-4 rounded-full bg-[#0A7CFF] px-5 py-2.5">
              <Text className="font-bold text-white">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={visibleMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => `${item.kind}-${item.message.id}`}
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16, flexGrow: visibleMessages.length ? undefined : 1 }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-8">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                  <Feather name={chatMode === "team" ? "message-circle" : "zap"} size={28} color="#0A7CFF" />
                </View>
                <Text className="mt-4 text-center text-lg font-bold text-slate-900 dark:text-white">
                  {chatMode === "team" ? "Start the conversation" : "Ask PaperLens AI"}
                </Text>
                <Text className="mt-1 text-center text-sm leading-5 text-slate-500 dark:text-slate-400">
                  {chatMode === "team"
                    ? "Messages are shared with every member of this project."
                    : "This conversation is private and grounded in the project's papers."}
                </Text>
              </View>
            }
          />
        )}

        <View className="border-t border-slate-200 bg-white px-3 pb-2 pt-2 dark:border-[#26334A] dark:bg-[#151F2E]">
          {(sendChat.isError || sendTeamChat.isError) ? (
            <Text className="mb-1 text-center text-[10px] text-red-500">Message failed. Edit and send it again.</Text>
          ) : null}
          <View className="flex-row items-end">
            <TouchableOpacity className="mb-1 h-9 w-9 items-center justify-center rounded-full">
              <Feather name="plus" size={23} color="#0A7CFF" />
            </TouchableOpacity>
            <View className="mx-2 min-h-10 flex-1 flex-row items-end rounded-[22px] bg-[#F0F2F5] px-4 py-1.5 dark:bg-[#26334A]">
              <TextInput
                className="max-h-28 min-h-7 flex-1 py-1 text-[15px] text-slate-900 dark:text-white"
                value={message}
                onChangeText={setMessage}
                placeholder={chatMode === "team" ? "Aa" : "Ask about project papers…"}
                placeholderTextColor={isDark ? "#94A3B8" : "#64748B"}
                multiline
                maxLength={2000}
                textAlignVertical="center"
                onSubmitEditing={submitMessage}
                blurOnSubmit={false}
              />
              {message.length > 1800 ? <Text className="mb-1 ml-2 text-[9px] text-slate-400">{2000 - message.length}</Text> : null}
            </View>
            <TouchableOpacity
              className={`mb-0.5 h-10 w-10 items-center justify-center rounded-full ${message.trim() && !isSending ? "bg-[#0A7CFF]" : "bg-blue-200 dark:bg-blue-950"}`}
              onPress={submitMessage}
              disabled={!message.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="send" size={18} color={message.trim() ? "#FFFFFF" : "#60A5FA"} />
              )}
            </TouchableOpacity>
          </View>
          <Text className="mt-1 text-center text-[9px] text-slate-400">
            {chatMode === "team" ? "Hold your message to unsend" : "AI answers cost 1 credit"}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
