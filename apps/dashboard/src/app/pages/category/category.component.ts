import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Category } from '@youssef-brand/shared/shared-types';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule],
  template: `
    <div class="card bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      <!-- Table Header Action Bar -->
      <div class="flex flex-column md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">System Categories</h1>
          <p class="text-slate-500 text-sm">Manage product groups and store taxonomies</p>
        </div>
        <button pButton label="New Category" icon="pi pi-plus" class="p-button-success rounded-xl" aria-label="Add new category"></button>
      </div>

      <!-- PrimeNG Data Table -->
      <p-table 
        [value]="categories" 
        [loading]="loadingCategories"
        responsiveLayout="scroll"
        [rows]="5"
        [paginator]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} categories"
        [showCurrentPageReport]="true"
        styleClass="p-datatable-striped"
      >
        <ng-template pTemplate="header">
          <tr class="text-slate-700 bg-slate-50 border-b border-slate-200">
            <th class="p-4 text-left font-semibold text-sm">ID</th>
            <th class="p-4 text-left font-semibold text-sm">Image</th>
            <th class="p-4 text-left font-semibold text-sm">Category Name</th>
            <th class="p-4 text-left font-semibold text-sm">Description</th>
            <th class="p-4 text-left font-semibold text-sm">Total Products</th>
            <th class="p-4 text-center font-semibold text-sm">Actions</th>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="body" let-category>
          <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-4 text-sm font-mono text-slate-500">#{{ category.id }}</td>
            <td class="p-4 text-sm font-mono text-slate-500">  
              <img [src]="category.image.originalUrl" [alt]="category.name">
            </td>
            <td class="p-4 text-sm font-bold text-slate-900">{{ category.name }}</td>
            <td class="p-4 text-sm text-slate-600 max-w-xs truncate">{{ category.description }}</td>
            <td class="p-4 text-sm text-slate-700">
              <span class="bg-slate-100 text-slate-800 font-semibold px-2.5 py-1 rounded-md text-xs">
                {{ category.products.length }} items
              </span>
            </td>

            <td class="p-4 text-center">
              <div class="flex justify-center gap-2">
                <button pButton icon="pi pi-pencil" aria-label="Edit category" class="p-button-text p-button-sm p-button-secondary"></button>
                <button pButton icon="pi pi-trash" aria-label="Delete category" class="p-button-text p-button-sm p-button-danger"></button>
              </div>
            </td>
          </tr>
        </ng-template>

        <!-- Empty State Handling -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="text-center p-8 text-slate-400 text-sm">
              No categories found in system inventory.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    /* Blending PrimeNG paginator controls into your dashboard aesthetics */
    ::v-deep .p-paginator {
      background: transparent !important;
      border: none !important;
      padding-top: 1.5rem;
    }
    ::v-deep .p-paginator .p-paginator-page.p-highlight {
      background: #ef4444 !important; /* Custom color target option match */
      color: white !important;
      border-radius: 8px;
    }
  `]
})
export class CategoryComponent implements OnInit {
  categories: Category[] = [];
  categoryError?: string;
  loadingCategories = true;

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.loadCategories();
  }

   private loadCategories() {
    this.http
      .get<{ data: Category[]; count: number }>('http://localhost:3000/api/category/all')
      .pipe(
        catchError((error) => {
          this.categoryError = error?.message || 'Unable to load categories from backend.';
          this.loadingCategories = false;
          return of({ data: [], count: 0 });
        })
      )
      .subscribe((response) => {
        this.categories = response.data;
        this.loadingCategories = false;
      });
  }
}