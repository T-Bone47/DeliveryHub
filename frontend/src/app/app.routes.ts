import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const appRoutes: Routes = [
  // ---- Portal Landing & Access Selection ----
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/portal-select/portal-select.component').then(
        (m) => m.PortalSelectComponent,
      ),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/portal-select/portal-select.component').then(
        (m) => m.PortalSelectComponent,
      ),
  },

  // ---- Dedicated Role Logins & Registration ----
  {
    path: 'customer/login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/customer-login/customer-login.component').then(
        (m) => m.CustomerLoginComponent,
      ),
  },
  {
    path: 'customer/register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/customer-register/customer-register.component').then(
        (m) => m.CustomerRegisterComponent,
      ),
  },
  {
    path: 'register',
    pathMatch: 'full',
    redirectTo: 'customer/register',
  },
  {
    path: 'agent/login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/agent-login/agent-login.component').then(
        (m) => m.AgentLoginComponent,
      ),
  },
  {
    path: 'admin/login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/admin-login/admin-login.component').then(
        (m) => m.AdminLoginComponent,
      ),
  },

  // ---- 403 Access Restricted Screen ----
  {
    path: 'access-restricted',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/access-restricted/access-restricted.component').then(
        (m) => m.AccessRestrictedComponent,
      ),
  },

  // ---- Authenticated App Shell & Role Portals ----
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/app-shell.component').then(
        (m) => m.AppShellComponent,
      ),
    children: [
      // ---- Customer Portal ----
      {
        path: 'customer',
        canActivate: [roleGuard(['CUSTOMER'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/customer/dashboard/dashboard.component').then(
                (m) => m.CustomerDashboardComponent,
              ),
          },
          {
            path: 'create-delivery',
            loadComponent: () =>
              import(
                './features/customer/create-delivery/create-delivery.component'
              ).then((m) => m.CreateDeliveryComponent),
          },
          {
            path: 'deliveries',
            loadComponent: () =>
              import(
                './features/customer/deliveries-list/deliveries-list.component'
              ).then((m) => m.DeliveriesListComponent),
          },
          {
            path: 'deliveries/:id',
            loadComponent: () =>
              import(
                './features/customer/delivery-detail/delivery-detail.component'
              ).then((m) => m.DeliveryDetailComponent),
          },
          {
            path: 'history',
            loadComponent: () =>
              import(
                './features/customer/deliveries-list/deliveries-list.component'
              ).then((m) => m.DeliveriesListComponent),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./shared/components/profile-view.component').then(
                (m) => m.ProfileViewComponent,
              ),
          },
        ],
      },

      // ---- Agent Portal ----
      {
        path: 'agent',
        canActivate: [roleGuard(['AGENT'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/agent/dashboard/dashboard.component').then(
                (m) => m.AgentDashboardComponent,
              ),
          },
          {
            path: 'deliveries',
            loadComponent: () =>
              import(
                './features/agent/deliveries/agent-deliveries.component'
              ).then((m) => m.AgentDeliveriesComponent),
          },
          {
            path: 'deliveries/:id',
            loadComponent: () =>
              import(
                './features/customer/delivery-detail/delivery-detail.component'
              ).then((m) => m.DeliveryDetailComponent),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./shared/components/profile-view.component').then(
                (m) => m.ProfileViewComponent,
              ),
          },
        ],
      },

      // ---- Admin Portal ----
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMIN'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/admin/dashboard/dashboard.component').then(
                (m) => m.AdminDashboardComponent,
              ),
          },
          {
            path: 'agents',
            loadComponent: () =>
              import('./features/admin/agents/agents.component').then(
                (m) => m.AdminAgentsComponent,
              ),
          },
          {
            path: 'agents/new',
            loadComponent: () =>
              import(
                './features/admin/agent-detail/agent-detail.component'
              ).then((m) => m.AdminAgentDetailComponent),
          },
          {
            path: 'agents/:id',
            loadComponent: () =>
              import(
                './features/admin/agent-detail/agent-detail.component'
              ).then((m) => m.AdminAgentDetailComponent),
          },
          {
            path: 'deliveries',
            loadComponent: () =>
              import('./features/admin/packages/packages.component').then(
                (m) => m.AdminPackagesComponent,
              ),
          },
          {
            path: 'deliveries/:id',
            loadComponent: () =>
              import(
                './features/customer/delivery-detail/delivery-detail.component'
              ).then((m) => m.DeliveryDetailComponent),
          },
          {
            path: 'packages',
            pathMatch: 'full',
            redirectTo: 'deliveries',
          },
          {
            path: 'packages/:id',
            loadComponent: () =>
              import(
                './features/customer/delivery-detail/delivery-detail.component'
              ).then((m) => m.DeliveryDetailComponent),
          },
          {
            path: 'services',
            loadComponent: () =>
              import('./features/admin/services/services.component').then(
                (m) => m.AdminServicesComponent,
              ),
          },
          {
            path: 'locations',
            loadComponent: () =>
              import('./features/admin/locations/locations.component').then(
                (m) => m.AdminLocationsComponent,
              ),
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./features/admin/users/users.component').then(
                (m) => m.AdminUsersComponent,
              ),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./shared/components/profile-view.component').then(
                (m) => m.ProfileViewComponent,
              ),
          },
        ],
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
