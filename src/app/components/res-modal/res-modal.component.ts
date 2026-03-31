import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Resident, AptConfig } from '../../../types';

@Component({
  selector: 'app-res-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-md" (click)="onClose.emit()"></div>
      <div class="relative glass-card w-full max-w-sm rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-up">
        <div [class]="'p-6 border-b border-white/5 ' + (role === 'owner' ? 'bg-house/10' : 'bg-apt/10')">
          <h2 class="text-xl font-black text-white tracking-tight">Register {{role === 'owner' ? 'Owner' : 'Tenant'}}</h2>
          <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Identity Verification</p>
        </div>

        <div class="p-6 space-y-4">
          <!-- Role Radio -->
          <div class="flex gap-3">
            <label class="flex-1 flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all"
              [class]="role === 'owner' ? 'bg-house/10 border-house text-house' : 'bg-slate-800/60 border-white/5 text-slate-500 hover:border-white/20'">
              <input type="radio" name="resRole" value="owner" [(ngModel)]="role" class="hidden">
              <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                [class]="role === 'owner' ? 'border-house' : 'border-slate-600'">
                <span *ngIf="role === 'owner'" class="w-2 h-2 rounded-full bg-house"></span>
              </span>
              <span class="text-[10px] font-black uppercase tracking-widest">👤 Owner</span>
            </label>
            <label class="flex-1 flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all"
              [class]="role === 'tenant' ? 'bg-apt/10 border-apt text-apt' : 'bg-slate-800/60 border-white/5 text-slate-500 hover:border-white/20'">
              <input type="radio" name="resRole" value="tenant" [(ngModel)]="role" class="hidden">
              <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                [class]="role === 'tenant' ? 'border-apt' : 'border-slate-600'">
                <span *ngIf="role === 'tenant'" class="w-2 h-2 rounded-full bg-apt"></span>
              </span>
              <span class="text-[10px] font-black uppercase tracking-widest">🏠 Tenant</span>
            </label>
          </div>
          <div class="space-y-1.5">
            <label class="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">Full Name</label>
            <input 
              #nameInput
              type="text" 
              [(ngModel)]="name"
              class="w-full bg-slate-800 border border-white/10 p-2.5 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              placeholder="Enter resident name"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">Contact Number</label>
            <input 
              type="text" 
              [(ngModel)]="phone"
              class="w-full bg-slate-800 border border-white/10 p-2.5 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              placeholder="+1 234 567 890"
            />
          </div>

          <div *ngIf="aptConfig" class="space-y-1.5">
            <label class="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">Unit Designation</label>
            <select 
              [(ngModel)]="unit"
              class="w-full bg-slate-800 border border-white/10 p-2.5 text-accent rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none text-sm"
            >
              <option value="">Select Unit</option>
              <option *ngFor="let opt of unitOptions" [value]="opt.value">{{opt.label}}</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">System Notes</label>
            <textarea 
              [(ngModel)]="note"
              class="w-full bg-slate-800 border border-white/10 p-2.5 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 h-20 resize-none text-sm"
              placeholder="Additional telemetry..."
            ></textarea>
          </div>
        </div>

        <div class="p-6 bg-slate-900/40 flex justify-end gap-3">
          <button (click)="onClose.emit()" class="px-4 py-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">Abort</button>
          <button 
            (click)="handleSave()"
            class="bg-accent text-slate-900 font-bold px-4 py-2 rounded-lg text-xs transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]"
          >
            Commit Entry
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResModalComponent {
  @Input() isOpen = false;
  @Input() role: 'owner' | 'tenant' = 'owner';
  @Input() aptConfig?: AptConfig;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<Resident>();

  @ViewChild('nameInput') nameInput?: ElementRef<HTMLInputElement>;

  name = '';
  phone = '';
  unit = '';
  note = '';

  get unitOptions() {
    if (!this.aptConfig) return [];
    const options = [];
    for (let f = this.aptConfig.floors; f >= 1; f--) {
      for (let u = 0; u < this.aptConfig.unitsPerFloor; u++) {
        const id = `${f}${String.fromCharCode(65 + u)}`;
        options.push({ value: id, label: `Floor ${f} — Unit ${id}` });
      }
    }
    for (let u = 1; u <= this.aptConfig.unitsPerFloor; u++) {
      const id = `G${u}`;
      options.push({ value: id, label: `Ground — Unit ${id}` });
    }
    return options;
  }

  handleSave() {
    if (!this.name.trim()) return;
    this.onSave.emit({
      name: this.name,
      phone: this.phone,
      role: this.role,
      unit: this.unit,
      note: this.note
    });
    this.reset();
  }

  reset() {
    this.name = '';
    this.phone = '';
    this.unit = '';
    this.note = '';
  }
}
