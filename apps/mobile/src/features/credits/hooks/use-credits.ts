import { useQuery } from "@tanstack/react-query";

import { creditsApi, type CreditTransactionParams } from "../api/credits.api";

export const creditKeys = {
  balance: () => ["credits", "balance"] as const,
  transactions: (params?: CreditTransactionParams) => ["credits", "transactions", params] as const,
};

export function useCreditBalance() {
  return useQuery({
    queryKey: creditKeys.balance(),
    queryFn: () => creditsApi.balance(),
  });
}

export function useCreditTransactions(params?: CreditTransactionParams) {
  return useQuery({
    queryKey: creditKeys.transactions(params),
    queryFn: () => creditsApi.transactions(params),
  });
}
