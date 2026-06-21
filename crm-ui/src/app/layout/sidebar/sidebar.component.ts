import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  template: `
    <nav class="sidebar" aria-label="Main navigation">
      <!-- Logo / App name -->
      <div class="sidebar__logo">
        <span class="sidebar__logo-icon" aria-hidden="true">◢</span>
        <span class="sidebar__logo-text">CRM</span>
      </div>

      <!-- Main navigation -->
      <ul class="sidebar__nav" role="list">
        @for (item of mainNavItems; track item.route) {
          <li>
            <a
              [routerLink]="item.route"
              routerLinkActive="sidebar__nav-link--active"
              class="sidebar__nav-link"
              [attr.aria-label]="item.label"
            >
              <span class="sidebar__nav-icon" aria-hidden="true">{{ item.icon }}</span>
              <span class="sidebar__nav-label">{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>

      <!-- Admin section (only shown for ADMIN role) -->
      @if (authService.isAdmin$ | async) {
        <div class="sidebar__section">
          <p class="sidebar__section-label">Admin</p>
          <ul class="sidebar__nav" role="list">
            @for (item of adminNavItems; track item.route) {
              <li>
                <a
                  [routerLink]="item.route"
                  routerLinkActive="sidebar__nav-link--active"
                  class="sidebar__nav-link"
                  [attr.aria-label]="item.label"
                >
                  <span class="sidebar__nav-icon" aria-hidden="true">{{ item.icon }}</span>
                  <span class="sidebar__nav-label">{{ item.label }}</span>
                </a>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Bottom: Profile & Logout -->
      <div class="sidebar__bottom">
        <a
          routerLink="/profile"
          routerLinkActive="sidebar__nav-link--active"
          class="sidebar__nav-link"
          aria-label="Profile"
        >
          <span class="sidebar__nav-icon" aria-hidden="true">👤</span>
          <span class="sidebar__nav-label">Profile</span>
        </a>
        <button
          class="sidebar__logout"
          (click)="authService.logout()"
          aria-label="Sign out"
        >
          <span class="sidebar__nav-icon" aria-hidden="true">🚪</span>
          <span class="sidebar__nav-label">Sign Out</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      min-width: 240px;
      height: 100vh;
      background-color: var(--color-sidebar-bg);
      color: var(--color-sidebar-text);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .sidebar__logo {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-6) var(--space-4);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar__logo-icon {
      font-size: var(--font-size-xl);
      color: var(--color-primary);
    }

    .sidebar__logo-text {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      color: var(--color-surface);
      letter-spacing: 0.05em;
    }

    .sidebar__nav {
      list-style: none;
      padding: var(--space-2) 0;
    }

    .sidebar__nav-link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      color: var(--color-sidebar-text);
      text-decoration: none;
      border-radius: var(--radius-md);
      margin: 0 var(--space-2);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      transition: background-color 150ms ease, color 150ms ease;
    }

    .sidebar__nav-link:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: var(--color-surface);
      text-decoration: none;
    }

    .sidebar__nav-link--active {
      background-color: var(--color-sidebar-active);
      color: var(--color-surface);
    }

    .sidebar__nav-link--active:hover {
      background-color: var(--color-primary-dark);
    }

    .sidebar__nav-icon {
      width: var(--space-5);
      text-align: center;
      font-size: var(--font-size-base);
    }

    .sidebar__section {
      margin-top: var(--space-4);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: var(--space-4);
    }

    .sidebar__section-label {
      padding: 0 var(--space-6);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(199, 210, 254, 0.6);
      margin-bottom: var(--space-2);
    }

    .sidebar__bottom {
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: var(--space-4) 0;
    }

    .sidebar__logout {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      padding: var(--space-3) var(--space-4);
      color: var(--color-sidebar-text);
      background: none;
      border: none;
      border-radius: var(--radius-md);
      margin: 0 var(--space-2);
      width: calc(100% - var(--space-4));
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      text-align: left;
      transition: background-color 150ms ease, color 150ms ease;
    }

    .sidebar__logout:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: var(--color-surface);
    }
  `]
})
export class SidebarComponent {
  readonly authService = inject(AuthService);

  readonly mainNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '▤' },
    { label: 'Contacts', route: '/contacts', icon: '👥' },
    { label: 'Deals', route: '/deals', icon: '📅' },
    { label: 'Activities', route: '/activities', icon: '🕑' },
    { label: 'Tasks', route: '/tasks', icon: '✅' }
  ];

  readonly adminNavItems: NavItem[] = [
    { label: 'Users', route: '/admin/users', icon: '🕵' },
    { label: 'Tags', route: '/admin/tags', icon: '🏷' }
  ];
}
