import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Notifications tab — new papers matching followed topics, project invites.
 *
 * Owner:        Dev 2 (Personalization) — Phase D
 *
 * TODO (Phase D):
 *   - Grouped list: "Today" / "Yesterday" / "This week"
 *   - Each row: icon + title + timestamp + read/unread state
 *   - Pull-to-refresh
 *   - Tap row → mark as read + navigate to target
 *   - Empty state
 */
export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-3xl font-bold text-foreground dark:text-white">Notifications</Text>
        <Text className="mt-2 text-sm text-muted-foreground dark:text-[#94A3B8]">
          Updates on your followed topics
        </Text>

        <View className="mt-8 rounded-lg border border-dashed border-border dark:border-[#26334A] p-12">
          <Text className="text-center text-sm text-muted-foreground dark:text-[#94A3B8]">
            TODO: grouped notification list
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
