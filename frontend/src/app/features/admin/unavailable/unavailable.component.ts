import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmptyStateComponent } from '../../../shared/components/empty-state.component';

/**
 * Generic placeholder for admin nav destinations (Bookings, Deliveries,
 * Assignments, Rewards & Penalties, History as standalone views) whose data
 * only exists nested inside a package's detail response today — there is no
 * dedicated list endpoint in the current backend. Rather than fabricate a
 * list, this screen states that plainly and points to where the data can
 * currently be found.
 */
@Component({
  selector: 'dh-admin-unavailable',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ title }}</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <dh-empty-state
      title="Not available as a standalone list yet"
      [description]="description"
    ></dh-empty-state>
  `,
})
export class AdminUnavailableComponent {
  @Input() title = 'Not available yet';
  @Input() subtitle = '';
  @Input() description =
    'The current backend does not expose a dedicated listing endpoint for this yet. This data exists nested inside each package\'s detail view, reachable from the Packages screen.';
}
