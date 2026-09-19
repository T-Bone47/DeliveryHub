import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from './icon.component';
import { NavItem } from './nav-item.model';
import { ToastContainerComponent } from './toast-container.component';

const CUSTOMER_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/customer/dashboard', icon: 'dashboard' },
  { label: 'Create Delivery', path: '/customer/create-delivery', icon: 'plus' },
  { label: 'My Deliveries', path: '/customer/deliveries', icon: 'package' },
  { label: 'Profile', path: '/customer/profile', icon: 'user' },
];

const AGENT_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/agent/dashboard', icon: 'dashboard' },
  { label: 'Assigned Deliveries', path: '/agent/deliveries', icon: 'package' },
  { label: 'Profile', path: '/agent/profile', icon: 'user' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Agents', path: '/admin/agents', icon: 'truck' },
  { label: 'Deliveries', path: '/admin/deliveries', icon: 'package' },
  { label: 'Services', path: '/admin/services', icon: 'services' },
  { label: 'Locations', path: '/admin/locations', icon: 'location' },
  { label: 'Users', path: '/admin/users', icon: 'users' },
  { label: 'Profile', path: '/admin/profile', icon: 'user' },
];

@Component({
  selector: 'dh-app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ToastContainerComponent],
  template: `
    <div class="shell" [class.sidebar-open]="sidebarOpen()">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">
            <dh-icon name="truck"></dh-icon>
          </div>
          <div>
            <div class="brand-name">DeliveryHub<span class="brand-dot"></span></div>
            <div class="brand-tag">LOGISTICS OPERATIONS</div>
          </div>
        </div>

        <nav class="nav">
          @for (item of navItems(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              class="nav-link"
              (click)="closeSidebar()"
            >
              <dh-icon [name]="item.icon"></dh-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="portal-chip">
            <span class="pulse-beacon"></span>
            <span>Live Dispatch Active</span>
          </div>
          <button type="button" class="nav-link logout" (click)="logout()">
            <dh-icon name="user"></dh-icon>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div class="backdrop" (click)="closeSidebar()"></div>

      <div class="main">
        <header class="topbar">
          <button type="button" class="menu-toggle" (click)="toggleSidebar()" aria-label="Toggle navigation">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <!-- Operational Hub Indicator -->
          <div class="location-picker-pill">
            <dh-icon name="map-pin"></dh-icon>
            <div class="loc-text">
              <span class="loc-label">Active Operations Hub</span>
              <span class="loc-city">Regional Hub &bull; South Central Node</span>
            </div>
          </div>

          <div class="topbar-actions">
            <div class="network-badge">
              <span class="dot-live"></span>
              <span class="net-text">Network 99.9%</span>
            </div>

            <button type="button" class="icon-btn notif-btn" aria-label="Notifications" title="Notifications">
              <dh-icon name="bell"></dh-icon>
              <span class="notif-badge"></span>
            </button>

            <div class="user-menu">
              <div class="avatar" aria-hidden="true">{{ initials() }}</div>
              <div class="user-info">
                <span class="user-name">{{ auth.currentUser()?.fullName }}</span>
                <span class="user-role">{{ auth.currentUser()?.role }}</span>
              </div>
            </div>
          </div>
        </header>
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: var(--sidebar-width) 1fr;
      min-height: 100vh;
      background: var(--color-background);
    }
    .sidebar {
      background: #ffffff;
      display: flex;
      flex-direction: column;
      padding: var(--space-5) var(--space-4);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      border-right: 1px solid var(--color-border);
      z-index: 25;
      box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-2) var(--space-5);
      border-bottom: 1px solid var(--color-border);
      margin-bottom: var(--space-4);
    }
    .brand-mark {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: var(--color-primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-name {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 17px;
      color: var(--color-text);
      letter-spacing: -0.02em;
      display: flex;
      align-items: baseline;
    }
    .brand-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--color-primary);
      margin-left: 2px;
      display: inline-block;
    }
    .brand-tag {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--color-muted);
      margin-top: 1px;
    }
    .nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .nav-link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 9px 14px;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: 13.5px;
      font-weight: 600;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: all 0.15s ease;
    }
    .nav-link:hover {
      background: var(--color-surface-hover, #f8fafc);
      color: var(--color-text);
      text-decoration: none;
    }
    .nav-link.active {
      background: var(--color-primary-soft, #fff7ed);
      color: var(--color-primary, #ea580c);
      font-weight: 700;
      box-shadow: inset 3px 0 0 var(--color-primary);
    }
    .sidebar-footer {
      margin-top: auto;
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .portal-chip {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 5px 10px;
      background: #f0fdf4;
      color: #15803d;
      font-size: 11.5px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      border: 1px solid #bbf7d0;
    }
    .pulse-beacon {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #16a34a;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
      animation: beacon 1.8s infinite;
    }
    @keyframes beacon {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.15); }
    }
    .nav-link.logout {
      color: var(--color-error-text, #b91c1c);
      &:hover {
        background: var(--color-error-soft, #fef2f2);
        color: #991b1b;
      }
    }
    .main { display: flex; flex-direction: column; min-width: 0; }
    .topbar {
      height: var(--topbar-height);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: 0 var(--space-8);
      background: #ffffff;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }
    .menu-toggle {
      display: none;
      background: none;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text);
      cursor: pointer;
      padding: 6px;
      align-items: center;
      justify-content: center;
    }
    .location-picker-pill {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 6px 14px;
      background: #f8fafc;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      color: var(--color-text);
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover {
        background: #fff;
        border-color: var(--color-primary);
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      dh-icon { color: var(--color-primary); }
      .loc-text { display: flex; flex-direction: column; line-height: 1.15; }
      .loc-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--color-muted); }
      .loc-city { font-size: 13px; font-weight: 700; color: var(--color-text); }
    }
    .topbar-actions { display: flex; align-items: center; gap: var(--space-4); margin-left: auto; }
    .network-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #059669;
      background: #ecfdf5;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      border: 1px solid #a7f3d0;
      .dot-live {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10b981;
      }
    }
    .icon-btn.notif-btn {
      position: relative;
      background: #f8fafc;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover { background: #fff; color: var(--color-primary); }
      .notif-badge {
        position: absolute;
        top: 8px;
        right: 9px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff5200;
        box-shadow: 0 0 0 2px #fff;
      }
    }
    .user-menu {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 4px 12px 4px 6px;
      border-radius: var(--radius-full);
      background: #f8fafc;
      border: 1px solid var(--color-border);
    }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--color-primary-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(255, 82, 0, 0.3);
    }
    .user-info { display: flex; flex-direction: column; line-height: 1.2; }
    .user-name { font-size: 13px; font-weight: 700; color: var(--color-text); }
    .user-role {
      font-size: 10px;
      color: var(--color-primary);
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .content { padding: var(--space-6) var(--space-8); flex: 1; }
    .backdrop { display: none; }

    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        width: 270px;
        transform: translateX(-100%);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 30;
        box-shadow: var(--shadow-lg);
      }
      .sidebar-open .sidebar { transform: translateX(0); }
      .backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(17, 24, 39, 0.4);
        backdrop-filter: blur(4px);
        z-index: 20;
      }
      .sidebar-open .backdrop { display: block; }
      .menu-toggle { display: flex; }
      .location-picker-pill { display: none; }
      .network-badge { display: none; }
      .user-info { display: none; }
      .content { padding: var(--space-4); }
    }
  `],
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly sidebarOpen = signal(false);

  readonly navItems = computed<NavItem[]>(() => {
    switch (this.auth.role()) {
      case 'CUSTOMER':
        return CUSTOMER_NAV;
      case 'AGENT':
        return AGENT_NAV;
      case 'ADMIN':
        return ADMIN_NAV;
      default:
        return [];
    }
  });

  readonly initials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    window.location.href = '/login';
  }
}
