import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'connection' },
  {
    path: 'connection',
    loadComponent: () => import('./pages/connection').then((m) => m.ConnectionPage),
  },
  { path: '**', redirectTo: 'connection' },
];
