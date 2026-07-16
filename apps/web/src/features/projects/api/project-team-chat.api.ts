import type {
  ProjectTeamChatHistoryResponse,
  ProjectTeamChatMessage,
  SendProjectTeamChatMessageResponse,
} from "@trend/shared-types";
import { API_ROUTES } from "@/constants";
import { api } from "@/services/api-client";

export const projectTeamChatApi = {
  async listMessages(projectId: string, params?: { limit?: number; before?: string }): Promise<ProjectTeamChatMessage[]> {
    const res = await api.get<{
      success: boolean;
      data: ProjectTeamChatHistoryResponse;
      meta: { count: number };
    }>(API_ROUTES.projects.teamChat.history(projectId), { params });
    return res.data.data.messages;
  },

  async sendMessage(projectId: string, content: string): Promise<ProjectTeamChatMessage> {
    const res = await api.post<{
      success: boolean;
      data: SendProjectTeamChatMessageResponse;
      meta: null;
    }>(API_ROUTES.projects.teamChat.send(projectId), { content });
    return res.data.data.message;
  },

  async markRead(projectId: string, messageId: string): Promise<ProjectTeamChatMessage> {
    const res = await api.post<{
      success: boolean;
      data: SendProjectTeamChatMessageResponse;
      meta: null;
    }>(API_ROUTES.projects.teamChat.read(projectId, messageId));
    return res.data.data.message;
  },

  async deleteMessage(projectId: string, messageId: string, reason?: string): Promise<ProjectTeamChatMessage> {
    const res = await api.delete<{
      success: boolean;
      data: SendProjectTeamChatMessageResponse;
      meta: null;
    }>(API_ROUTES.projects.teamChat.delete(projectId, messageId), { data: { reason } });
    return res.data.data.message;
  },
};
