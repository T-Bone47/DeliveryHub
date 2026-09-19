import { InjectionToken } from '@angular/core';

/**
 * Base URL for the Delivery Agent System backend API.
 * Overridden per-environment by providing a different value for API_BASE_URL.
 * Defaults to a relative '/api' path so the dev server proxy (proxy.conf.json)
 * or a same-origin production deployment both work without code changes.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
