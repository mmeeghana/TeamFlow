export type ProjectUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type ProjectMember = {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: ProjectUser;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  themeColor: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: ProjectUser;
  members: ProjectMember[];
  _count: {
    members: number;
    tasks: number;
    activityLogs: number;
  };
};

export type ProjectsResponse = {
  items: Project[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
};
