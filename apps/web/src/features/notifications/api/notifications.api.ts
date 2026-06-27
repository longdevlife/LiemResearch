import { api } from "@/services/api-client";
import { API_ROUTES } from "@/constants";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  paperId: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  async list(): Promise<NotificationItem[]> {
    const res = await api.get(API_ROUTES.notifications.list);
    return res.data.data;
  },

  async read(id: string): Promise<void> {
    await api.patch(API_ROUTES.notifications.read(id));
  },

  async readAll(): Promise<void> {
    await api.post(API_ROUTES.notifications.readAll);
  },
};
