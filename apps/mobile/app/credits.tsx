import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";

import { useCreditBalance, useCreditTransactions } from "@/features/credits";

const actionLabels: Record<string, string> = {
  search_rerank: "AI search reranking",
  fast_report: "Fast report",
  standard_report: "Standard report",
  deep_mcp_report: "Deep analysis report",
  generate_gaps: "Research gap analysis",
  generate_directions: "Future directions",
  project_chat_message: "Project AI chat",
  paper_request: "Paper request",
  paper_download: "Paper download",
  paper_upload_reward: "PDF upload reward",
};

export default function CreditsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const balance = useCreditBalance();
  const history = useCreditTransactions({ page: 1, pageSize: 50 });
  const refreshing = balance.isRefetching || history.isRefetching;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-border dark:border-[#26334A] px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2"><Feather name="chevron-left" size={24} color={isDark ? "#94A3B8" : "#64748B"} /></TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-foreground dark:text-white">Credits</Text>
        <View className="w-8" />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { balance.refetch(); history.refetch(); }} tintColor="#F59E0B" />}
      >
        <View className="rounded-3xl bg-[#1D4ED8] p-6">
          <Text className="text-sm font-bold text-blue-100">Current balance</Text>
          <Text className="mt-2 text-4xl font-black text-white">{balance.data?.credits ?? "—"}</Text>
          <Text className="mt-1 text-xs text-blue-100">credits available</Text>
        </View>
        <Text className="mb-3 mt-6 text-lg font-bold text-foreground dark:text-white">Transaction history</Text>
        {history.isLoading ? <ActivityIndicator className="mt-8" color="#06B6D4" /> : null}
        {(history.data?.transactions ?? []).map((transaction) => {
          const positive = transaction.type !== "charge";
          const signedAmount = positive ? transaction.amount : -transaction.amount;
          return (
            <View key={transaction.id} className="mb-3 flex-row items-center rounded-2xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332] p-4">
              <View className={`h-10 w-10 rounded-xl items-center justify-center ${positive ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                <Feather name={positive ? "plus" : "minus"} size={18} color={positive ? "#10B981" : "#EF4444"} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-foreground dark:text-white">{actionLabels[transaction.action] ?? transaction.action.replaceAll("_", " ")}</Text>
                <Text className="mt-1 text-xs text-muted-foreground dark:text-[#94A3B8]">{new Date(transaction.createdAt).toLocaleString()} · {transaction.status}</Text>
              </View>
              <Text className={`text-base font-black ${positive ? "text-emerald-500" : "text-red-500"}`}>{positive ? "+" : ""}{signedAmount}</Text>
            </View>
          );
        })}
        {!history.isLoading && (history.data?.transactions.length ?? 0) === 0 ? <Text className="py-10 text-center text-muted-foreground dark:text-[#94A3B8]">No credit transactions yet.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
