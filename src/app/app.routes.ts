import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'preparation' },
  {
    path: 'preparation',
    loadComponent: () => import('./pages/preparation').then((m) => m.PreparationPage),
  },
  { path: 'products', loadComponent: () => import('./pages/products').then((m) => m.ProductsPage) },
  {
    path: 'products/:id',
    loadComponent: () => import('./pages/product-editor').then((m) => m.ProductEditorPage),
  },
  { path: 'routes', loadComponent: () => import('./pages/routes-page').then((m) => m.RoutesPage) },
  {
    path: 'routes/:id',
    loadComponent: () => import('./pages/routes-page').then((m) => m.RoutesPage),
  },
  { path: 'families', loadComponent: () => import('./pages/families').then((m) => m.FamiliesPage) },
  {
    path: 'families/:id',
    loadComponent: () => import('./pages/families').then((m) => m.FamiliesPage),
  },
  {
    path: 'assignments/:id',
    loadComponent: () => import('./pages/assignment').then((m) => m.AssignmentPage),
  },
  {
    path: 'connection',
    loadComponent: () => import('./pages/connection').then((m) => m.ConnectionPage),
  },
  { path: '**', redirectTo: 'preparation' },
];
