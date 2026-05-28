import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/auth-store";

/**
 * Home / Search tab — primary entry after sign-in.
 *
 * Owner:        Dev 1 (Discovery)
 * Designed in:  docs/STITCH_PROMPTS.md → Mobile 2
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-3xl font-bold text-foreground">
          Chào {user?.fullName || "bạn"} 👋
        </Text>
        <Text className="mt-2 text-base text-muted-foreground">
          Hôm nay bạn muốn nghiên cứu đề tài gì?
        </Text>

        <View className="mt-8 rounded-lg border border-dashed border-border p-12">
          <Text className="text-center text-sm text-muted-foreground">
            Search...
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
