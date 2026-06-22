import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import type { Bookmark, BookmarkTargetKind } from "@trend/shared-types";

import { useBookmarks, useDeleteBookmark } from "@/features/bookmarks";

type Filter = "all" | BookmarkTargetKind;

function BookmarkRow({ bookmark }: { bookmark: Bookmark }) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const deleteBookmark = useDeleteBookmark();
  const paper = bookmark.paperDetail;
  const report = bookmark.reportDetail;
  const title = paper?.title ?? report?.topic ?? report?.query ?? "Saved item";
  const subtitle =
    bookmark.targetKind === "paper"
      ? `${paper?.journalName ? `${paper.journalName} · ` : ""}${paper?.publicationYear ?? "Unknown year"}`
      : `${report?.status ?? "report"} · ${report?.createdAt ? new Date(report.createdAt).toLocaleDateString() : "AI report"}`;

  const openItem = () => {
    if (bookmark.targetKind === "paper") {
      router.push(`/paper/${bookmark.targetId}` as any);
    } else if (bookmark.targetKind === "report") {
      router.push(`/report/${bookmark.targetId}` as any);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Remove bookmark", "Delete this saved item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteBookmark.mutate(bookmark.id) },
    ]);
  };

  return (
    <View className="mb-3 flex-row overflow-hidden rounded-2xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332]">
      <TouchableOpacity className="flex-1 p-4" activeOpacity={0.88} onPress={openItem}>
        <View className="flex-row items-start">
          <View className="mr-3 mt-0.5 h-8 w-8 rounded-lg bg-cyan-50 dark:bg-[#0B2B45] items-center justify-center">
            <Feather name={bookmark.targetKind === "paper" ? "file-text" : "bar-chart-2"} size={15} color="#06B6D4" />
          </View>
          <View className="flex-1">
            <View className="mb-2 self-start rounded-md bg-muted dark:bg-[#26334A] px-2 py-1">
              <Text className="text-[10px] font-bold uppercase text-muted-foreground dark:text-[#94A3B8]">{bookmark.targetKind}</Text>
            </View>
            <Text className="text-sm font-bold leading-5 text-foreground dark:text-[#F8FAFC]" numberOfLines={2}>{title}</Text>
            <Text className="mt-1 text-xs text-muted-foreground dark:text-[#94A3B8]" numberOfLines={1}>{subtitle}</Text>
            {bookmark.note ? <Text className="mt-2 text-xs text-[#0891B2] dark:text-[#67E8F9]" numberOfLines={1}>{bookmark.note}</Text> : null}
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity className="w-16 items-center justify-center bg-[#DC2626]" onPress={confirmDelete} disabled={deleteBookmark.isPending}>
        {deleteBookmark.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="trash-2" size={20} color="#FFFFFF" />}
      </TouchableOpacity>
    </View>
  );
}

export default function BookmarksScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const bookmarksQuery = useBookmarks();
  const bookmarks = bookmarksQuery.data ?? [];
  const filtered = useMemo(
    () => (filter === "all" ? bookmarks : bookmarks.filter((bookmark) => bookmark.targetKind === filter)),
    [bookmarks, filter],
  );

  const filters: { label: string; value: Filter }[] = [
    { label: `All (${bookmarks.length})`, value: "all" },
    { label: "Papers", value: "paper" },
    { label: "Reports", value: "report" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 112 }}
        refreshControl={<RefreshControl refreshing={bookmarksQuery.isRefetching} onRefresh={() => bookmarksQuery.refetch()} tintColor="#06B6D4" />}
      >
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-foreground dark:text-[#F8FAFC]">Bookmarks</Text>
            <Text className="mt-1 text-sm text-muted-foreground dark:text-[#94A3B8]">Saved papers and AI reports</Text>
          </View>
          <View className="h-10 w-10 rounded-full bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] items-center justify-center">
            <Feather name="edit-3" size={16} color="#06B6D4" />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 mb-5 px-4">
          {filters.map((item) => (
            <TouchableOpacity
              key={item.value}
              onPress={() => setFilter(item.value)}
              className={`mr-2 rounded-full px-4 py-2 border ${filter === item.value ? "border-[#1D4ED8] bg-[#1D4ED8]" : "border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332]"}`}
            >
              <Text className={`text-xs font-bold ${filter === item.value ? "text-white" : "text-muted-foreground dark:text-[#94A3B8]"}`}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {bookmarksQuery.isLoading ? (
          <View className="py-24"><ActivityIndicator color="#06B6D4" /></View>
        ) : filtered.length > 0 ? (
          filtered.map((bookmark) => <BookmarkRow key={bookmark.id} bookmark={bookmark} />)
        ) : (
          <View className="mt-8 rounded-2xl border border-dashed border-border dark:border-[#26334A] bg-card dark:bg-[#111C2E] p-10 items-center">
            <Ionicons name="bookmark-outline" size={38} color={isDark ? "#64748B" : "#94A3B8"} />
            <Text className="mt-4 text-center text-base font-bold text-foreground dark:text-[#F8FAFC]">No saved items yet</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground dark:text-[#94A3B8]">Save papers from Home or Paper Detail to build your research library.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
