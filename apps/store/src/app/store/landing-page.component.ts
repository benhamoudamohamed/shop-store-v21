import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Product } from '@youssef-brand/shared/shared-types';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="bg-[#0a0a0a] min-h-screen text-[#f1f5f9] font-serif antialiased overflow-x-hidden selection:bg-[#c5a880]/30 selection:text-[#f5e6d3]">

    <nav class="fixed top-0 left-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/3 px-6 py-4 transition-all duration-300">
      <div class="max-w-400 mx-auto flex items-center justify-between">
        
        <div class="w-16 hidden md:block"></div>

        <a href="#" class="flex flex-col items-center group">
          <svg class="w-8 h-8 text-white group-hover:text-[#c5a880] transition-colors duration-300" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 20 C35 35, 20 30, 10 45 C25 45, 35 55, 50 75 C65 55, 75 45, 90 45 C80 30, 65 35, 50 20 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M25 45 C35 45, 45 35, 50 20 C55 35, 65 45, 75 45" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </a>

        <div class="flex items-center gap-6 text-slate-400">
          <button class="hover:text-white transition-colors duration-200" aria-label="Account Profile">
            <i class="pi pi-user text-lg"></i>
          </button>
          <button class="hover:text-white transition-colors duration-200 relative" aria-label="Shopping Bag">
            <i class="pi pi-shopping-bag text-lg"></i>
            <span class="absolute -top-1.5 -right-1.5 bg-[#c5a880] text-[#0a0a0a] text-[10px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center scale-90">0</span>
          </button>
        </div>

      </div>
    </nav>

    <header class="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 overflow-hidden">
      
      <div class="absolute inset-0 opacity-[0.075] pointer-events-none mix-blend-screen bg-repeat pattern-grid"></div>
      
      <div class="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/40 pointer-events-none"></div>

      <div class="relative z-10 text-center max-w-4xl mx-auto space-y-8 px-4 flex flex-col items-center">
        
        <div class="w-48 h-24 md:w-64 md:h-32 text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          <svg class="w-full h-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 50 C40 20, 70 25, 100 45 C130 25, 160 20, 180 50 C150 75, 120 40, 100 45 C80 40, 50 75, 20 50 Z" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M60 30 C80 10, 100 0, 100 25 C100 0, 120 10, 140 30" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M70 55 L100 25 L130 55" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="space-y-3">
          <h1 class="text-4xl sm:text-6xl md:text-7xl font-light tracking-[0.25em] text-[#fbf9f6] font-serif uppercase">
            YOUSSEF BRAND
          </h1>
          <div class="h-px w-24 bg-linear-to-r from-transparent via-[#c5a880] to-transparent mx-auto mt-4"></div>
        </div>

        <p class="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-[#c5a880] font-medium max-w-md mx-auto">
          Haute Couture & Heritage Craftsmanship
        </p>

        <div class="pt-12">
          <a href="#MainContent" class="inline-flex items-center justify-center w-12 h-12 rounded-full border border-white/10 text-slate-400 hover:text-[#c5a880] hover:border-[#c5a880] transition-all duration-300 animate-bounce">
            <i class="pi pi-chevron-down text-sm"></i>
          </a>
        </div>

      </div>
    </header>

<main id="MainContent" style="
    background-color: #000000;
    color: #ffffff;
    padding: 60px 40px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    box-sizing: border-box;
