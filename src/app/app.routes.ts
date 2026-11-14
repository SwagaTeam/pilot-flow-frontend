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
    path: 'admission',
    data: { kind: 'admission' },
    loadComponent: () => import('./pages/evaluation').then((m) => m.EvaluationPage),
  },
  {
    path: 'comparison',
    data: { kind: 'comparison' },
    loadComponent: () => import('./pages/evaluation').then((m) => m.EvaluationPage),
  },
  {
    path: 'validation',
    data: { kind: 'validation' },
    loadComponent: () => import('./pages/evaluation').then((m) => m.EvaluationPage),
  },
  {
    path: 'metrics/:id',
    loadComponent: () => import('./pages/metrics').then((m) => m.MetricsPage),
  },
  {
    path: 'selection',
    loadComponent: () => import('./pages/selection').then((m) => m.SelectionPage),
  },
  {
    path: 'documents',
    loadComponent: () => import('./pages/documents').then((m) => m.DocumentsPage),
  },
  { path: 'protocol', loadComponent: () => import('./pages/protocol').then((m) => m.ProtocolPage) },
  { path: 'matrix/:kind', loadComponent: () => import('./pages/matrix').then((m) => m.MatrixPage) },
  {
    path: 'connection',
    loadComponent: () => import('./pages/connection').then((m) => m.ConnectionPage),
  },
  { path: '**', redirectTo: 'preparation' },
];
