import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";

import { useCurrentUser, useUpdateProfile } from "@/features/auth";

export default function EditProfileScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const currentUser = useCurrentUser();
  const update = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [interests, setInterests] = useState("");

  useEffect(() => {
    const user = currentUser.data?.user;
    if (!user) return;
    setFullName(user.fullName ?? "");
    setInstitution(user.institution ?? "");
    setInterests((user.researchInterests ?? []).join(", "));
  }, [currentUser.data?.user]);

  const save = () => update.mutate({
    fullName: fullName.trim(),
    institution: institution.trim() || undefined,
    researchInterests: interests.split(",").map((item) => item.trim()).filter(Boolean),
  }, {
    onSuccess: () => { Alert.alert("Saved", "Profile updated."); router.back(); },
    onError: (error: any) => Alert.alert("Update failed", error?.response?.data?.error?.message ?? "Please try again."),
  });

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-border dark:border-[#26334A] px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2"><Feather name="chevron-left" size={24} color={isDark ? "#94A3B8" : "#64748B"} /></TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-foreground dark:text-white">Edit profile</Text><View className="w-8" />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {[
          { label: "Full name", value: fullName, setter: setFullName, placeholder: "Your full name" },
          { label: "Institution", value: institution, setter: setInstitution, placeholder: "University or organization" },
          { label: "Research interests", value: interests, setter: setInterests, placeholder: "RAG, LLM, medicine" },
        ].map((field) => (
          <View key={field.label} className="mb-4">
            <Text className="mb-2 text-xs font-bold uppercase text-muted-foreground dark:text-[#94A3B8]">{field.label}</Text>
            <TextInput className="rounded-xl border border-border dark:border-[#26334A] bg-card dark:bg-[#1A2332] px-4 py-3 text-foreground dark:text-white" value={field.value} onChangeText={field.setter} placeholder={field.placeholder} placeholderTextColor="#64748B" />
          </View>
        ))}
        <TouchableOpacity onPress={save} disabled={update.isPending || !fullName.trim()} className="mt-2 rounded-xl bg-[#1D4ED8] py-4 items-center disabled:opacity-50">
          {update.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white">Save changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
