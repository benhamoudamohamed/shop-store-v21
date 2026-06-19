import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutService } from '../core/services/layout.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout-topbar flex items-center justify-between bg-white border-b border-slate-200 px-6 h-16 fixed top-0 left-0 right-0 z-50 shadow-xs">
        <button class="p-link layout-menu-button layout-topbar-button text-slate-600 hover:text-slate-900 text-xl" (click)="layoutService.toggleMenu()">
            <i class="pi pi-bars"></i>
        </button>  
    
        <a class="layout-topbar-logo flex items-center gap-2 font-black text-xl text-slate-900" routerLink="/">
            <span class="text-indigo-600 font-extrabold text-2xl font-mono">YB</span>
            <span>YOUSSEF BRAND</span>
        </a>

        <div class="layout-topbar-menu flex items-center gap-4">
            <button class="p-link layout-topbar-button text-slate-600 hover:text-slate-900 text-lg">
            <i class="pi pi-calendar"></i>
            </button>
            <button class="p-link layout-topbar-button text-slate-600 hover:text-slate-900 text-lg" routerLink="/profile">
                <i class="pi pi-user"></i>
            </button>
        </div>
    </div>
  `
})
export class AppTopbarComponent {
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