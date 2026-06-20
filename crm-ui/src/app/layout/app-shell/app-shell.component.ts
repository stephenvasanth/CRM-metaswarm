import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      background-color: var(--color-background);
    }
  `]
})
export class AppShellComponent {}
