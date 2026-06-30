export interface IProjectMember {
  targetKind: "User" | "Expert";
  targetId: string;
  role: "owner" | "member";
}

export interface IProjectPaper {
  targetKind: "Paper";
  targetId: string;
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
  targetKind: "User" | "Expert";
  targetId: string;
  role: "owner" | "member";
}

export interface AddProjectPaperRequest {
  paperId: string;
}
