import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutService } from '../core/services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout-sidebar bg-white border-r border-slate-200 w-64 fixed top-16 bottom-0 z-40 p-4 overflow-y-auto transition-transform duration-200">
      <div class="menu-container">
        <div class="sidebar-header flex justify-between items-center p-1 border-b border-slate-700/50 mb-1">
          <span class="text-sm font-bold tracking-wider text-slate-400 uppercase"></span>
          <button class="close-button p-link layout-topbar-button text-slate-600 hover:text-slate-900 text-xl transition-colors duration-200" 
              (click)="layoutService.state.update(prev => ({ ...prev, staticMenuMobileActive: false, overlayMenuActive: false }))"
              aria-label="Close menu">
              <i class="pi pi-times"></i>
          </button>
        </div>

        <ul class="layout-menu mb-6 space-y-1">
          <li>
            <a routerLink="/metrics" routerLinkActive="text-indigo-600 font-semibold bg-indigo-50" class="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
              <i class="pi pi-fw pi-home text-slate-400"></i>
              <span>Dashboard Metrics</span>
            </a>
          </li>
        </ul>

        <div class="layout-menuitem-root-text text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono">Management</div>
        <ul class="layout-menu space-y-1">
          <li>
            <a routerLink="/category" routerLinkActive="text-indigo-600 font-semibold bg-indigo-50" class="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
              <i class="pi pi-fw pi-tags text-slate-400"></i>
              <span>Categories</span>
            </a>
          </li>
          <li>
            <a routerLink="/product" routerLinkActive="text-indigo-600 font-semibold bg-indigo-50" class="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
              <i class="pi pi-fw pi-box text-slate-400"></i>
              <span>Products Catalog</span>
            </a>
          </li>
          <li>
            <a routerLink="/coupon" routerLinkActive="text-indigo-600 font-semibold bg-indigo-50" class="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
              <i class="pi pi-fw pi-ticket text-slate-400"></i>
              <span>Coupons & Promos</span>
            </a>
          </li>
          <li>
            <a routerLink="/purchase" routerLinkActive="text-indigo-600 font-semibold bg-indigo-50" class="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
              <i class="pi pi-fw pi-shopping-cart text-slate-400"></i>
              <span>Orders & Purchases</span>
            </a>
          </li>
          <li>
            <a routerLink="/moderator" routerLinkActive="text-indigo-600 font-semibold bg-indigo-50" class="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
              <i class="pi pi-fw pi-users text-slate-400"></i>
              <span>Staff Moderators</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  `
})
export class AppSidebarComponent {
  constructor(public layoutService: LayoutService) {}

  // ✅ Add this method to handle the menu toggle mechanics cleanly
  toggleMenu(): void {
    const config = this.layoutService.config();
    
    if (config.menuMode === 'overlay') {
        this.layoutService.state.update((prev) => ({
            ...prev,
            overlayMenuActive: !prev.overlayMenuActive
        }));
    } else if (window.innerWidth < 992) {
        this.layoutService.state.update((prev) => ({
            ...prev,
            staticMenuMobileActive: !prev.staticMenuMobileActive
        }));
    } else {
        this.layoutService.state.update((prev) => ({
            ...prev,
            staticMenuDesktopInactive: !prev.staticMenuDesktopInactive
        }));
    }
  }
}