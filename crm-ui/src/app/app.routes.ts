import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          )
      },
      {
        path: 'contacts',
        loadComponent: () =>
          import('./features/contacts/contacts-list/contacts-list.component').then(
            (m) => m.ContactsListComponent
          )
      },
      {
        path: 'contacts/new',
        loadComponent: () =>
          import('./features/contacts/contact-form/contact-form.component').then(
            (m) => m.ContactFormComponent
          )
      },
      {
        path: 'contacts/:id/edit',
        loadComponent: () =>
          import('./features/contacts/contact-form/contact-form.component').then(
            (m) => m.ContactFormComponent
          )
      },
      {
        path: 'contacts/:id',
        loadComponent: () =>
          import('./features/contacts/contact-detail/contact-detail.component').then(
            (m) => m.ContactDetailComponent
          )
      },
      {
        path: 'deals',
        loadComponent: () =>
          import('./features/deals/deals-board/deals-board.component').then(
            (m) => m.DealsBoardComponent
          )
      },
      {
        path: 'activities',
        loadComponent: () =>
          import('./features/activities/activities-feed/activities-feed.component').then(
            (m) => m.ActivitiesFeedComponent
          )
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/tasks-list/tasks-list.component').then(
            (m) => m.TasksListComponent
          )
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./features/admin/users/users-list/users-list.component').then(
            (m) => m.UsersListComponent
          ),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/tags',
        loadComponent: () =>
          import('./features/admin/tags/tags.component').then(
            (m) => m.TagsComponent
          ),
        canActivate: [adminGuard]
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent
          )
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
