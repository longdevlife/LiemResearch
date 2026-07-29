import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import type { TrendingTopic, YearlyCount } from "@trend/shared-types";

import {
  useExplainTrend,
  useTopicTrend,
  useTrendCompare,
  useTrendExplainHistory,
  useTrendRelationships,
  useTrendsOverview,
  type TrendsOverviewParams,
} from "@/features/trends";
import { useCreditBalance } from "@/features/credits";

type Tab = "overview" | "compare" | "ai";
type SortBy = NonNullable<TrendsOverviewParams["sortBy"]>;

function Bars({ points, color = "#06B6D4" }: { points: YearlyCount[]; color?: string }) {
  const visible = points.slice(-8);
  const max = Math.max(...visible.map((point) => point.count), 1);
  return (
    <View className="mt-4 flex-row items-end gap-1 h-20">
      {visible.map((point) => (
        <View key={point.year} className="flex-1 items-center">
          <Text className="mb-1 text-[9px] text-muted-foreground dark:text-[#94A3B8]">{point.count}</Text>
          <View className="w-full rounded-t-md" style={{ height: Math.max(6, (point.count / max) * 55), backgroundColor: color }} />
          <Text className="mt-1 text-[9px] text-muted-foreground dark:text-[#94A3B8]">{String(point.year).slice(2)}</Text>
        </View>
      ))}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-muted/60 dark:bg-[#26334A] p-3">
      <Text className="text-[10px] uppercase text-muted-foreground dark:text-[#94A3B8]">{label}</Text>
      <Text className="mt-1 text-sm font-black text-foreground dark:text-white">{value}</Text>
    </View>
  );
}

function TopicCard({ topic, selected, comparing, onOpen, onCompare }: {
  topic: TrendingTopic;
  selected: boolean;
  comparing: boolean;
  onOpen: () => void;
  onCompare: () => void;
}) {
  return (
    <TouchableOpacity onPress={onOpen} className={`mb-3 rounded-2xl border p-4 ${selected ? "border-[#06B6D4] bg-cyan-50 dark:bg-[#082F49]" : "border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332]"}`}>
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground dark:text-white" numberOfLines={2}>{topic.topic}</Text>
          <Text className="mt-1 text-xs text-muted-foreground dark:text-[#94A3B8]">{topic.totalPapers} papers · {topic.momentum.toFixed(2)} papers/year</Text>
        </View>
        <TouchableOpacity onPress={onCompare} className={`rounded-full px-3 py-2 ${comparing ? "bg-violet-600" : "bg-muted dark:bg-[#26334A]"}`}>
          <Text className={`text-[10px] font-bold ${comparing ? "text-white" : "text-foreground dark:text-white"}`}>{comparing ? "Selected" : "Compare"}</Text>
        </TouchableOpacity>
      </View>
      <Bars points={topic.yearlyBreakdown} />
    </TouchableOpacity>
  );
}

export default function TrendsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const currentYear = new Date().getFullYear();
  const [tab, setTab] = useState<Tab>("overview");
  const [sortBy, setSortBy] = useState<SortBy>("momentum");
  const [yearFromText, setYearFromText] = useState(String(currentYear - 6));
  const [yearToText, setYearToText] = useState(String(currentYear));
  const [appliedYears, setAppliedYears] = useState({ yearFrom: currentYear - 6, yearTo: currentYear });
  const [selectedTopic, setSelectedTopic] = useState<string>();
  const [compareTopics, setCompareTopics] = useState<string[]>([]);
  const params = useMemo<TrendsOverviewParams>(() => ({
    ...appliedYears,
    limit: 30,
    minPapers: 1,
    sortBy,
  }), [appliedYears, sortBy]);
  const overview = useTrendsOverview(params);
  const topics = overview.data?.topics ?? [];
  const detail = useTopicTrend(selectedTopic, params);
  const relationships = useTrendRelationships(selectedTopic, params);
  const comparison = useTrendCompare({ ...appliedYears, topics: compareTopics });
  const explain = useExplainTrend();
  const history = useTrendExplainHistory(selectedTopic);
  const credits = useCreditBalance();

  useEffect(() => {
    if (!selectedTopic && topics[0]) setSelectedTopic(topics[0].topic);
  }, [selectedTopic, topics]);

  const applyYears = () => {
    const yearFrom = Number(yearFromText);
    const yearTo = Number(yearToText);
    if (!Number.isInteger(yearFrom) || !Number.isInteger(yearTo) || yearFrom > yearTo) {
      Alert.alert("Invalid range", "Enter a valid start and end year.");
      return;
    }
    setAppliedYears({ yearFrom, yearTo });
  };

  const toggleCompare = (topic: string) => {
    setCompareTopics((current) => current.includes(topic)
      ? current.filter((item) => item !== topic)
      : current.length < 5 ? [...current, topic] : current);
  };

  const generateInsight = () => explain.mutate({
    ...appliedYears,
    topic: selectedTopic,
    language: "en",
  }, {
    onSuccess: () => history.refetch(),
    onError: (error: any) => Alert.alert("AI insight failed", error?.response?.data?.error?.message ?? "Please try again."),
  });

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-border dark:border-[#26334A] px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2"><Feather name="chevron-left" size={24} color={isDark ? "#94A3B8" : "#64748B"} /></TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-foreground dark:text-white">Publication Trends</Text>
        <TouchableOpacity onPress={() => router.push("/credits" as any)} className="rounded-full bg-amber-500/15 px-2 py-1"><Text className="text-[10px] font-bold text-amber-500">{credits.data?.credits ?? "—"} cr</Text></TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={overview.isRefetching} onRefresh={() => overview.refetch()} tintColor="#06B6D4" />}
      >
        <View className="rounded-2xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332] p-4">
          <Text className="mb-2 text-xs font-bold uppercase text-muted-foreground dark:text-[#94A3B8]">Data scope</Text>
          <View className="flex-row gap-2">
            <TextInput value={yearFromText} onChangeText={setYearFromText} keyboardType="number-pad" placeholder="From" placeholderTextColor="#64748B" className="flex-1 rounded-xl border border-border dark:border-[#26334A] px-3 py-2 text-foreground dark:text-white" />
            <TextInput value={yearToText} onChangeText={setYearToText} keyboardType="number-pad" placeholder="To" placeholderTextColor="#64748B" className="flex-1 rounded-xl border border-border dark:border-[#26334A] px-3 py-2 text-foreground dark:text-white" />
            <TouchableOpacity onPress={applyYears} className="rounded-xl bg-[#1D4ED8] px-4 items-center justify-center"><Text className="text-xs font-bold text-white">Apply</Text></TouchableOpacity>
          </View>
        </View>

        <View className="my-4 flex-row rounded-xl bg-muted dark:bg-[#172033] p-1">
          {(["overview", "compare", "ai"] as Tab[]).map((item) => (
            <TouchableOpacity key={item} onPress={() => setTab(item)} className={`flex-1 rounded-lg py-2 items-center ${tab === item ? "bg-card dark:bg-[#26334A]" : ""}`}>
              <Text className={`text-xs font-bold capitalize ${tab === item ? "text-[#06B6D4]" : "text-muted-foreground dark:text-[#94A3B8]"}`}>{item === "ai" ? "AI Insight" : item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {overview.isLoading ? <ActivityIndicator className="mt-16" color="#06B6D4" /> : null}
        {overview.isError ? <Text className="mt-10 text-center text-red-500">Could not load trend data.</Text> : null}

        {tab === "overview" && overview.data ? (
          <>
            <View className="flex-row gap-2">
              <Metric label="Papers" value={String(overview.data.totalPapersInWindow)} />
              <Metric label="Topics" value={String(overview.data.uniqueTopicsInScope)} />
              <Metric label="Window" value={`${overview.data.yearFrom}-${overview.data.yearTo}`} />
            </View>
            <Bars points={overview.data.yearlyTotalPapers} color="#1D4ED8" />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 my-5 px-4">
              {(["momentum", "growth", "total"] as SortBy[]).map((option) => (
                <TouchableOpacity key={option} onPress={() => setSortBy(option)} className={`mr-2 rounded-full border px-4 py-2 ${sortBy === option ? "border-[#1D4ED8] bg-[#1D4ED8]" : "border-border dark:border-[#26334A]"}`}>
                  <Text className={`text-xs font-bold capitalize ${sortBy === option ? "text-white" : "text-foreground dark:text-white"}`}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {detail.data ? (
              <View className="mb-5 rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4">
                <Text className="text-base font-black text-foreground dark:text-white">{detail.data.topic}</Text>
                <View className="mt-3 flex-row gap-2">
                  <Metric label="Growth" value={`${detail.data.growthRatePct.toFixed(1)}%`} />
                  <Metric label="CAGR 3Y" value={detail.data.cagr3yPct == null ? "N/A" : `${detail.data.cagr3yPct.toFixed(1)}%`} />
                  <Metric label="Momentum" value={`${detail.data.momentum.toFixed(2)}/yr`} />
                </View>
                <Text className="mb-2 mt-4 text-xs font-bold uppercase text-muted-foreground dark:text-[#94A3B8]">Related topics</Text>
                {(relationships.data?.edges ?? []).slice(0, 6).map((edge) => (
                  <Text key={`${edge.source}-${edge.target}`} className="mb-1 text-xs text-foreground dark:text-white">• {edge.source === detail.data?.topic ? edge.target : edge.source}: {edge.count} shared papers</Text>
                ))}
              </View>
            ) : null}

            <Text className="mb-3 text-lg font-bold text-foreground dark:text-white">Emerging topics</Text>
            {topics.map((topic) => (
              <TopicCard key={topic.topic} topic={topic} selected={selectedTopic === topic.topic} comparing={compareTopics.includes(topic.topic)} onOpen={() => setSelectedTopic(topic.topic)} onCompare={() => toggleCompare(topic.topic)} />
            ))}
            <Text className="mb-3 mt-4 text-lg font-bold text-foreground dark:text-white">Rising keywords</Text>
            {overview.data.risingKeywords.slice(0, 10).map((keyword) => (
              <TouchableOpacity key={keyword.keyword} onPress={() => router.push(`/search?q=${encodeURIComponent(keyword.keyword)}` as any)} className="mb-2 flex-row items-center rounded-xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332] p-3">
                <Text className="flex-1 font-bold text-foreground dark:text-white">{keyword.keyword}</Text>
                <Text className="text-xs font-bold text-emerald-500">+{keyword.growthRatePct.toFixed(1)}%</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : null}

        {tab === "compare" ? (
          <>
            <Text className="mb-2 text-sm text-muted-foreground dark:text-[#94A3B8]">Choose 2–5 topics from Overview. Selected: {compareTopics.length}</Text>
            {compareTopics.map((topic) => <TouchableOpacity key={topic} onPress={() => toggleCompare(topic)} className="mb-2 flex-row items-center rounded-xl bg-violet-500/10 p-3"><Text className="flex-1 font-bold text-violet-500">{topic}</Text><Feather name="x" size={16} color="#8B5CF6" /></TouchableOpacity>)}
            {comparison.isLoading ? <ActivityIndicator className="mt-8" color="#8B5CF6" /> : null}
            {(comparison.data?.topics ?? []).map((topic, index) => (
              <View key={topic.topic} className="mt-3 rounded-2xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332] p-4">
                <Text className="font-black text-foreground dark:text-white">{topic.topic}</Text>
                <View className="mt-3 flex-row gap-2"><Metric label="Papers" value={String(topic.totalPapers)} /><Metric label="Growth" value={`${topic.growthRatePct.toFixed(1)}%`} /><Metric label="Momentum" value={topic.momentum.toFixed(2)} /></View>
                <Bars points={topic.yearlyBreakdown} color={["#06B6D4", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444"][index % 5]} />
              </View>
            ))}
          </>
        ) : null}

        {tab === "ai" ? (
          <>
            <View className="rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4">
              <View className="flex-row items-center"><Ionicons name="sparkles" size={20} color="#8B5CF6" /><Text className="ml-2 flex-1 text-base font-black text-foreground dark:text-white">Explain this trend</Text></View>
              <Text className="mt-2 text-xs leading-5 text-muted-foreground dark:text-[#94A3B8]">AI explains backend-calculated metrics for {selectedTopic ?? "the current scope"}. Your balance is {credits.data?.credits ?? "—"} credits.</Text>
              <TouchableOpacity onPress={generateInsight} disabled={explain.isPending} className="mt-4 rounded-xl bg-violet-600 py-3 items-center">
                {explain.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white">Generate AI insight</Text>}
              </TouchableOpacity>
            </View>
            {explain.data ? (
              <View className="mt-4 rounded-2xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332] p-4">
                <Text className="text-lg font-black text-foreground dark:text-white">{explain.data.summary}</Text>
                {explain.data.whyItMatters.map((item) => <Text key={item} className="mt-3 text-sm leading-6 text-foreground dark:text-white">• {item}</Text>)}
                {explain.data.cautions.map((item) => <Text key={item} className="mt-3 text-sm leading-6 text-amber-500">Caution: {item}</Text>)}
              </View>
            ) : null}
            {(history.data?.items ?? []).slice(0, 3).map((item) => (
              <View key={item.id} className="mt-3 rounded-xl border border-border dark:border-[#26334A] p-3">
                <Text className="text-xs font-bold text-foreground dark:text-white" numberOfLines={2}>{item.summary}</Text>
                <Text className="mt-1 text-[10px] text-muted-foreground dark:text-[#94A3B8]">{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
