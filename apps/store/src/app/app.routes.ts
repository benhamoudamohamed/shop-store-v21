import { Routes } from '@angular/router';
import { LandingPageComponent } from './store/landing-page.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    children: [
      { path: '', redirectTo: 'landing', pathMatch: 'full' },
      { 
        path: 'landing', 
        loadComponent: () => import('./store/landing-page.component').then(m => m.LandingPageComponent) 
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
