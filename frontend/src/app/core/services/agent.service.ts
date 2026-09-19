import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { SuccessResponse } from '../models/api-response.model';
import { AgentPerformanceView, AgentView, CreateAgentPayload } from '../models/agent.model';
import { AgentStatus } from '../models/enums.model';

@Injectable({ providedIn: 'root' })
export class AgentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<SuccessResponse<{ agents: AgentView[] }>> {
    return this.http.get<SuccessResponse<{ agents: AgentView[] }>>(`${this.baseUrl}/agents`);
  }

  getById(id: string): Observable<SuccessResponse<{ agent: AgentView }>> {
    return this.http.get<SuccessResponse<{ agent: AgentView }>>(`${this.baseUrl}/agents/${id}`);
  }

  getMe(): Observable<SuccessResponse<{ agent: AgentView }>> {
    return this.http.get<SuccessResponse<{ agent: AgentView }>>(`${this.baseUrl}/agents/me`);
  }

  create(payload: CreateAgentPayload): Observable<SuccessResponse<{ agent: AgentView }>> {
    return this.http.post<SuccessResponse<{ agent: AgentView }>>(`${this.baseUrl}/agents`, payload);
  }

  update(id: string, payload: Partial<CreateAgentPayload>): Observable<SuccessResponse<{ agent: AgentView }>> {
    return this.http.put<SuccessResponse<{ agent: AgentView }>>(`${this.baseUrl}/agents/${id}`, payload);
  }

  updateStatus(id: string, status: AgentStatus): Observable<SuccessResponse<{ agent: AgentView }>> {
    return this.http.put<SuccessResponse<{ agent: AgentView }>>(`${this.baseUrl}/agents/${id}/status`, { status });
  }

  /**
   * ADMIN-only per the current backend (agent.routes.ts restricts this route to
   * the ADMIN role). There is no self-service performance endpoint for the
   * authenticated agent yet, so this cannot be called from the agent's own
   * dashboard with an AGENT-role token.
   */
  getPerformance(id: string): Observable<SuccessResponse<{ performance: AgentPerformanceView }>> {
    return this.http.get<SuccessResponse<{ performance: AgentPerformanceView }>>(
      `${this.baseUrl}/agents/${id}/performance`,
    );
  }
}
