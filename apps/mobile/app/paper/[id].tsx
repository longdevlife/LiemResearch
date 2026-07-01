import { useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

import { useBookmarkStatus, useCreateBookmark, useDeleteBookmark } from "@/features/bookmarks";
import { usePaper, usePaperReferences } from "@/features/papers";

export default function PaperDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState<"abstract" | "topics" | "references">("abstract");

  const paperQuery = usePaper(id);
  const referencesQuery = usePaperReferences(id, activeTab === "references");
  const statusQuery = useBookmarkStatus("paper", id);
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const paper = paperQuery.data;
  const isBookmarked = statusQuery.data?.bookmarked;

  const toggleBookmark = () => {
    if (!id) return;
    if (isBookmarked && statusQuery.data?.bookmarkId) {
      deleteBookmark.mutate(statusQuery.data.bookmarkId);
      return;
    }

    createBookmark.mutate(
      { targetKind: "paper", targetId: id },
      {
        onError: (error: any) => {
          if (error?.response?.status !== 409) Alert.alert("Bookmark failed", error?.response?.data?.error?.message ?? "Please try again.");
        },
      },
    );
  };

  const openFullText = () => {
    if (paper?.openAccessUrl) Linking.openURL(paper.openAccessUrl);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top", "bottom"]}>
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-border dark:border-[#26334A]">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Feather name="chevron-left" size={24} color={isDark ? "#94A3B8" : "#64748B"} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground dark:text-[#F8FAFC]">Paper Detail</Text>
        <TouchableOpacity className="p-2 -mr-2">
          <Feather name="share" size={19} color={isDark ? "#94A3B8" : "#64748B"} />
        </TouchableOpacity>
      </View>

      {paperQuery.isLoading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator color="#06B6D4" /></View>
      ) : !paper ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-center text-foreground dark:text-[#F8FAFC]">Paper not found</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: paper.openAccessUrl ? 92 : 24 }}>
          <Text className="text-xl font-bold text-foreground dark:text-[#F8FAFC] leading-6">{paper.title}</Text>

          <View className="flex-row flex-wrap mt-4 gap-2">
            {paper.authors?.slice(0, 3).map((author, index) => (
              <View key={`${author.displayName}-${index}`} className="bg-card dark:bg-[#111C2E] border border-border dark:border-[#26334A] flex-row items-center px-3 py-1.5 rounded-full">
                <Feather name="user" size={12} color="#06B6D4" />
                <Text className="text-foreground dark:text-[#F8FAFC] font-semibold text-xs ml-1.5">{author.displayName}</Text>
              </View>
            ))}
          </View>

          <Text className="text-[#06B6D4] text-xs font-bold mt-4">
            {paper.journalName ? `${paper.journalName} · ` : ""}{paper.publicationYear}
          </Text>

          <View className="flex-row flex-wrap mt-4 mb-5 gap-2">
            <View className="bg-[#1E1B4B] px-2 py-1 rounded-md">
              <Text className="text-[#A5B4FC] text-[10px] font-bold">{paper.citationCount || 0} Citations</Text>
            </View>
            {paper.isAiAnalyzable && (
              <View className="bg-[#064E3B] flex-row items-center px-2 py-1 rounded-md">
                <Ionicons name="sparkles" size={10} color="#34D399" />
                <Text className="text-[#34D399] text-[10px] font-bold ml-1">AI Analyzable</Text>
              </View>
            )}
            {paper.openAccessUrl && (
              <View className="bg-[#451A03] flex-row items-center px-2 py-1 rounded-md">
                <Feather name="unlock" size={10} color="#FBBF24" />
                <Text className="text-[#FBBF24] text-[10px] font-bold ml-1">Open Access</Text>
              </View>
            )}
          </View>

          <View className="bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] rounded-2xl flex-row justify-around py-4 mb-5">
            <TouchableOpacity className="items-center" onPress={toggleBookmark} disabled={createBookmark.isPending || deleteBookmark.isPending}>
              <Feather name="bookmark" size={19} color={isBookmarked ? "#06B6D4" : isDark ? "#94A3B8" : "#64748B"} />
              <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs font-semibold mt-1.5">{isBookmarked ? "Saved" : "Save"}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <Feather name="user-plus" size={19} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs font-semibold mt-1.5">Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <Feather name="plus-square" size={19} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs font-semibold mt-1.5">Add</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center" onPress={openFullText} disabled={!paper.openAccessUrl}>
              <Feather name="file-text" size={19} color={paper.openAccessUrl ? "#94A3B8" : "#475569"} />
              <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs font-semibold mt-1.5">PDF</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-[#082F49] border border-[#06B6D4] rounded-2xl p-4 mb-5 flex-row">
            <View className="bg-[#0E7490] w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Ionicons name="sparkles" size={20} color="#A5F3FC" />
            </View>
            <View className="flex-1">
              <Text className="text-[#F8FAFC] font-bold mb-1">AI Analysis: {(paper.dataQualityScore || 0).toFixed(2)}</Text>
              <Text className="text-[#CFFAFE] text-xs leading-5">
                Strong metadata quality and citation context make this paper suitable for semantic search, trend analysis, and report grounding.
              </Text>
            </View>
          </View>

          <View className="flex-row border-b border-border dark:border-[#26334A] mb-4">
            {(["abstract", "topics", "references"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                className={`pb-2 px-2 mr-4 ${activeTab === tab ? "border-b-2 border-[#06B6D4]" : ""}`}
                onPress={() => setActiveTab(tab)}
              >
                <Text className={`text-sm capitalize ${activeTab === tab ? "text-[#06B6D4] font-bold" : "text-muted-foreground dark:text-[#94A3B8]"}`}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "abstract" ? (
            <Text className="text-foreground/80 dark:text-[#CBD5E1] text-sm leading-6">{paper.abstractText || "No abstract available for this paper."}</Text>
          ) : activeTab === "topics" ? (
            <View className="flex-row flex-wrap gap-2">
              {paper.topics?.length ? (
                paper.topics.map((topic, index) => (
                  <View key={`${topic.topicName}-${index}`} className="bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] px-3 py-1.5 rounded-full">
                    <Text className="text-foreground dark:text-[#F8FAFC] text-xs">{topic.topicName}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-muted-foreground dark:text-[#94A3B8] text-sm italic">No topics available.</Text>
              )}
            </View>
          ) : referencesQuery.isLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator color="#06B6D4" />
            </View>
          ) : referencesQuery.data?.references.length ? (
            <View className="gap-3">
              <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs">
                Showing {referencesQuery.data.inCorpus} of {referencesQuery.data.totalReferenced} cited works found in this library.
              </Text>
              {referencesQuery.data.references.map((reference) => {
                const authors = reference.authors?.map((author) => author.displayName).filter(Boolean).slice(0, 3).join(", ");
                return (
                  <TouchableOpacity
                    key={reference.id}
                    className="bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] rounded-xl p-3"
                    onPress={() => router.push(`/paper/${reference.id}` as any)}
                  >
                    <Text className="text-foreground dark:text-[#F8FAFC] font-bold text-sm leading-5" numberOfLines={2}>
                      {reference.title}
                    </Text>
                    {!!authors && (
                      <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs mt-1" numberOfLines={1}>
                        {authors}
                      </Text>
                    )}
                    <View className="flex-row items-center mt-2">
                      <Text className="text-[#06B6D4] text-xs font-bold">{reference.publicationYear || "Unknown year"}</Text>
                      {!!reference.doi && (
                        <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs ml-2" numberOfLines={1}>
                          DOI: {reference.doi}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text className="text-muted-foreground dark:text-[#94A3B8] text-sm">
              No in-library references found yet. {referencesQuery.data?.totalReferenced ? `${referencesQuery.data.totalReferenced} cited works exist, but none are in this library.` : "Citation graph data is not available for this paper."}
            </Text>
          )}
        </ScrollView>
      )}

      {paper?.openAccessUrl && (
        <View className="absolute bottom-0 left-0 right-0 p-4 border-t border-border dark:border-[#26334A] bg-background dark:bg-[#0F1B2D]">
          <TouchableOpacity className="bg-[#06B6D4] rounded-xl py-3 flex-row justify-center items-center" onPress={openFullText}>
            <Feather name="external-link" size={16} color="#0F1B2D" />
            <Text className="text-[#0F1B2D] font-bold ml-2">Open full text</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
