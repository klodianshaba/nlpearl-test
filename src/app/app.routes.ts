import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/test/test.component').then(m => m.TestComponent),
  },
];
