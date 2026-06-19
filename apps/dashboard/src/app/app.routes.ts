import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
// import { adminAuthGuard } from './core/guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    // canActivate: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'metrics', pathMatch: 'full' },
      { 
        path: 'metrics', 
        loadComponent: () => import('./pages/metrics/metrics.component').then(m => m.MetricsComponent) 
      },
      { 
        path: 'category', 
        loadComponent: () => import('./pages/category/category.component').then(m => m.CategoryComponent) 
      },
    //   { 
    //     path: 'product', 
    //     loadComponent: () => import('./pages/product/product.component').then(m => m.ProductComponent) 
    //   }
    ]
  },
  // 2. Public Auth Views (Outside of Sakai Sidebar layout wrapper)
//   {
//     path: 'login',
//     loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent)
//   }
];