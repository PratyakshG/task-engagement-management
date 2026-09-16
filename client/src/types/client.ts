export interface Client {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListResponse {
  clients: Client[];
}

export interface CreateClientInput {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateClientInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}
