import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

/**
 * Paper detail — pushed on top of (tabs).
 *
 * Owner:        Dev 1 (Discovery)
 * Designed in:  docs/STITCH_PROMPTS.md → Mobile 3
 *
 * TODO:
 *   - Use usePaper(id) from @/features/papers
 *   - Title + authors + metadata strip
 *   - AI Analysis card (collapsible)
 *   - Tabs: Abstract / Topics / References / Cited by
 *   - Sticky bottom action button: "Open full text" / "Request access"
 */
export default function PaperDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-sm text-muted-foreground">Paper ID: {id}</Text>

      <View className="mt-8 rounded-lg border border-dashed border-border p-12">
        <Text className="text-center text-sm text-muted-foreground">
          TODO: paper detail layout — title, authors, abstract, AI score, references
        </Text>
      </View>
    </ScrollView>
  );
}
