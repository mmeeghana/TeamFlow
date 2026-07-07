import { api } from '../../lib/api';
import type { ProjectUser } from '../projects/types';

export type RcaStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type RcaSection = { id: string; title: string; content: string; order: number };
export type RcaReview = { id: string; reviewerId: string | null; decision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'; comment: string | null; decidedAt: string | null; reviewer: ProjectUser | null };
export type Rca = { id: string; title: string; summary: string | null; severity: string; status: RcaStatus; taskId: string | null; createdById: string | null; task: { id: string; title: string } | null; createdBy: ProjectUser | null; sections: RcaSection[]; reviews: RcaReview[]; createdAt: string; updatedAt: string };
export type RcaPayload = { taskId: string; title: string; summary?: string | null; severity: string; sections: Array<{ title: string; content: string }> };

export async function getRcas(projectId: string) {
  const response = await api.get<{ rcas: Rca[] }>(`/projects/${projectId}/rcas`);
  return response.data.rcas;
}

export async function createRca(projectId: string, payload: RcaPayload) {
  const response = await api.post<{ rca: Rca }>(`/projects/${projectId}/rcas`, payload);
  return response.data.rca;
}

export async function updateRca(projectId: string, rcaId: string, payload: Partial<RcaPayload>) {
  const response = await api.patch<{ rca: Rca }>(`/projects/${projectId}/rcas/${rcaId}`, payload);
  return response.data.rca;
}

export async function deleteRca(projectId: string, rcaId: string) {
  const response = await api.delete<{ message: string }>(`/projects/${projectId}/rcas/${rcaId}`);
  return response.data;
}

export async function submitRca(projectId: string, rcaId: string) {
  const response = await api.post<{ rca: Rca }>(`/projects/${projectId}/rcas/${rcaId}/submit`);
  return response.data.rca;
}

export async function assignRcaReviewers(projectId: string, rcaId: string, reviewerIds: string[]) {
  const response = await api.post<{ rca: Rca }>(`/projects/${projectId}/rcas/${rcaId}/reviewers`, { reviewerIds });
  return response.data.rca;
}

export async function submitRcaReview(projectId: string, rcaId: string, reviewId: string, payload: { decision: 'APPROVED' | 'REJECTED'; comment: string }) {
  const response = await api.post<{ rca: Rca; review: RcaReview }>(`/projects/${projectId}/rcas/${rcaId}/reviews/${reviewId}`, payload);
  return response.data;
}
