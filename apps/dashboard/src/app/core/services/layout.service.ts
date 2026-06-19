import { Injectable, signal} from '@angular/core';

interface LayoutConfig {
  ripple: boolean;
  inputStyle: 'outlined' | 'filled';
  menuMode: 'static' | 'overlay';
  colorScheme: 'light' | 'dark';
  theme: string;
}

interface LayoutState {
  staticMenuDesktopInactive: boolean;
  overlayMenuActive: boolean;
  profileSidebarActive: boolean;
  configSidebarActive: boolean;
  staticMenuMobileActive: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
   config = signal<LayoutConfig>({
    ripple: true,
    inputStyle: 'outlined',
    menuMode: 'static',
    colorScheme: 'light',
    theme: 'aura-light-indigo',
  });

  state = signal<LayoutState>({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarActive: false,
    configSidebarActive: false,
    staticMenuMobileActive: false,
  });

  toggleMenu() {
    const isDesktop = window.innerWidth > 991;
    if (isDesktop) {
      if (this.config().menuMode === 'overlay') {
        this.state.update((s) => ({ ...s, overlayMenuActive: !s.overlayMenuActive }));
      } else {
        this.state.update((s) => ({ ...s, staticMenuDesktopInactive: !s.staticMenuDesktopInactive }));
      }
    } else {
      this.state.update((s) => ({ ...s, staticMenuMobileActive: !s.staticMenuMobileActive }));
    }
  }

  blockBodyScroll(): void {
    if (document.body.classList) {
      document.body.classList.add('blocked-scroll');
    } else {
      document.body.className += ' blocked-scroll';
    }
  }

  unblockBodyScroll(): void {
    if (document.body.classList) {
      document.body.classList.remove('blocked-scroll');
    } else {
      document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  }
}