">
    
    <!-- Section Title Heading -->
    <h2 style="
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 40px;
        letter-spacing: -0.02em;
        text-transform: lowercase;
    ">all in one</h2>

    <!-- Responsive Grid Layout Platform -->
    <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        width: 100%;
        max-width: 1600px;
        margin: 0 auto;
        box-sizing: border-box;
    ">
        
        <!-- Individual Product Card Framework -->
        <div *ngFor="let product of products;" style="
            display: flex;
            flex-direction: column;
            position: relative;
            box-sizing: border-box;
        " class="product-card-hover">
            
            <!-- --- IMAGE CONTAINER STACK --- -->
            <div style="
                position: relative;
                width: 100%;
                padding-top: 125%; /* Fixed aspect ratio window */
                overflow: hidden;
                background-color: #111111;
            ">
                <!-- Active Slide Image Renderer -->
                <span> ID: {{ product.id }} </span>
                <img 
                  [src]="product.images[currentImageIndices[product.id] || 0]?.originalUrl" 
                  [alt]="product.name"
                  style="
                      position: absolute;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      object-fit: cover;
                      transition: opacity 0.3s ease;"
                >

                <!-- --- FLOATING ACCENT STATUS TAGS --- -->
                <span *ngIf="product.id" [ngStyle]="{
                    'background-color': product.isAvailable === true ? 'rgba(30, 30, 30, 0.85)' : '#000000'
                }" style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 500;
                    padding: 4px 12px;
                    border-radius: 20px;
                    letter-spacing: 0.05em;
                    z-index: 5;
                    border: 1px solid rgba(255,255,255,0.1);
                }">
                    {{ product.isAvailable }}
                </span>

                <!-- --- CAROUSEL BUTTON NAVIGATION CONTROLS --- -->
                <!-- Previous Button -->
                <button (click)="prevImage(product.id, $event)" style="
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: transparent;
                    border: none;
                    color: #ffffff;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    opacity: 0.6;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                }" onmouseenter="this.style.opacity='1'; this.style.transform='translateY(-50%) scale(1.1)'" 
                   onmouseleave="this.style.opacity='0.6'; this.style.transform='translateY(-50%) scale(1)'">
                    <i class="pi pi-arrow-left" style="font-size: 0.9rem;"></i>
                </button>

                <!-- Next Button -->
                <button (click)="nextImage(product.id, $event)" style="
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: transparent;
                    border: none;
                    color: #ffffff;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    opacity: 0.6;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                }" onmouseenter="this.style.opacity='1'; this.style.transform='translateY(-50%) scale(1.1)'" 
                   onmouseleave="this.style.opacity='0.6'; this.style.transform='translateY(-50%) scale(1)'">
                    <i class="pi pi-arrow-right" style="font-size: 0.9rem;"></i>
                </button>

                <!-- --- QUICK ADD BAG ACCENT TOGGLE --- -->
                <button (click)="addToCart(product, $event)" style="
                    position: absolute;
                    bottom: 15px;
                    right: 15px;
                    background-color: #000000;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #ffffff;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: background-color 0.2s ease, transform 0.2s ease;
                }" onmouseenter="this.style.backgroundColor='#1a1a1a'; this.style.transform='scale(1.05)'"
                   onmouseleave="this.style.backgroundColor='#000000'; this.style.transform='scale(1)'"
                   aria-label="Add item to shopping bag">
                    <i class="pi pi-cart-plus" style="font-size: 0.95rem;"></i>
                </button>
            </div>

            <!-- --- DESCRIPTION PRODUCT INFO LABELS --- -->
            <div style="padding-top: 15px; box-sizing: border-box;">
                <h3 style="
                    font-size: 14px;
                    font-weight: 500;
                    color: #e2e8f0;
                    margin: 0 0 6px 0;
                    letter-spacing: -0.01em;
                ">{{ product.name }}</h3>
                
                <div style="display: flex; align-items: center; gap: 8px;">
                    <!-- Active Base/Sale Price Field -->
                    <span style="font-size: 13px; font-weight: 600; color: #ffffff;">
                        {{ product.totalTTC | number:'1.3-3' }}
                    </span>
                    <!-- Original Slashed Comparison Price Field -->
                    <span *ngIf="product.totalTTC" style="
                        font-size: 12px;
                        color: #64748b;
                        text-decoration: line-through;
                    ">
                        {{ product.totalTTC | number:'1.3-3' }}
                    </span>
                </div>
            </div>

        </div>

    </div>
</main>

    <footer class="border-t border-white/3 bg-[#070707] py-12 px-6 text-center font-sans text-[11px] tracking-[0.2em] text-slate-600 uppercase">
      <p>&copy; 2026 YOUSSEF BRAND. All rights reserved.</p>
    </footer>

  </div>
 
  `,
  styles: [`
   :host {
      display: block;
      background-color: #0a0a0a;
    }
    html {
      scroll-behavior: smooth;
    }
    
    /* 🕋 Injecting the Infinite Arabesque Geometric Star Lattice via SVG Data URI */
    .pattern-grid {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z M0 0 L60 60 M60 0 L0 60 M30 0 L30 60 M0 30 L60 30' stroke='%23c5a880' stroke-width='0.5' fill='none' stroke-opacity='0.4'/%3E%3Ccircle cx='30' cy='30' r='8' stroke='%23c5a880' stroke-width='0.5' fill='none' stroke-opacity='0.4'/%3E%3C/svg%3E");
      background-size: 80px 80px;
    }
  `]
})
export class LandingPageComponent implements OnInit {

  products: Product[] = [];
  categoryError?: string;
  loadingProducts = true;

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts() {
    this.http
      .get<{ data: Product[]; count: number }>('http://localhost:3000/api/product/all')
      .pipe(
        catchError((error) => {
          this.categoryError = error?.message || 'Unable to load products from backend.';
          this.loadingProducts = false;
          return of({ data: [], count: 0 });
        })
      )
      .subscribe((response) => {
        this.products = response.data;
        this.loadingProducts = false;
      });
  }

  // Tracking engine mapping active index locations for each slider instance
  currentImageIndices: { [productId: string]: number } = {};

  // Next image handler loop logic
  nextImage(productId: string, event: Event): void {
    event.stopPropagation();
    
    const product = this.products.find(p => p.id === productId);
    if (product && product.images && product.images.length > 0) {
      // Standardize index fallback in case it starts as undefined
      const currentIndex = this.currentImageIndices[productId] || 0;
      
      // Cycle cleanly through the actual total count of image rows (e.g., 3)
      this.currentImageIndices[productId] = (currentIndex + 1) % product.images.length;
    }
  }

  // Previous image handler loop logic
  prevImage(productId: string, event: Event): void {
    event.stopPropagation();
    
    const product = this.products.find(p => p.id === productId);
    if (product && product.images && product.images.length > 0) {
      const currentIndex = this.currentImageIndices[productId] || 0;
      
      // Safely wrap backward index movements back to the final image array index slot
      this.currentImageIndices[productId] = (currentIndex - 1 + product.images.length) % product.images.length;
    }
  }
  
  // Cart submission anchor placeholder
  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    console.log(`Dispatched item to global store event loop: ${product.name}`);
  }
}
