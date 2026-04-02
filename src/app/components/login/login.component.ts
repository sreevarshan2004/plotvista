import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center relative overflow-hidden"
         style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">

      <!-- Background grid -->
      <div class="absolute inset-0 opacity-[0.03]"
           style="background-image: linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px); background-size: 40px 40px;"></div>

      <!-- Glow orbs -->
      <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
           style="background: radial-gradient(circle, #3b82f6, transparent);"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
           style="background: radial-gradient(circle, #0ea5e9, transparent);"></div>

      <!-- Login Card -->
      <div class="relative w-full max-w-md mx-4 animate-fade-up">
        <div class="rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)]"
             style="background: rgba(15,23,42,0.95); border: 1px solid rgba(56,189,248,0.15); backdrop-filter: blur(20px);">

          <!-- Header -->
          <div class="px-8 pt-10 pb-6 text-center border-b" style="border-color: rgba(56,189,248,0.1);">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg"
                 style="background: linear-gradient(135deg, #1e40af, #0ea5e9); border: 1px solid rgba(56,189,248,0.3);">
              <span class="text-3xl">🗺️</span>
            </div>
            <h1 class="text-2xl font-black tracking-widest uppercase" style="color: #f0f9ff;">
              MACS <span style="color: #38bdf8;">PLOTVISTA</span>
            </h1>
            <p class="text-[10px] font-black uppercase tracking-[0.4em] mt-1" style="color: #38bdf8;">
              Real-Time Layout Engine
            </p>
            <div class="flex items-center justify-center gap-2 mt-3">
              <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: #10b981;"></span>
              <span class="text-[9px] uppercase tracking-[0.3em] font-bold" style="color: #64748b;">Secure Access Portal</span>
            </div>
          </div>

          <!-- Form -->
          <div class="px-8 py-8 space-y-5">

            <div *ngIf="error()" class="flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold animate-fade-up"
                 style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5;">
              <span>⚠️</span> Invalid username or password
            </div>

            <!-- Username -->
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-[0.3em]" style="color: #38bdf8;">Username</label>
              <div class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                   [style.background]="'rgba(30,41,59,0.8)'"
                   [style.border]="focusUser ? '1px solid rgba(56,189,248,0.6)' : '1px solid rgba(56,189,248,0.2)'">
                <span class="text-sm" style="color: #38bdf8;">👤</span>
                <input type="text" [(ngModel)]="username" placeholder="Enter username"
                       (focus)="focusUser = true" (blur)="focusUser = false"
                       (keydown.enter)="login()"
                       class="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-600"
                       style="color: #f0f9ff; caret-color: #38bdf8;" />
              </div>
            </div>

            <!-- Password -->
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-[0.3em]" style="color: #38bdf8;">Password</label>
              <div class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                   [style.background]="'rgba(30,41,59,0.8)'"
                   [style.border]="focusPass ? '1px solid rgba(56,189,248,0.6)' : '1px solid rgba(56,189,248,0.2)'">
                <span class="text-sm" style="color: #38bdf8;">🔒</span>
                <input [type]="showPass ? 'text' : 'password'" [(ngModel)]="password" placeholder="Enter password"
                       (focus)="focusPass = true" (blur)="focusPass = false"
                       (keydown.enter)="login()"
                       class="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-600"
                       style="color: #f0f9ff; caret-color: #38bdf8;" />
                <button type="button" (click)="showPass = !showPass" class="text-xs transition-colors"
                        [style.color]="showPass ? '#38bdf8' : '#475569'">
                  {{ showPass ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <!-- Login Button -->
            <button (click)="login()" [disabled]="loading()"
                    class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.3em] transition-all mt-2"
                    style="background: linear-gradient(135deg, #1d4ed8, #0ea5e9); color: #fff; border: none; box-shadow: 0 8px 32px rgba(14,165,233,0.3);"
                    [style.opacity]="loading() ? '0.7' : '1'">
              <span *ngIf="!loading()">🔐 Sign In</span>
              <span *ngIf="loading()" class="flex items-center justify-center gap-2">
                <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Authenticating...
              </span>
            </button>
          </div>

          <!-- Footer -->
          <div class="px-8 pb-6 text-center">
            <p class="text-[9px] uppercase tracking-[0.3em] font-bold" style="color: #334155;">
              MACS © 2025 · All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  showPass = false;
  focusUser = false;
  focusPass = false;
  error = signal(false);
  loading = signal(false);

  constructor(private router: Router) {}

  login() {
    if (!this.username || !this.password) { this.error.set(true); return; }
    this.loading.set(true);
    this.error.set(false);
    setTimeout(() => {
      if (this.username === 'admin' && this.password === 'admin') {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set(true);
        this.loading.set(false);
      }
    }, 800);
  }
}
