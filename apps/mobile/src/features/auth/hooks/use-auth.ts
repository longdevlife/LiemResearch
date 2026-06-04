import { useMutation, useQuery } from "@tanstack/react-query";
import type { LoginRequest, RegisterRequest } from "@trend/shared-types";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "../api/auth.api";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (data) => setAuth(data),
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
    onSuccess: (data) => setAuth(data),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().tokens?.refreshToken;
      if (refreshToken) await authApi.logout(refreshToken);
    },
    onSettled: () => clear(),
  });
}

export function useCurrentUser() {
  const tokens = useAuthStore((s) => s.tokens);
  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => authApi.me(),
    enabled: !!tokens?.accessToken,
  });
}
