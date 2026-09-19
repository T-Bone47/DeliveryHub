import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dh-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages > 1) {
      <nav class="pagination" aria-label="Pagination">
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page <= 1" (click)="pageChange.emit(page - 1)">
          Previous
        </button>
        <span class="page-info">Page {{ page }} of {{ totalPages }} &middot; {{ total }} total</span>
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page >= totalPages" (click)="pageChange.emit(page + 1)">
          Next
        </button>
      </nav>
    }
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      flex-wrap: wrap;
    }
    .page-info { font-size: 13px; color: var(--color-text-secondary); }
  `],
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() total = 0;
  @Output() pageChange = new EventEmitter<number>();
}
