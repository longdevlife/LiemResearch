import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useLogin } from "@/features/auth";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Màn hình Đăng nhập (Login screen) - Giao diện Light Mode Clean UI
 * Giống 100% ảnh mockup 1 bạn cung cấp
 */
export default function LoginScreen() {
  const [email, setEmail] = useState("khoakiki");
  const [password, setPassword] = useState("khoakiki");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterTab, setIsRegisterTab] = useState(false);
  const [isMocking, setIsMocking] = useState(false);

  const loginMutation = useLogin();
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);

  // Tự động chuyển hướng sang màn hình chính khi phát hiện có accessToken
  useEffect(() => {
    if (accessToken) {
      router.replace("/(tabs)");
    }
  }, [accessToken]);


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tài khoản và mật khẩu");
      return;
    }

    // 1. Kiểm tra mockup tài khoản khoakiki / khoakiki
    if (email.trim() === "khoakiki" && password === "khoakiki") {
      setIsMocking(true);
      setTimeout(() => {
        setAuth({
          user: {
            id: "mock-id-khoakiki",
            email: "khoakiki@university.edu",
            fullName: "Khoa Kiki",
            role: "researcher",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          tokens: {
            accessToken: "mock-access-token-khoakiki",
            refreshToken: "mock-refresh-token-khoakiki",
            accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          },
        });
        setIsMocking(false);
      }, 800);
      return;
    }

    // 2. Nếu là tài khoản khác, thực hiện gọi API qua hook useLogin thực tế.
    //    Backend LoginSchema yêu cầu email hợp lệ (z.string().email()), nên ô
    //    này nên nhập email thật khi gọi API thực — "khoakiki" chỉ dùng cho mock.
    loginMutation.mutate(
      { email, password },
      {
        onError: (error: any) => {
          const errMsg =
            error?.response?.data?.error?.message ||
            "Sai tài khoản hoặc mật khẩu";
          Alert.alert("Đăng nhập thất bại", errMsg);
        },
      },
    );
  };

  const isLoading = loginMutation.isPending || isMocking;

  return (
    <SafeAreaView className="flex-1 bg-[#FFFFFF]" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-[#EAEFFC] border border-[#D5E1F9] flex items-center justify-center mb-5 shadow-sm">
              <Ionicons name="analytics" size={30} color="#09258A" />
            </View>
            <Text className="text-3xl font-bold text-[#0F172A] tracking-tight text-center">
              Publication Trend
            </Text>
            <Text className="mt-1.5 text-sm text-[#5A6E85] text-center">
              AI-powered research discovery
            </Text>
          </View>

          {/* Form Area */}
          <View className="w-full">
            {/* Tab Switcher */}
            <View className="bg-[#F1F3F7] rounded-xl p-1 flex-row mb-6">
              <TouchableOpacity
                className={`flex-1 py-2.5 rounded-lg flex-row justify-center items-center ${
                  !isRegisterTab ? "bg-white shadow-sm" : ""
                }`}
                onPress={() => setIsRegisterTab(false)}
                activeOpacity={0.8}
              >
                <Text
                  className={`font-semibold text-sm ${
                    !isRegisterTab ? "text-[#0F172A]" : "text-[#5A6E85]"
                  }`}
                >
                  Sign in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2.5 rounded-lg flex-row justify-center items-center ${
                  isRegisterTab ? "bg-white shadow-sm" : ""
                }`}
                onPress={() => setIsRegisterTab(true)}
                activeOpacity={0.8}
              >
                <Text
                  className={`font-semibold text-sm ${
                    isRegisterTab ? "text-[#0F172A]" : "text-[#5A6E85]"
                  }`}
                >
                  Create account
                </Text>
              </TouchableOpacity>
            </View>

            {isRegisterTab ? (
              /* Register View placeholder for other devs */
              <View className="py-8 items-center justify-center bg-white border border-[#E2E8F0] rounded-2xl p-6">
                <Ionicons name="person-add-outline" size={48} color="#A0AEC0" />
                <Text className="mt-4 text-[#0F172A] font-semibold text-center">
                  Create account
                </Text>
                <Text className="mt-2 text-[#5A6E85] text-xs text-center px-4">
                  Login...
                </Text>
                <TouchableOpacity
                  className="mt-6 border border-dashed border-[#09258A]/30 rounded-xl px-4 py-2"
                  onPress={() => setIsRegisterTab(false)}
                >
                  <Text className="text-[#09258A] text-xs font-semibold">
                    Quay lại Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Sign in Form */
              <View className="gap-5">
                {/* Email/Username Input */}
                <View className="gap-2">
                  <Text className="text-xs font-semibold text-[#5A6E85] pl-1">
                    Email address
                  </Text>
                  <View className="relative flex-row items-center h-12 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-4">
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color="#A0AEC0"
                      className="mr-3"
                    />
                    <TextInput
                      className="flex-1 h-full text-[#0F172A] text-sm"
                      placeholder="researcher@university.edu"
                      placeholderTextColor="#A0AEC0"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View className="gap-2">
                  <Text className="text-xs font-semibold text-[#5A6E85] pl-1">
                    Password
                  </Text>
                  <View className="relative flex-row items-center h-12 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-4">
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color="#A0AEC0"
                      className="mr-3"
                    />
                    <TextInput
                      className="flex-1 h-full text-[#0F172A] text-sm"
                      placeholder="••••••••••••"
                      placeholderTextColor="#A0AEC0"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      className="p-1"
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color="#A0AEC0"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password Link */}
                <View className="flex-row justify-end mt-[-8px]">
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text className="text-xs font-semibold text-[#09258A]">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Primary Sign In Button */}
                <TouchableOpacity
                  className={`w-full h-12 bg-[#09258A] rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-[#09258A]/15 active:scale-[0.98] ${
                    isLoading ? "opacity-75" : ""
                  }`}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text className="text-white text-sm font-bold">
                        Sign in
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View className="flex-row items-center gap-4 my-2">
                  <View className="flex-1 h-[1px] bg-[#E2E8F0]" />
                  <Text className="text-[10px] text-[#A0AEC0] font-bold uppercase tracking-wider">
                    OR
                  </Text>
                  <View className="flex-1 h-[1px] bg-[#E2E8F0]" />
                </View>

                {/* Google Sign In */}
                <TouchableOpacity
                  className="w-full h-12 bg-white border border-[#E2E8F0] rounded-xl flex-row items-center justify-center gap-3 active:bg-slate-50"
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  {/* Simulated Google circular G icon from mockup */}
                  <View className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                    <Text
                      className="text-white font-bold text-[10px]"
                      style={{ fontFamily: "System" }}
                    >
                      G
                    </Text>
                  </View>
                  <Text className="text-[#0F172A] text-sm font-semibold">
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer Section */}
          <View className="mt-12 items-center">
            <Text className="text-[11px] text-[#5A6E85] text-center leading-relaxed px-6">
              By continuing, you agree to our{" "}
              <Text className="text-[#09258A] underline">Terms of Service</Text>{" "}
              and{"\n"}
              <Text className="text-[#09258A] underline">Privacy Policy</Text>.
            </Text>
            {/* Visual spacer bar to mimic mobile safe bottom area */}
            <View className="w-20 h-1 bg-[#E2E8F0] rounded-full mt-6" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
