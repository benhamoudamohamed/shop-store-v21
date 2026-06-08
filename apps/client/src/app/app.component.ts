import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { FormsModule } from '@angular/forms';

interface Category {
  id: string;
  name: string;
  description: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, Button, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RippleModule, HttpClientModule],

  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'client';
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
