import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useColorScheme } from "nativewind";

import { useAuthStore } from "@/stores/auth-store";
import { getTrendingTopics, getRecentPapers, TrendingTopic, Paper } from "@/services/mockApi";

/**
 * Home / Search tab — primary entry after sign-in.
 *
 * Owner:        Dev 1 (Discovery)
 * Designed in:  docs/STITCH_PROMPTS.md → Mobile 2
 */
export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendingData, papersData] = await Promise.all([
          getTrendingTopics(),
          getRecentPapers()
        ]);
        setTrending(trendingData);
        setPapers(papersData);
      } catch (error) {
        console.error("Failed to fetch mock data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        {/* Header Section */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-bold text-foreground dark:text-white">
              Hi, {user?.fullName || "Bạn"}
            </Text>
            <Text className="text-sm text-primary-foreground dark:text-[#94A3B8] opacity-80 mt-1">
              What are you researching today?
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-border dark:bg-[#1A2332] border border-transparent dark:border-[#26334A] items-center justify-center overflow-hidden">
            <Text className="text-foreground dark:text-white font-bold text-lg">N/A</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-card dark:bg-[#1A2332] rounded-full px-4 py-3 mb-8 border border-border dark:border-[#26334A]">
          <Feather name="search" color={isDark ? "#94A3B8" : "#64748B"} size={20} />
          <TextInput 
            className="flex-1 ml-3 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-[#94A3B8]"
            placeholder="Search papers, authors, topics..."
            placeholderTextColor={isDark ? "#94A3B8" : "#64748B"}
          />
          <TouchableOpacity>
            <Feather name="sliders" color={isDark ? "#94A3B8" : "#64748B"} size={20} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <>
            {/* Trending Topics Section */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-foreground dark:text-white">Trending topics</Text>
                <TouchableOpacity className="flex-row items-center">
                  <Text className="text-primary dark:text-[#3B82F6] text-sm font-semibold mr-1">View all</Text>
                  <Feather name="chevron-right" color={isDark ? "#3B82F6" : "#1D4ED8"} size={16} />
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
                {trending.map((topic) => (
                  <TouchableOpacity 
                    key={topic.id} 
                    className="bg-card dark:bg-[#1A2332] rounded-xl p-4 mr-3 border border-border dark:border-[#26334A] w-48"
                  >
                    <Text className="text-foreground dark:text-white font-semibold mb-2">{topic.title}</Text>
                    <View className="flex-row items-center mb-3">
                      <Feather name="arrow-up-right" color="#22C55E" size={14} />
                      <Text className="text-success text-xs font-semibold ml-1">+{topic.trendPercentage}% this week</Text>
                    </View>
                    
                    {/* Mock Sparkline */}
                    <View className="flex-row items-end h-8 gap-1 mt-auto">
                      {topic.dataPoints.map((val, idx) => (
                        <View 
                          key={idx} 
                          className="flex-1 rounded-sm bg-primary"
                          style={{ 
                            height: `${Math.max(10, val)}%`,
                            opacity: 0.5 + (idx * 0.08) 
                          }}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Recent Papers Section */}
            <View className="mb-8">
              <Text className="text-xl font-bold text-foreground dark:text-white mb-4">Recent papers</Text>
              
              {papers.map((paper) => (
                <TouchableOpacity 
                  key={paper.id} 
                  onPress={() => router.push(`/paper/${paper.id}` as any)}
                  className="bg-card dark:bg-[#1A2332] rounded-xl p-4 mb-3 border border-border dark:border-[#26334A]"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-foreground dark:text-white font-semibold flex-1 mr-4" numberOfLines={2}>
                      {paper.title}
                    </Text>
                    <TouchableOpacity>
                      <Feather 
                        name="bookmark"
                        color={paper.isBookmarked ? (isDark ? "#3B82F6" : "#1D4ED8") : (isDark ? "#94A3B8" : "#64748B")} 
                        size={20} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs mb-3" numberOfLines={1}>
                    {paper.authors}
                  </Text>
                  
                  <View className="flex-row items-center">
                    <Text className="text-muted-foreground dark:text-[#94A3B8] text-xs font-semibold mr-4">
                      ❞ {paper.citations}
                    </Text>
                    <View className="flex-row items-center bg-primary/20 px-2 py-1 rounded-md">
                      <Ionicons name="sparkles" color="#06B6D4" size={12} />
                      <Text className="text-accent text-xs font-bold ml-1">AI {paper.aiScore.toFixed(2)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Actions Section */}
            <View>
              <Text className="text-xl font-bold text-foreground dark:text-white mb-4">Quick actions</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity className="flex-1 bg-card dark:bg-[#1A2332] rounded-xl p-4 items-center border border-border dark:border-[#26334A]">
                  <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mb-2">
                    <Feather name="trending-up" color={isDark ? "#3B82F6" : "#1D4ED8"} size={20} />
                  </View>
                  <Text className="text-foreground dark:text-white text-sm font-semibold">Browse trends</Text>
                </TouchableOpacity>
                
                <TouchableOpacity className="flex-1 bg-card dark:bg-[#1A2332] rounded-xl p-4 items-center border border-border dark:border-[#26334A]">
                  <View className="w-10 h-10 rounded-full bg-accent/20 items-center justify-center mb-2">
                    <Ionicons name="sparkles" color="#06B6D4" size={20} />
                  </View>
                  <Text className="text-foreground dark:text-white text-sm font-semibold">AI reports</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

