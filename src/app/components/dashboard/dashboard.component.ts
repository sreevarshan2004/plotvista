import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="min-h-screen flex flex-col relative overflow-hidden"
         style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">

      <!-- Background grid -->
      <div class="absolute inset-0 opacity-[0.03]"
           style="background-image: linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px); background-size: 40px 40px;"></div>

      <!-- Glow orbs -->
      <div class="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-3xl pointer-events-none"
           style="background: radial-gradient(circle, #3b82f6, transparent);"></div>
      <div class="absolute bottom-0 right-1/3 w-96 h-96 rounded-full opacity-[0.07] blur-3xl pointer-events-none"
           style="background: radial-gradient(circle, #0ea5e9, transparent);"></div>

      <!-- Header -->
      <header class="relative z-10 px-8 py-5 flex items-center justify-between"
              style="border-bottom: 1px solid rgba(56,189,248,0.1);">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               style="background: linear-gradient(135deg, #1e40af, #0ea5e9); border: 1px solid rgba(56,189,248,0.3);">
            <span class="text-lg">🗺️</span>
          </div>
          <div>
            <h1 class="text-sm font-black tracking-widest uppercase" style="color: #f0f9ff;">
              MACS <span style="color: #38bdf8;">PLOTVISTA</span>
            </h1>
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: #10b981;"></span>
              <span class="text-[8px] uppercase tracking-[0.3em] font-bold" style="color: #38bdf8;">Control Center</span>
            </div>
          </div>
        </div>
        <button (click)="logout()"
                class="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:-translate-y-0.5"
                style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5;">
          🚪 Logout
        </button>
      </header>

      <!-- Main Content -->
      <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">

        <!-- Welcome -->
        <div class="text-center mb-14 animate-fade-up">
          <p class="text-[10px] font-black uppercase tracking-[0.5em] mb-3" style="color: #38bdf8;">Welcome Back, Admin</p>
          <h2 class="text-4xl font-black tracking-tight" style="color: #f0f9ff;">Select a Module</h2>
          <p class="text-sm mt-2 font-medium" style="color: #475569;">Choose what you want to manage today</p>
        </div>

        <!-- Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl animate-fade-up">

          <!-- Layout Screen Card -->
          <button (click)="goTo('/layout')"
                  class="group relative rounded-3xl p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(14,165,233,0.2)] cursor-pointer"
                  style="background: rgba(15,23,42,0.9); border: 1px solid rgba(56,189,248,0.2); backdrop-filter: blur(20px);">

            <!-- Hover glow -->
            <div class="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                 style="background: linear-gradient(135deg, rgba(14,165,233,0.05), transparent);"></div>

            <div class="relative">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                   style="background: linear-gradient(135deg, #1e40af, #0ea5e9); border: 1px solid rgba(56,189,248,0.4); box-shadow: 0 8px 24px rgba(14,165,233,0.3);">
                <span class="text-3xl">🗺️</span>
              </div>

              <h3 class="text-xl font-black tracking-tight mb-2" style="color: #f0f9ff;">Layout Screen</h3>
              <p class="text-[11px] font-medium leading-relaxed mb-6" style="color: #475569;">
                Design and manage the MACS plot layout. Add houses, apartments, roads, parks and more on the interactive map.
              </p>

              <div class="flex flex-wrap gap-2 mb-6">
                <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                      style="background: rgba(14,165,233,0.1); border: 1px solid rgba(14,165,233,0.2); color: #38bdf8;">Plot Editor</span>
                <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                      style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #34d399;">Street Map</span>
                <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                      style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); color: #a78bfa;">Residents</span>
              </div>

              <div class="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest transition-colors group-hover:gap-3 duration-300"
                   style="color: #38bdf8;">
                Open Layout <span class="transition-transform group-hover:translate-x-1 duration-300">→</span>
              </div>
            </div>
          </button>

          <!-- Parking Screen Card -->
          <button (click)="goTo('/parking')"
                  class="group relative rounded-3xl p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(245,158,11,0.15)] cursor-pointer"
                  style="background: rgba(15,23,42,0.9); border: 1px solid rgba(245,158,11,0.2); backdrop-filter: blur(20px);">

            <!-- Hover glow -->
            <div class="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                 style="background: linear-gradient(135deg, rgba(245,158,11,0.05), transparent);"></div>

            <div class="relative">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                   style="background: linear-gradient(135deg, #92400e, #f59e0b); border: 1px solid rgba(245,158,11,0.4); box-shadow: 0 8px 24px rgba(245,158,11,0.25);">
                <span class="text-3xl">🅿️</span>
              </div>

              <h3 class="text-xl font-black tracking-tight mb-2" style="color: #f0f9ff;">Parking Screen</h3>
              <p class="text-[11px] font-medium leading-relaxed mb-6" style="color: #475569;">
                Manage parking slots, vehicle assignments and availability across the entire MACS community layout.
              </p>

              <div class="flex flex-wrap gap-2 mb-6">
                <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                      style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fbbf24;">Slot Manager</span>
                <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                      style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fbbf24;">Vehicles</span>
                <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                      style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fbbf24;">Availability</span>
              </div>

              <div class="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest transition-colors group-hover:gap-3 duration-300"
                   style="color: #fbbf24;">
                Open Parking <span class="transition-transform group-hover:translate-x-1 duration-300">→</span>
              </div>
            </div>
          </button>

        </div>
      </main>

      <!-- Footer -->
      <footer class="relative z-10 text-center py-4"
              style="border-top: 1px solid rgba(56,189,248,0.08);">
        <p class="text-[9px] uppercase tracking-[0.3em] font-bold" style="color: #1e293b;">
          MACS © 2025 · PlotVista v2.0
        </p>
      </footer>
    </div>
  `
})
export class DashboardComponent {
  constructor(private router: Router) {}

  goTo(path: string) { this.router.navigate([path]); }
  logout() { this.router.navigate(['/login']); }
}
