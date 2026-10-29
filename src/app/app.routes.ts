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
  {
    path: 'connection',
    loadComponent: () => import('./pages/connection').then((m) => m.ConnectionPage),
  },
  { path: '**', redirectTo: 'preparation' },
];
