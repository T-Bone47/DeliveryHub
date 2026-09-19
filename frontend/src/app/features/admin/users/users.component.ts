import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { UserService } from '../../../core/services/user.service';
import { PublicUser } from '../../../core/models/user.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';

@Component({
  selector: 'dh-admin-users',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly users = signal<PublicUser[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.userService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.users.set(response.data.users),
        error: () => this.error.set('Could not load users.'),
      });
  }
}
