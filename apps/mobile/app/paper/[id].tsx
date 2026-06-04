import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { usePaper } from "@/features/papers";

export default function PaperDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState("abstract");

  const { data: paper, isLoading } = usePaper(id);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-border dark:border-[#26334A]">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Feather name="chevron-left" size={24} color={isDark ? "#94A3B8" : "#64748B"} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground dark:text-white">Paper Detail</Text>
        <TouchableOpacity className="p-2 -mr-2">
          <Feather name="share" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : !paper ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-foreground dark:text-white">Paper not found</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Title */}
          <Text className="text-xl font-bold text-foreground dark:text-white mb-4 leading-tight">
            {paper.title}
          </Text>

          {/* Authors */}
          <View className="flex-row flex-wrap mb-4 gap-2">
            {paper.authors?.map((author: any, idx: number) => (
              <View key={idx} className="bg-[#F1F5F9] dark:bg-[#1A2332] flex-row items-center px-3 py-1.5 rounded-full">
                <Feather name="user" size={12} color={isDark ? "#3B82F6" : "#1D4ED8"} />
                <Text className="text-[#334155] dark:text-white font-semibold text-xs ml-1.5">{author.displayName}</Text>
              </View>
            ))}
          </View>

          {/* Metadata */}
          <Text className="text-[#0284C7] dark:text-[#06B6D4] text-xs font-bold mb-4">
            {paper.journalName ? `${paper.journalName}  •  ` : ""}{paper.publicationYear}
          </Text>

          {/* Badges */}
          <View className="flex-row flex-wrap mb-6 gap-2">
            <View className="bg-[#EEF2FF] dark:bg-[#1E1B4B] flex-row items-center px-2 py-1 rounded-md">
              <Text className="text-[#4F46E5] dark:text-[#818CF8] text-[10px] font-bold">❞ {paper.citationCount || 0} Citations</Text>
            </View>
            {paper.isAiAnalyzable && (
              <View className="bg-[#ECFDF5] dark:bg-[#064E3B] flex-row items-center px-2 py-1 rounded-md">
                <Ionicons name="sparkles" size={10} color={isDark ? "#34D399" : "#059669"} />
                <Text className="text-[#059669] dark:text-[#34D399] text-[10px] font-bold ml-1">AI Analyzable</Text>
              </View>
            )}
            {paper.openAccessUrl && (
              <View className="bg-[#FFFBEB] dark:bg-[#451A03] flex-row items-center px-2 py-1 rounded-md">
                <Feather name="unlock" size={10} color={isDark ? "#FBBF24" : "#D97706"} />
                <Text className="text-[#D97706] dark:text-[#FBBF24] text-[10px] font-bold ml-1">Open Access</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] rounded-xl flex-row justify-around py-4 mb-6">
            <TouchableOpacity className="items-center">
              <Feather name="bookmark" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs font-semibold mt-1.5">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <Feather name="user-plus" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs font-semibold mt-1.5">Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <Feather name="plus-square" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs font-semibold mt-1.5">Add</Text>
            </TouchableOpacity>
            {paper.openAccessUrl && (
              <TouchableOpacity className="items-center">
                <Feather name="file-text" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
                <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs font-semibold mt-1.5">PDF</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* AI Match Score Card */}
          <View className="bg-[#F0F9FF] dark:bg-[#082F49] border border-[#BAE6FD] dark:border-[#0C4A6E] rounded-xl p-4 mb-6 flex-row">
            <View className="bg-[#E0F2FE] dark:bg-[#0369A1] w-10 h-10 rounded-lg items-center justify-center mr-3">
              <Ionicons name="sparkles" size={20} color={isDark ? "#38BDF8" : "#0284C7"} />
            </View>
            <View className="flex-1">
              <Text className="text-[#0F172A] dark:text-white font-bold mb-1">Quality Score: {(paper.dataQualityScore || 0).toFixed(2)}</Text>
              <Text className="text-[#334155] dark:text-[#E0F2FE] text-xs leading-relaxed">
                This paper has a metadata quality score of {(paper.dataQualityScore || 0).toFixed(2)}. (AI relevance score will be available in Phase B).
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-border dark:border-[#26334A] mb-4">
            <TouchableOpacity 
              className={`pb-2 px-2 mr-4 ${activeTab === 'abstract' ? 'border-b-2 border-[#0284C7] dark:border-[#06B6D4]' : ''}`}
              onPress={() => setActiveTab('abstract')}
            >
              <Text className={`text-sm ${activeTab === 'abstract' ? 'text-[#0284C7] dark:text-[#06B6D4] font-bold' : 'text-muted-foreground dark:text-[#94A3B8]'}`}>Abstract</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`pb-2 px-2 mr-4 ${activeTab === 'topics' ? 'border-b-2 border-[#0284C7] dark:border-[#06B6D4]' : ''}`}
              onPress={() => setActiveTab('topics')}
            >
              <Text className={`text-sm ${activeTab === 'topics' ? 'text-[#0284C7] dark:text-[#06B6D4] font-bold' : 'text-muted-foreground dark:text-[#94A3B8]'}`}>Topics</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'abstract' ? (
            <Text className="text-[#334155] dark:text-[#CBD5E1] text-sm leading-relaxed mb-8">
              {paper.abstractText || "No abstract available for this paper."}
            </Text>
          ) : (
            <View className="flex-row flex-wrap mb-8 gap-2">
              {paper.topics?.map((topic: any, idx: number) => (
                <View key={idx} className="bg-muted dark:bg-[#1A2332] border border-border dark:border-[#26334A] px-3 py-1.5 rounded-full">
                  <Text className="text-foreground dark:text-white text-xs">{topic.topicName}</Text>
                </View>
              ))}
              {(!paper.topics || paper.topics.length === 0) && (
                <Text className="text-[#334155] dark:text-[#CBD5E1] text-sm italic">No topics available.</Text>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Bottom Button */}
      {paper?.openAccessUrl && (
        <View className="absolute bottom-0 left-0 right-0 p-4 border-t border-border dark:border-[#26334A] bg-background dark:bg-[#0F1B2D]">
          <TouchableOpacity className="bg-[#0284C7] dark:bg-[#06B6D4] rounded-lg py-3 flex-row justify-center items-center">
            <Feather name="external-link" size={16} color="#ffffff" />
            <Text className="text-white font-bold ml-2">Open full text</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
