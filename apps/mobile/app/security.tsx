import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";

import { useChangePassword } from "@/features/auth";

export default function SecurityScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = () => {
    if (newPassword !== confirm) return Alert.alert("Passwords do not match", "Confirm the new password again.");
    changePassword.mutate({ currentPassword, newPassword }, {
      onSuccess: () => { Alert.alert("Updated", "Password changed successfully."); router.back(); },
      onError: (error: any) => Alert.alert("Change failed", error?.response?.data?.error?.message ?? "Please try again."),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-border dark:border-[#26334A] px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2"><Feather name="chevron-left" size={24} color={isDark ? "#94A3B8" : "#64748B"} /></TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-foreground dark:text-white">Security</Text><View className="w-8" />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {[
          { label: "Current password", value: currentPassword, setter: setCurrentPassword },
          { label: "New password", value: newPassword, setter: setNewPassword },
          { label: "Confirm new password", value: confirm, setter: setConfirm },
        ].map((field) => (
          <View key={field.label} className="mb-4">
            <Text className="mb-2 text-xs font-bold uppercase text-muted-foreground dark:text-[#94A3B8]">{field.label}</Text>
            <TextInput secureTextEntry className="rounded-xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332] px-4 py-3 text-foreground dark:text-white" value={field.value} onChangeText={field.setter} placeholder="••••••••" placeholderTextColor="#64748B" />
          </View>
        ))}
        <TouchableOpacity onPress={submit} disabled={changePassword.isPending || !currentPassword || newPassword.length < 8} className="mt-2 rounded-xl bg-[#1D4ED8] py-4 items-center disabled:opacity-50">
          {changePassword.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white">Change password</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
