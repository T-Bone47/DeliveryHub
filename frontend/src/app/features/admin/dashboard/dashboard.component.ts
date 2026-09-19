import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize, retry } from 'rxjs';

import { PackageService } from '../../../core/services/package.service';
import { AgentService } from '../../../core/services/agent.service';
import { UserService } from '../../../core/services/user.service';
import { StatCardComponent } from '../../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { IconComponent } from '../../../shared/components/icon.component';
import { PackageView } from '../../../core/models/package.model';

@Component({
  selector: 'dh-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCardComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly packageService = inject(PackageService);
  private readonly agentService = inject(AgentService);
  private readonly userService = inject(UserService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly totalUsers = signal(0);
  readonly totalAgents = signal(0);
  readonly agentsAvailable = signal(0);
  readonly totalPackages = signal(0);
  readonly pendingPackages = signal(0);
  readonly deliveredCount = signal(0);
  readonly inTransitCount = signal(0);
  readonly recentPackages = signal<PackageView[]>([]);
  readonly failedPackages = signal<PackageView[]>([]);

  readonly deliveryDistribution = computed(() => {
    const total = this.totalPackages() || 1;
    const delivered = this.deliveredCount();
    const inTransit = this.inTransitCount();
    const pending = this.pendingPackages();
    const failed = this.failedPackages().length;

    return {
      delivered,
      inTransit,
      pending,
      failed,
      deliveredPct: Math.round((delivered / total) * 100),
      inTransitPct: Math.round((inTransit / total) * 100),
      pendingPct: Math.round((pending / total) * 100),
      failedPct: Math.round((failed / total) * 100),
    };
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      users: this.userService.list(),
      agents: this.agentService.list(),
      packages: this.packageService.listAll({ limit: 100 }),
    })
      .pipe(
        retry({ count: 2, delay: 500 }),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: ({ users, agents, packages }) => {
          const pkgs = packages.data?.packages ?? [];
          const userList = users.data?.users ?? [];
          const agentList = agents.data?.agents ?? [];
          this.totalUsers.set(userList.length);
          this.totalAgents.set(agentList.length);
          this.agentsAvailable.set(agentList.filter((a) => a.status === 'AVAILABLE').length);
          this.totalPackages.set(packages.data?.pagination?.total ?? pkgs.length);
          this.pendingPackages.set(pkgs.filter((p) => p.status === 'PENDING').length);
          this.deliveredCount.set(pkgs.filter((p) => p.status === 'DELIVERED').length);
          this.inTransitCount.set(
            pkgs.filter((p) => ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP', 'AGENT_ASSIGNED'].includes(p.status)).length,
          );
          this.recentPackages.set(pkgs.slice(0, 6));
          this.failedPackages.set(pkgs.filter((p) => p.status === 'FAILED'));
        },
        error: (err) => {
          console.error('Admin dashboard load error:', err);
          this.error.set('Could not load dashboard data.');
        },
      });
  }
}
