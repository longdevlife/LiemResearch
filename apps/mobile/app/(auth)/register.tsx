import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";

/**
 * Register screen.
 *
 * Owner:        Dev 2 (Personalization)
 * Designed in:  docs/STITCH_PROMPTS.md → Mobile 1 (tab variant)
 * Reference:    apps/web/src/features/auth/components/register-form.tsx
 *
 * TODO:
 *   - Build form with react-hook-form + zodResolver(registerSchema)
 *   - Use useRegister() from @/features/auth — onSuccess: redirect to (tabs)
 */
export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-foreground">Create account</Text>
        <Text className="mt-2 text-sm text-muted-foreground">
          Register screen placeholder
        </Text>
        <View className="mt-12 w-full rounded-lg border border-dashed border-border p-12">
          <Text className="text-center text-xs text-muted-foreground">
            TODO: build RegisterForm here
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
