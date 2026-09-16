export interface TaskTemplate {
  id: string;
  serviceTypeId: string;
  title: string;
  description: string | null;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTemplateListResponse {
  taskTemplates: TaskTemplate[];
}

export interface CreateTaskTemplateInput {
  title: string;
  description?: string;
  sequence: number;
}

export interface UpdateTaskTemplateInput {
  title?: string;
  description?: string | null;
  sequence?: number;
}
