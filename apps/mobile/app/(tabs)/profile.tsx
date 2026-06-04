import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/features/auth";

/**
 * Profile tab — user info, settings, logout.
 */
export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clear);
  const logoutMutation = useLogout();
  
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          clearAuth();
          logoutMutation.mutate();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F1B2D]" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-foreground dark:text-white">Profile</Text>
          <TouchableOpacity>
            <Feather name="settings" size={22} color={isDark ? "#94A3B8" : "#5A6E85"} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-border dark:bg-[#1A2332] border border-transparent dark:border-[#26334A] items-center justify-center mb-3 overflow-hidden">
            <Feather name="user" size={32} color={isDark ? "#FFFFFF" : "#0F172A"} />
          </View>
          <Text className="text-2xl font-bold text-primary dark:text-white mb-1">
            {user?.fullName || "Hoàng Long Anh"}
          </Text>
          <View className="bg-primary/20 dark:bg-primary/30 px-3 py-1 rounded-full mb-2">
            <Text className="text-primary dark:text-[#3B82F6] text-xs font-semibold">
              {user?.role === "admin" ? "Admin" : "Researcher"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="school-outline" size={14} color={isDark ? "#94A3B8" : "#64748B"} />
            <Text className="text-muted-foreground dark:text-[#94A3B8] text-sm ml-1">FPT University</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between mb-8 gap-3">
          <View className="flex-1 bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] rounded-xl py-3 items-center">
            <Text className="text-xl font-bold text-primary dark:text-white">47</Text>
            <Text className="text-xs text-muted-foreground dark:text-[#94A3B8] mt-1">Bookmarks</Text>
          </View>
          <View className="flex-1 bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] rounded-xl py-3 items-center">
            <Text className="text-xl font-bold text-primary dark:text-white">8</Text>
            <Text className="text-xs text-muted-foreground dark:text-[#94A3B8] mt-1">Topics</Text>
          </View>
          <View className="flex-1 bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] rounded-xl py-3 items-center">
            <Text className="text-xl font-bold text-primary dark:text-white">14</Text>
            <Text className="text-xs text-muted-foreground dark:text-[#94A3B8] mt-1">Reports</Text>
          </View>
        </View>

        {/* ACTIVITY */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-muted-foreground dark:text-[#94A3B8] uppercase mb-2 ml-1 tracking-wider">
            Activity
          </Text>
          <View className="bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] rounded-2xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center p-4 border-b border-border dark:border-[#26334A]">
              <Feather name="clock" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="flex-1 ml-3 text-foreground dark:text-white font-medium">Reading history</Text>
              <Feather name="chevron-right" size={20} color={isDark ? "#94A3B8" : "#CBD5E1"} />
            </TouchableOpacity>
            <View className="flex-row items-center p-4 border-b border-border dark:border-[#26334A]">
              <Feather name="bell" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="flex-1 ml-3 text-foreground dark:text-white font-medium">Notifications</Text>
              <Switch 
                value={true} 
                trackColor={{ false: "#E2E8F0", true: "#1D4ED8" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <TouchableOpacity className="flex-row items-center p-4">
              <Feather name="folder" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="flex-1 ml-3 text-foreground dark:text-white font-medium">Projects</Text>
              <Feather name="chevron-right" size={20} color={isDark ? "#94A3B8" : "#CBD5E1"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCOUNT */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-muted-foreground dark:text-[#94A3B8] uppercase mb-2 ml-1 tracking-wider">
            Account
          </Text>
          <View className="bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] rounded-2xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center p-4 border-b border-border dark:border-[#26334A]">
              <Feather name="user" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="flex-1 ml-3 text-foreground dark:text-white font-medium">Edit profile</Text>
              <Feather name="chevron-right" size={20} color={isDark ? "#94A3B8" : "#CBD5E1"} />
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center p-4">
              <Feather name="lock" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="flex-1 ml-3 text-foreground dark:text-white font-medium">Password</Text>
              <Feather name="chevron-right" size={20} color={isDark ? "#94A3B8" : "#CBD5E1"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* APPEARANCE */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-muted-foreground dark:text-[#94A3B8] uppercase mb-2 ml-1 tracking-wider">
            Appearance
          </Text>
          <View className="bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] rounded-2xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center p-4 border-b border-border dark:border-[#26334A]" onPress={toggleColorScheme}>
              <Ionicons name="color-palette-outline" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="flex-1 ml-3 text-foreground dark:text-white font-medium">Theme</Text>
              <Text className="text-muted-foreground dark:text-[#94A3B8] mr-2">{isDark ? "Dark" : "Light"}</Text>
              <Feather name="chevron-right" size={20} color={isDark ? "#94A3B8" : "#CBD5E1"} />
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center p-4">
              <Feather name="type" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="flex-1 ml-3 text-foreground dark:text-white font-medium">Font size</Text>
              <Text className="text-muted-foreground dark:text-[#94A3B8] mr-2">Default</Text>
              <Feather name="chevron-right" size={20} color={isDark ? "#94A3B8" : "#CBD5E1"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* HELP */}
        <View className="mb-8">
          <View className="bg-card dark:bg-[#1A2332] border border-border dark:border-[#26334A] rounded-2xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center p-4">
              <Feather name="help-circle" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              <Text className="flex-1 ml-3 text-foreground dark:text-white font-medium">Help</Text>
              <Feather name="chevron-right" size={20} color={isDark ? "#94A3B8" : "#CBD5E1"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          className="w-full bg-transparent border border-red-500 rounded-xl py-4 flex-row items-center justify-center active:bg-red-50"
          onPress={handleLogout}
        >
          <Text className="text-red-500 text-base font-bold">
            Sign out
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
