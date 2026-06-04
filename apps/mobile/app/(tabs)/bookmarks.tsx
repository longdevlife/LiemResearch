import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Bookmarks tab — saved papers, topics, authors.
 *
 * Owner:        Dev 2 (Personalization) — Phase D for backend, Phase E for UI
 * Designed in:  docs/STITCH_PROMPTS.md → Mobile 4
 *
 * TODO (Phase D-E):
 *   - Filter chips: All / Papers / Topics / Authors
 *   - List of bookmark items (each card: icon + title + metadata + delete)
 *   - Swipe-to-delete gesture
 *   - Empty state when no bookmarks
 */
export default function BookmarksScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-3xl font-bold text-foreground dark:text-white">Bookmarks</Text>
        <Text className="mt-2 text-sm text-muted-foreground dark:text-[#94A3B8]">
          Saved papers, topics, and authors
        </Text>

        <View className="mt-8 rounded-lg border border-dashed border-border dark:border-[#26334A] p-12">
          <Text className="text-center text-sm text-muted-foreground dark:text-[#94A3B8]">
            TODO: bookmark list with filter chips and swipe-to-delete
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
