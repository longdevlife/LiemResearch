import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";

import { useSearch } from "@/features/search";
import { useCreditBalance } from "@/features/credits";

export default function SearchScreen() {
  const initial = useLocalSearchParams<{ q?: string }>().q ?? "";
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [input, setInput] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [openAccess, setOpenAccess] = useState(false);
  const [rerank, setRerank] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [paperKind, setPaperKind] = useState<string>();
  const [provider, setProvider] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({
    q: query,
    page,
    pageSize: 10,
    yearFrom: Number(yearFrom) || undefined,
    yearTo: Number(yearTo) || undefined,
    openAccess: openAccess || undefined,
    paperKind,
    provider: provider.trim() || undefined,
    sources: source.trim() ? [source.trim()] : undefined,
    sort,
    rerank,
    minScore,
  }), [query, page, yearFrom, yearTo, openAccess, paperKind, provider, source, sort, rerank, minScore]);
  const results = useSearch(params);
  const credits = useCreditBalance();

  useEffect(() => {
    if (rerank && results.dataUpdatedAt > 0) credits.refetch();
  }, [rerank, results.dataUpdatedAt]);

  const submit = () => {
    setPage(1);
    setQuery(input.trim());
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-border dark:border-[#26334A] px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Feather name="chevron-left" size={24} color={isDark ? "#94A3B8" : "#64748B"} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-foreground dark:text-[#F8FAFC]">Semantic Search</Text>
        <Text className="text-[10px] font-bold text-amber-500">{credits.data?.credits ?? "—"} cr</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 rounded-xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332] px-4 py-3 text-foreground dark:text-white"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={submit}
            placeholder="Papers, topics, methods..."
            placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
          />
          <TouchableOpacity onPress={submit} className="w-12 rounded-xl bg-[#1D4ED8] items-center justify-center">
            <Feather name="search" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View className="mt-3 rounded-2xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332] p-4">
          <Text className="mb-3 text-xs font-bold uppercase text-muted-foreground dark:text-[#94A3B8]">Filters</Text>
          <View className="flex-row gap-2">
            <TextInput className="flex-1 rounded-xl border border-border dark:border-[#26334A] px-3 py-2 text-foreground dark:text-white" value={yearFrom} onChangeText={setYearFrom} placeholder="From year" keyboardType="number-pad" placeholderTextColor="#64748B" />
            <TextInput className="flex-1 rounded-xl border border-border dark:border-[#26334A] px-3 py-2 text-foreground dark:text-white" value={yearTo} onChangeText={setYearTo} placeholder="To year" keyboardType="number-pad" placeholderTextColor="#64748B" />
          </View>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm text-foreground dark:text-white">Open access only</Text>
            <Switch value={openAccess} onValueChange={setOpenAccess} />
          </View>
          <Text className="mb-2 mt-3 text-xs text-muted-foreground dark:text-[#94A3B8]">Paper type</Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              ["All", undefined],
              ["Journal", "article"],
              ["Conference", "proceedings"],
              ["Preprint", "preprint"],
            ].map(([label, value]) => (
              <TouchableOpacity key={String(label)} onPress={() => setPaperKind(value)} className={`rounded-full px-3 py-2 ${paperKind === value ? "bg-[#1D4ED8]" : "bg-muted dark:bg-[#26334A]"}`}>
                <Text className={`text-xs font-bold ${paperKind === value ? "text-white" : "text-foreground dark:text-white"}`}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="mb-2 mt-3 text-xs text-muted-foreground dark:text-[#94A3B8]">Provider</Text>
          <View className="flex-row flex-wrap gap-2">
            {["", "openalex", "semanticscholar", "crossref", "arxiv"].map((option) => (
              <TouchableOpacity key={option || "all"} onPress={() => setProvider(option)} className={`rounded-full px-3 py-2 ${provider === option ? "bg-[#1D4ED8]" : "bg-muted dark:bg-[#26334A]"}`}>
                <Text className={`text-xs font-bold ${provider === option ? "text-white" : "text-foreground dark:text-white"}`}>{option || "All"}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput className="mt-3 rounded-xl border border-border dark:border-[#26334A] px-3 py-2 text-foreground dark:text-white" value={source} onChangeText={setSource} placeholder="Source or journal" placeholderTextColor="#64748B" />
          <Text className="mb-2 mt-3 text-xs text-muted-foreground dark:text-[#94A3B8]">Sort results</Text>
          <View className="flex-row gap-2">
            {["relevance", "year", "citations"].map((option) => (
              <TouchableOpacity key={option} onPress={() => setSort(option)} className={`rounded-full px-3 py-2 ${sort === option ? "bg-[#1D4ED8]" : "bg-muted dark:bg-[#26334A]"}`}>
                <Text className={`text-xs font-bold capitalize ${sort === option ? "text-white" : "text-foreground dark:text-white"}`}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-foreground dark:text-white">AI reranking</Text>
              <Text className="text-[10px] text-amber-500">Costs 5 credits</Text>
            </View>
            <Switch value={rerank} onValueChange={setRerank} />
          </View>
          <View className="mt-3">
            <Text className="mb-2 text-xs text-muted-foreground dark:text-[#94A3B8]">Minimum similarity: {Math.round(minScore * 100)}%</Text>
            <View className="flex-row gap-2">
              {[0, 0.5, 0.7, 0.8].map((score) => (
                <TouchableOpacity key={score} onPress={() => setMinScore(score)} className={`rounded-full px-3 py-2 ${minScore === score ? "bg-[#1D4ED8]" : "bg-muted dark:bg-[#26334A]"}`}>
                  <Text className={minScore === score ? "text-white text-xs font-bold" : "text-xs text-foreground dark:text-white"}>{Math.round(score * 100)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {results.isLoading ? <ActivityIndicator className="mt-10" color="#06B6D4" /> : null}
        {results.isError ? <Text className="mt-8 text-center text-red-500">Search failed. Please try again.</Text> : null}
        {(results.data?.papers ?? []).map((paper) => (
          <TouchableOpacity key={paper.id} onPress={() => router.push(`/paper/${paper.id}` as any)} className="mt-3 rounded-2xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332] p-4">
            <View className="flex-row items-start gap-3">
              <Text className="flex-1 text-sm font-bold text-foreground dark:text-white" numberOfLines={3}>{paper.title}</Text>
              <Text className="text-xs font-bold text-[#06B6D4]">{(paper.score * 100).toFixed(1)}%</Text>
            </View>
            <Text className="mt-2 text-xs text-muted-foreground dark:text-[#94A3B8]">{paper.publicationYear ?? "Unknown year"} · {paper.citationCount ?? 0} citations</Text>
          </TouchableOpacity>
        ))}
        {results.data && results.data.meta.totalPages > 1 ? (
          <View className="mt-5 flex-row items-center justify-center gap-4">
            <TouchableOpacity disabled={page <= 1} onPress={() => setPage((value) => value - 1)} className="rounded-xl border border-border px-4 py-2 disabled:opacity-40"><Text className="text-foreground dark:text-white">Previous</Text></TouchableOpacity>
            <Text className="text-sm text-muted-foreground dark:text-[#94A3B8]">{page}/{results.data.meta.totalPages}</Text>
            <TouchableOpacity disabled={page >= results.data.meta.totalPages} onPress={() => setPage((value) => value + 1)} className="rounded-xl border border-border px-4 py-2 disabled:opacity-40"><Text className="text-foreground dark:text-white">Next</Text></TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
