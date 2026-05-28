import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/features/auth";

/**
 * Profile tab — user info, settings, logout.
 * Giao diện Light Mode Clean UI đồng bộ
 */
export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clear);
  const logoutMutation = useLogout();

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          // Kích hoạt clear store ngay lập tức để đưa user về màn hình login 100% thành công
          clearAuth();
          // Vẫn gọi mutation ngầm để báo cho BE biết (nếu BE đang chạy)
          logoutMutation.mutate();
        },
      },
    ]);
  };


  return (
    <SafeAreaView className="flex-1 bg-[#FFFFFF]" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-3xl font-bold text-[#0F172A] mb-6">Profile</Text>

        {/* User Card Light Mockup */}
        <View className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 mb-6 flex-row items-center gap-4 shadow-sm">
          <View className="w-14 h-14 rounded-full bg-[#EAEFFC] border border-[#D5E1F9] flex items-center justify-center">
            <Ionicons name="person" size={24} color="#09258A" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-[#0F172A]">
              {user?.fullName || "Người dùng"}
            </Text>
            <Text className="text-xs text-[#5A6E85]">
              {user?.email || "email@university.edu"}
            </Text>
            <View className="bg-[#EAEFFC] border border-[#D5E1F9] rounded-md px-2 py-0.5 mt-1 self-start">
              <Text className="text-[#09258A] text-[10px] font-bold uppercase">
                {user?.role || "researcher"}
              </Text>
            </View>
          </View>
        </View>

        {/* Placeholder Menu */}
        <View className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 gap-4 mb-6 shadow-sm">
          <Text className="text-xs font-semibold text-[#5A6E85] uppercase tracking-wider pl-1">
            Cài đặt hệ thống
          </Text>
          <Text className="text-center text-sm text-[#5A6E85] py-4 border border-dashed border-[#E2E8F0] rounded-xl">
            Setting...
          </Text>
        </View>

        {/* Destructive Logout Button */}
        <TouchableOpacity
          className="w-full h-12 bg-transparent border border-red-500/30 rounded-xl flex-row items-center justify-center gap-2 active:bg-red-50"
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text className="text-[#EF4444] text-sm font-semibold">
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
