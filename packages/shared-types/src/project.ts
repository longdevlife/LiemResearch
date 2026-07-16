export interface ProjectMemberUserSummary {
  _id: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

export interface ProjectPaperSummary {
  _id: string;
  title: string;
  publicationYear?: number;
  authors?: Array<{ displayName?: string }>;
  abstractText?: string;
}

export interface IProjectMember {
  targetKind: "User";
  targetId: string | ProjectMemberUserSummary;
  role: "owner" | "member";
}

export interface IProjectPaper {
  targetKind: "Paper";
  targetId: string | ProjectPaperSummary;
}

export interface IProject {
  _id: string;
  title: string;
  description?: string;
  ownerId: string;
  members: IProjectMember[];
  papers: IProjectPaper[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
}

export interface AddProjectMemberRequest {
  targetKind: "User";
  targetId: string;
  role: "owner" | "member";
}

export interface AddProjectPaperRequest {
  paperId: string;
}

export type ProjectChatRole = "user" | "assistant";

export interface ProjectChatMessage {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectChatRole;
  content: string;
  citedPaperIds: string[];
  createdAt: string;
}

export interface SendProjectChatMessageRequest {
  message: string;
}

export interface SendProjectChatMessageResponse {
  answer: string;
  citedPaperIds: string[];
}

export interface ProjectChatHistoryResponse {
  messages: ProjectChatMessage[];
}

export interface ProjectTeamChatSender {
  id: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

export interface ProjectTeamChatMessage {
  id: string;
  projectId: string;
  sender: ProjectTeamChatSender;
  content: string;
  createdAt: string;
}

export interface SendProjectTeamChatMessageRequest {
  content: string;
}

export interface SendProjectTeamChatMessageResponse {
  message: ProjectTeamChatMessage;
}

export interface ProjectTeamChatHistoryResponse {
  messages: ProjectTeamChatMessage[];
}
