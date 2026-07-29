import type { CreditBalance, CreditTransaction, CreditTransactionType, ResponseMeta } from "@trend/shared-types";

import { API_ROUTES } from "@/constants";
import { api } from "@/services/api-client";

export interface CreditTransactionParams {
  page?: number;
  pageSize?: number;
  type?: CreditTransactionType;
  action?: string;
}

export const creditsApi = {
  async balance(): Promise<CreditBalance> {
    const res = await api.get(API_ROUTES.credits.balance);
    return res.data.data;
  },

  async transactions(params?: CreditTransactionParams): Promise<{ transactions: CreditTransaction[]; meta: ResponseMeta }> {
    const res = await api.get(API_ROUTES.credits.transactions, { params });
    return { transactions: res.data.data, meta: res.data.meta };
  },
};
