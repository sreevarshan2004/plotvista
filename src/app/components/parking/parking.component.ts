import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-parking',
  standalone: true,
  template: `
    <div class="min-h-screen flex flex-col relative overflow-hidden"
         style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">

      <!-- Background grid -->
      <div class="absolute inset-0 opacity-[0.03]"
           style="background-image: linear-gradient(#fbbf24 1px, transparent 1px), linear-gradient(90deg, #fbbf24 1px, transparent 1px); background-size: 40px 40px;"></div>

      <!-- Glow orb -->
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-3xl pointer-events-none"
           style="background: radial-gradient(circle, #f59e0b, transparent);"></div>

      <!-- Header -->
      <header class="relative z-10 px-8 py-5 flex items-center justify-between"
              style="border-bottom: 1px solid rgba(245,158,11,0.1);">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               style="background: linear-gradient(135deg, #92400e, #f59e0b); border: 1px solid rgba(245,158,11,0.3);">
            <span class="text-lg">🅿️</span>
          </div>
          <div>
            <h1 class="text-sm font-black tracking-widest uppercase" style="color: #f0f9ff;">
              MACS <span style="color: #fbbf24;">PARKING</span>
            </h1>
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: #f59e0b;"></span>
              <span class="text-[8px] uppercase tracking-[0.3em] font-bold" style="color: #fbbf24;">Slot Management System</span>
            </div>
          </div>
        </div>
        <button (click)="back()"
                class="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:-translate-y-0.5"
                style="background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.2); color: #38bdf8;">
          ← Dashboard
        </button>
      </header>

      <!-- Coming Soon Content -->
      <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">

        <div class="animate-fade-up">
          <!-- Icon -->
          <div class="w-28 h-28 mx-auto mb-8 rounded-3xl flex items-center justify-center shadow-2xl"
               style="background: linear-gradient(135deg, #92400e, #f59e0b); border: 1px solid rgba(245,158,11,0.4); box-shadow: 0 20px 60px rgba(245,158,11,0.2);">
            <span class="text-6xl">🅿️</span>
          </div>

          <h2 class="text-4xl font-black tracking-tight mb-3" style="color: #f0f9ff;">Coming Soon</h2>
          <p class="text-sm font-medium mb-2" style="color: #475569;">Parking Screen is under development</p>
          <p class="text-[11px] font-medium max-w-sm mx-auto leading-relaxed" style="color: #334155;">
            The full parking slot management system with vehicle tracking and availability dashboard will be available soon.
          </p>

          <!-- Feature preview pills -->
          <div class="flex flex-wrap items-center justify-center gap-3 mt-10">
            <span class="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fbbf24;">🚗 Slot Allocation</span>
            <span class="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fbbf24;">📋 Vehicle Registry</span>
            <span class="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fbbf24;">📊 Availability Map</span>
            <span class="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fbbf24;">🔔 Alerts</span>
          </div>

          <button (click)="back()" class="mt-12 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.3em] transition-all hover:-translate-y-1"
                  style="background: linear-gradient(135deg, #92400e, #f59e0b); color: #fff; border: none; box-shadow: 0 8px 32px rgba(245,158,11,0.25);">
            ← Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  `
})
export class ParkingComponent {
  constructor(private router: Router) {}
  back() { this.router.navigate(['/dashboard']); }
}
