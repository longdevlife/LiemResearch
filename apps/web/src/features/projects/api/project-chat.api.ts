import type {
  ProjectChatHistoryResponse,
  ProjectChatMessage,
  SendProjectChatMessageResponse,
} from "@trend/shared-types";
import { API_ROUTES } from "@/constants";
import { api } from "@/services/api-client";

export const projectChatApi = {
  async listHistory(projectId: string, limit = 50): Promise<ProjectChatMessage[]> {
    const res = await api.get<{
      success: boolean;
      data: ProjectChatHistoryResponse;
      meta: { count: number };
    }>(API_ROUTES.projects.chat.history(projectId), { params: { limit } });
    return res.data.data.messages;
  },

  async sendMessage(projectId: string, message: string): Promise<SendProjectChatMessageResponse> {
    const res = await api.post<{
      success: boolean;
      data: SendProjectChatMessageResponse;
      meta: null;
    }>(API_ROUTES.projects.chat.send(projectId), { message });
    return res.data.data;
  },
};
