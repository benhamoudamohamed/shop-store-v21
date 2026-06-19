import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-400 mx-auto p-1">
    <div class="bg-[#1f293d] border border-[#334155]/60 rounded-xl p-5 flex flex-col justify-between shadow-md transition-all duration-200 hover:border-slate-600/80">
        <div class="flex justify-between items-start mb-3">
            <div>
                <span class="block text-sm font-semibold tracking-wide text-slate-400">Orders</span>
                <span class="block text-3xl font-bold text-white mt-2">152</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <i class="pi pi-shopping-cart text-blue-400 text-lg"></i>
            </div>
        </div>
        <div class="text-sm font-medium">
            <span class="text-[#34d399] font-bold">24 new </span>
            <span class="text-slate-400">since last visit</span>
        </div>
    </div>

    <div class="bg-[#1f293d] border border-[#334155]/60 rounded-xl p-5 flex flex-col justify-between shadow-md transition-all duration-200 hover:border-slate-600/80">
        <div class="flex justify-between items-start mb-3">
            <div>
                <span class="block text-sm font-semibold tracking-wide text-slate-400">Revenue</span>
                <span class="block text-3xl font-bold text-white mt-2">$2.100</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <i class="pi pi-dollar text-orange-400 text-lg"></i>
            </div>
        </div>
        <div class="text-sm font-medium">
            <span class="text-[#34d399] font-bold">%52+ </span>
            <span class="text-slate-400">since last week</span>
        </div>
    </div>

    <div class="bg-[#1f293d] border border-[#334155]/60 rounded-xl p-5 flex flex-col justify-between shadow-md transition-all duration-200 hover:border-slate-600/80">
        <div class="flex justify-between items-start mb-3">
            <div>
                <span class="block text-sm font-semibold tracking-wide text-slate-400">Customers</span>
                <span class="block text-3xl font-bold text-white mt-2">28441</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <i class="pi pi-users text-cyan-400 text-lg"></i>
            </div>
        </div>
        <div class="text-sm font-medium">
            <span class="text-[#34d399] font-bold">520 </span>
            <span class="text-slate-400">newly registered</span>
        </div>
    </div>

    <div class="bg-[#1f293d] border border-[#334155]/60 rounded-xl p-5 flex flex-col justify-between shadow-md transition-all duration-200 hover:border-slate-600/80">
        <div class="flex justify-between items-start mb-3">
            <div>
                <span class="block text-sm font-semibold tracking-wide text-slate-400">Comments</span>
                <span class="block text-3xl font-bold text-white mt-2">152 Unread</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <i class="pi pi-comment text-purple-400 text-lg"></i>
            </div>
        </div>
        <div class="text-sm font-medium">
            <span class="text-[#34d399] font-bold">85 </span>
            <span class="text-slate-400">responded</span>
        </div>
    </div>
  </div>
  `,
  styles: [`
    
  `]
})
export class MetricsComponent implements OnInit {
  ngOnInit() {
    console.log('MetricsComponent initialized');
  }
}