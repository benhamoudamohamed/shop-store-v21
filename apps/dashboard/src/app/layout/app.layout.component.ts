import { Component, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AppTopbarComponent } from './app.topbar.component';
import { AppSidebarComponent } from './app.sidebar.component';
import { LayoutService } from '../core/services/layout.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AppTopbarComponent, AppSidebarComponent],
  template: `
    <div class="layout-wrapper" [ngClass]="containerClass">
        <app-topbar></app-topbar>
        
        <div class="layout-sidebar">
            <app-sidebar></app-sidebar>
        </div>
        
        <div class="layout-main-container">
            <div class="layout-main flex-1 p-6 md:p-8 max-w-400 mx-auto w-full">
                <router-outlet></router-outlet>
            </div>
        </div>
        
        <div 
            class="layout-mask"
            role="button"
            tabindex="0"
            (click)="hideMenu()" 
            (keydown.enter)="hideMenu()"
            (keydown.space)="$event.preventDefault(); hideMenu()"
            aria-label="Close navigation menu"
        ></div>
    </div>
  `
})
export class AppLayoutComponent {

  constructor(public layoutService: LayoutService, public renderer: Renderer2, public router: Router) {}
    hideMenu(): void {
        this.layoutService.state.update((prev) => ({
            ...prev,
            menuHoverActive: false,
            staticMenuMobileActive: false,
            overlayMenuActive: false
        }));
    }

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

  get containerClass() {
    const state = this.layoutService.state();
    const config = this.layoutService.config();

    return {
        'layout-theme-light': config.colorScheme === 'light',
        'layout-theme-dark': config.colorScheme === 'dark',
        'layout-overlay': config.menuMode === 'overlay',
        'layout-static': config.menuMode === 'static',
        'layout-static-inactive': state.staticMenuDesktopInactive && config.menuMode === 'static',
        'layout-overlay-active': state.overlayMenuActive,
        'layout-mobile-active': state.staticMenuMobileActive
    };
  }
}