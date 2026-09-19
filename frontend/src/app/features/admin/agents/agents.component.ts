import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AgentService } from '../../../core/services/agent.service';
import { AgentView } from '../../../core/models/agent.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'dh-admin-agents',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    IconComponent,
  ],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss',
})
export class AdminAgentsComponent implements OnInit {
  private readonly agentService = inject(AgentService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly agents = signal<AgentView[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.agentService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.agents.set(response.data.agents),
        error: () => this.error.set('Could not load agents.'),
      });
  }
}
