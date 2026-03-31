import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotData } from '../../../types';

const COMMON_FACILITIES = ['Gym', 'Pool', 'Parking', 'Security', 'Lounge', 'Garden', 'WiFi', 'EV Charging'];

const COMMUNITY_SHOPS = [
  { value: 'community_hall', label: 'Community Hall', emoji: '🏛️' },
  { value: 'mini_market', label: 'Mini Market', emoji: '🛒' },
  { value: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
  { value: 'laundry', label: 'Laundry', emoji: '🧺' },
  { value: 'gym_room', label: 'Gym Room', emoji: '🏋️' },
  { value: 'salon', label: 'Salon', emoji: '💈' },
  { value: 'cafe', label: 'Café', emoji: '☕' },
  { value: 'library', label: 'Library', emoji: '📚' },
  { value: 'kids_play', label: 'Kids Play', emoji: '🎠' },
  { value: 'office', label: 'Office Space', emoji: '💼' },
  { value: 'clinic', label: 'Clinic', emoji: '🩺' },
  { value: 'atm', label: 'ATM', emoji: '🏧' },
];

@Component({
  selector: 'app-apt-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[150] flex items-center justify-center p-2">
      <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" (click)="onClose.emit()"></div>

      <div class="relative glass-card w-full max-w-[96vw] h-[94vh] rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-fade-up border-white/10">

        <!-- Top Header -->
        <div class="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-apt/20 border border-apt/30 rounded-2xl flex items-center justify-center text-2xl">🏢</div>
            <div>
              <h2 class="text-2xl font-black text-white tracking-tighter">{{plotData.aptConfig?.blockName || 'Tower'}}</h2>
              <p class="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mt-0.5">
                {{plotData.aptConfig?.floors}} Floors · {{plotData.aptConfig?.unitsPerFloor}} Units/Floor · {{plotKey}}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <!-- Legend -->
            <div class="flex items-center gap-3 text-[9px] text-slate-500 mr-4">
              <span class="flex items-center gap-1.5"><span class="w-4 h-5 rounded border border-white/20 bg-slate-800/60 inline-block"></span>Room</span>
              <span class="flex items-center gap-1.5"><span class="w-4 h-5 rounded border border-blue-400/50 bg-blue-500/15 inline-block"></span>Shop</span>
              <span class="flex items-center gap-1.5"><span class="w-4 h-5 rounded border-dashed border border-white/20 opacity-40 inline-block"></span>Removed</span>
              <span class="flex items-center gap-1.5"><span class="w-4 h-5 rounded border border-house/40 bg-house/10 inline-block"></span>Occupied</span>
            </div>
            <button (click)="onClose.emit()" class="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all text-white text-lg">✕</button>
          </div>
        </div>

        <!-- Body -->
        <div class="flex flex-1 overflow-hidden">

          <!-- LEFT: Facilities only -->
          <div class="w-64 bg-slate-900/50 border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar shrink-0">
            <!-- Facilities (Editable) -->
            <div class="p-5 border-b border-white/5">
              <h3 class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 flex items-center justify-between">
                <span>Facilities</span>
                <span class="text-accent text-[8px] font-normal lowercase tracking-normal">Click to toggle</span>
              </h3>
              <div class="flex flex-wrap gap-1.5">
                <button *ngFor="let f of commonFacilities" (click)="toggleFacility(f)"
                  [class]="'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ' +
                    (plotData.aptConfig!.facilities.includes(f) ? 'bg-accent text-slate-950 border-accent' : 'bg-slate-800 text-slate-500 border-white/5 hover:border-white/20')">
                  {{f}}
                </button>
              </div>
            </div>

            <!-- Shop Palette (Editable) -->
            <div class="p-5 border-b border-white/5">
              <h3 class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 flex items-center justify-between">
                <span>Community Palette</span>
                <span class="text-slate-600 text-[8px] font-normal lowercase tracking-normal">Drag onto unit</span>
              </h3>
              <div class="grid grid-cols-2 gap-2">
                <div *ngFor="let s of communityShops"
                  draggable="true" (dragstart)="onShopDragStart(s.value)"
                  class="flex items-center gap-2 px-2.5 py-2.5 bg-slate-800/80 rounded-xl border border-white/5 hover:border-blue-400/40 hover:bg-blue-500/10 transition-all cursor-grab active:cursor-grabbing group">
                  <span class="text-base group-hover:scale-110 transition-transform">{{s.emoji}}</span>
                  <span class="text-[9px] font-black text-slate-400 group-hover:text-blue-300 truncate">{{s.label}}</span>
                </div>
              </div>
            </div>

            <!-- Room summary -->
            <div class="p-5 border-t border-white/5 mt-auto">
              <h3 class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Room Summary</h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-white/5">
                  <span class="text-[10px] text-slate-400 font-bold">Total Rooms</span>
                  <span class="text-accent font-black">{{(plotData.aptConfig?.floors || 0) * (plotData.aptConfig?.unitsPerFloor || 0)}}</span>
                </div>
                <div class="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-white/5">
                  <span class="text-[10px] text-slate-400 font-bold">Occupied</span>
                  <span class="text-house font-black">{{plotData.residents.length}}</span>
                </div>
                <div class="flex items-center justify-between p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <span class="text-[10px] text-blue-300 font-bold">Shops</span>
                  <span class="text-blue-400 font-black">{{getShopCount()}}</span>
                </div>
                <div class="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-white/5">
                  <span class="text-[10px] text-slate-400 font-bold">Removed</span>
                  <span class="text-danger font-black">{{plotData.aptConfig?.skippedUnits?.length || 0}}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- CENTER: Schematic -->
          <div class="flex-1 flex flex-col overflow-hidden bg-slate-950/80">
            <div class="px-6 py-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-slate-900/60">
              <span class="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-black">Real-Time Schematic Unit</span>
              <div class="flex items-center gap-4">
                <span *ngIf="pendingMerge.length > 0" class="text-[10px] text-purple-400 font-black animate-pulse">{{pendingMerge.length}} units selected — release Ctrl to merge</span>
                <span *ngIf="pendingMerge.length === 0 && selectedUnit" class="text-[10px] text-accent font-black">
                  Unit {{selectedUnit}} —
                  <span [class]="isShopUnit(selectedUnit) ? 'text-blue-400' : 'text-house'">
                    {{isShopUnit(selectedUnit) ? getShopLabel(selectedUnit) : 'Residential'}}
                  </span>
                </span>
              </div>
            </div>

            <div class="flex-1 overflow-auto custom-scrollbar p-8 flex items-start justify-center" (dragover)="$event.preventDefault()">
              <div class="flex flex-col gap-3">

                <!-- Floors (top = highest floor) -->
                <div *ngFor="let floor of floorsArray; let fIdx = index" class="flex gap-3 items-center">
                  <span class="text-[10px] text-slate-300 font-black w-8 text-right shrink-0">
                    {{plotData.aptConfig!.floors - fIdx}}F
                  </span>
                  <ng-container *ngFor="let unit of unitsArray; let uIdx = index">
                    <div *ngIf="!isMergeSecondary(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))"
                      (click)="selectUnit(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))"
                      (drop)="onDropOnUnit(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))"
                      [class]="getUnitClass(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))"
                      [style.width]="getMergedWidth(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))"
                    >
                      <ng-container *ngIf="isUnitSkipped(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))">
                        <div class="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-white/30 rounded-tl"></div>
                        <div class="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-white/30 rounded-tr"></div>
                        <div class="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-white/30 rounded-bl"></div>
                        <div class="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-white/30 rounded-br"></div>
                      </ng-container>
                      <ng-container *ngIf="!isUnitSkipped(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))">
                        <span *ngIf="getShopEmoji(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))" class="text-2xl leading-none">{{getShopEmoji(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))}}</span>
                        
                        <!-- Room Label/Input -->
                        <div (click)="$event.stopPropagation()" class="flex flex-col items-center justify-center w-full px-2">
                          <input *ngIf="selectedUnit === getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)" type="text"
                            [ngModel]="plotData.aptConfig?.unitNames?.[getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)] || getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)"
                            (ngModelChange)="updateUnitName(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx), $event)"
                            class="bg-white/10 border-none outline-none text-[11px] font-black text-white text-center w-full rounded py-1 focus:bg-white/20 transition-all"
                            (keydown.enter)="selectedUnit = null" />
                          <span *ngIf="selectedUnit !== getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)" class="text-[11px] font-black leading-none mt-1"
                            [class]="isShopUnit(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)) ? 'text-blue-200' : 'text-white/80'">
                            {{ isMergePrimary(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)) ? getMergeLabel(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)) : (plotData.aptConfig?.unitNames?.[getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)] || getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)) }}
                          </span>
                        </div>
                        <span *ngIf="isShopUnit(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))" class="text-[7px] text-blue-200 font-black uppercase leading-none text-center px-1 truncate w-full">{{getShopLabel(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))}}</span>
                        <span *ngIf="!isShopUnit(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))" class="text-[7px] font-black uppercase leading-none"
                          [class]="getBhkColor(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))">
                          {{getUnitBhk(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)) || 'ROOM'}}
                        </span>
                        <div *ngIf="isUnitOccupied(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))"
                          class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          [class]="isShopUnit(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)) ? 'bg-blue-400' : 'bg-house'">
                        </div>
                        <span *ngIf="pendingMerge.includes(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))" class="absolute -top-2 -left-2 w-4 h-4 bg-purple-500 text-white rounded-full text-[8px] font-black flex items-center justify-center">{{pendingMerge.indexOf(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)) + 1}}</span>
                        <button *ngIf="selectedUnit === getUnitId(plotData.aptConfig!.floors - fIdx, uIdx) && isMergePrimary(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx))"
                          (click)="splitUnit(getUnitId(plotData.aptConfig!.floors - fIdx, uIdx)); $event.stopPropagation()"
                          class="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 h-5 bg-blue-500 text-white rounded-full text-[8px] font-black flex items-center gap-0.5 justify-center shadow-lg z-10 hover:bg-blue-400 transition-all whitespace-nowrap">✂ Split</button>
                      </ng-container>
                    </div>
                  </ng-container>
                </div>

                <!-- Ground Floor -->
                <div class="flex gap-3 items-center border-t-2 border-white/10 pt-3 mt-1">
                  <span class="text-[10px] text-slate-300 font-black w-8 text-right shrink-0">GF</span>
                  <ng-container *ngFor="let unit of unitsArray; let uIdx = index">
                    <div *ngIf="!isMergeSecondary('G'+(uIdx+1))"
                      (click)="selectUnit('G'+(uIdx+1))"
                      (drop)="onDropOnUnit('G'+(uIdx+1))"
                      [class]="getUnitClass('G'+(uIdx+1))"
                      [style.width]="getMergedWidth('G'+(uIdx+1))"
                    >
                      <ng-container *ngIf="isUnitSkipped('G'+(uIdx+1))">
                        <div class="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-white/30 rounded-tl"></div>
                        <div class="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-white/30 rounded-tr"></div>
                        <div class="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-white/30 rounded-bl"></div>
                        <div class="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-white/30 rounded-br"></div>
                      </ng-container>
                      <ng-container *ngIf="!isUnitSkipped('G'+(uIdx+1))">
                        <span *ngIf="getShopEmoji('G'+(uIdx+1))" class="text-2xl leading-none">{{getShopEmoji('G'+(uIdx+1))}}</span>
                        
                        <!-- Room Label/Input -->
                        <div (click)="$event.stopPropagation()" class="flex flex-col items-center justify-center w-full px-2">
                          <input *ngIf="selectedUnit === 'G'+(uIdx+1)" type="text"
                            [ngModel]="plotData.aptConfig?.unitNames?.['G'+(uIdx+1)] || 'G'+(uIdx+1)"
                            (ngModelChange)="updateUnitName('G'+(uIdx+1), $event)"
                            class="bg-white/10 border-none outline-none text-[11px] font-black text-white text-center w-full rounded py-1 focus:bg-white/20 transition-all"
                            (keydown.enter)="selectedUnit = null" />
                          <span *ngIf="selectedUnit !== 'G'+(uIdx+1)" class="text-[11px] font-black leading-none mt-1"
                            [class]="isShopUnit('G'+(uIdx+1)) ? 'text-blue-200' : 'text-white/80'">
                            {{ isMergePrimary('G'+(uIdx+1)) ? getMergeLabel('G'+(uIdx+1)) : (plotData.aptConfig?.unitNames?.['G'+(uIdx+1)] || 'G'+(uIdx+1)) }}
                          </span>
                        </div>
                        <span *ngIf="isShopUnit('G'+(uIdx+1))" class="text-[7px] text-blue-200 font-black uppercase leading-none text-center px-1 truncate w-full">{{getShopLabel('G'+(uIdx+1))}}</span>
                        <span *ngIf="!isShopUnit('G'+(uIdx+1))" class="text-[7px] font-black uppercase leading-none"
                          [class]="getBhkColor('G'+(uIdx+1))">
                          {{getUnitBhk('G'+(uIdx+1)) || 'BASE'}}
                        </span>
                        <div *ngIf="isUnitOccupied('G'+(uIdx+1))" class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-house rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        <span *ngIf="pendingMerge.includes('G'+(uIdx+1))" class="absolute -top-2 -left-2 w-4 h-4 bg-purple-500 text-white rounded-full text-[8px] font-black flex items-center justify-center">{{pendingMerge.indexOf('G'+(uIdx+1)) + 1}}</span>
                        <button *ngIf="selectedUnit === 'G'+(uIdx+1) && isMergePrimary('G'+(uIdx+1))"
                          (click)="splitUnit('G'+(uIdx+1)); $event.stopPropagation()"
                          class="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 h-5 bg-blue-500 text-white rounded-full text-[8px] font-black flex items-center gap-0.5 justify-center shadow-lg z-10 hover:bg-blue-400 transition-all whitespace-nowrap">✂ Split</button>
                      </ng-container>
                    </div>
                  </ng-container>
                </div>

              </div>
            </div>

            <div class="px-6 py-2 border-t border-white/5 bg-slate-900/20 text-[9px] text-slate-600 flex gap-5 shrink-0">
              <span>🖱️ Click to inspect</span>
              <span>⌨️ Ctrl+Click multi-select → merge</span>
              <span>✂ Click merged → Split</span>
              <span>● Green = occupied</span>
            </div>
          </div>

          <!-- RIGHT: Unit Inspector -->
          <div class="w-80 bg-slate-900/70 border-l border-white/5 flex flex-col shrink-0">
            <div class="p-6 border-b border-white/5">
              <h3 class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Unit Inspector</h3>
              <div *ngIf="selectedUnit">
                <div class="flex items-center gap-3 mb-3">
                  <span *ngIf="getShopEmoji(selectedUnit)" class="text-3xl">{{getShopEmoji(selectedUnit)}}</span>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <input type="text" [ngModel]="plotData.aptConfig?.unitNames?.[selectedUnit] || selectedUnit"
                        (ngModelChange)="updateUnitName(selectedUnit, $event)"
                        class="bg-transparent border-none outline-none text-2xl font-black text-white w-full hover:bg-white/5 rounded px-1 transition-all" />
                    </div>
                    <div class="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                      [class]="isShopUnit(selectedUnit) ? 'text-blue-400' : 'text-house'">
                      {{isShopUnit(selectedUnit) ? getShopLabel(selectedUnit) : 'Residential Room'}}
                    </div>
                  </div>
                </div>

                 <!-- BHK Selection -->
                <div *ngIf="!isShopUnit(selectedUnit) && !isUnitSkipped(selectedUnit)" class="mb-4">
                  <label class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">BHK Type</label>
                  <div class="grid grid-cols-3 gap-2">
                    <button *ngFor="let b of ['1BHK', '2BHK', '3BHK']" (click)="setUnitBhk(selectedUnit, b)"
                      [class]="'py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ' +
                        (getUnitBhk(selectedUnit) === b ? 'bg-accent text-slate-900 border-accent' : 'bg-slate-800 text-slate-400 border-white/5 hover:border-accent/40')">
                      {{b}}
                    </button>
                  </div>
                </div>

                <!-- BHK Detail Card -->
                <div *ngIf="getUnitBhk(selectedUnit) && !isShopUnit(selectedUnit) && !isUnitSkipped(selectedUnit)" class="rounded-xl border border-accent/20 bg-accent/5 p-3 mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[9px] font-black uppercase tracking-widest text-accent">🏠 {{getUnitBhk(selectedUnit)}}</span>
                    <span class="text-[8px] text-slate-500 font-bold">Standard Specs</span>
                  </div>
                  <div class="grid grid-cols-3 gap-1.5">
                    <div class="bg-slate-800/60 rounded-lg p-2 text-center border border-white/5">
                      <div class="text-base">🛏️</div>
                      <div class="text-[10px] font-black text-white">{{getBhkDetails(selectedUnit).bedrooms}}</div>
                      <div class="text-[7px] text-slate-500 uppercase">Bed</div>
                    </div>
                    <div class="bg-slate-800/60 rounded-lg p-2 text-center border border-white/5">
                      <div class="text-base">🛁</div>
                      <div class="text-[10px] font-black text-white">{{getBhkDetails(selectedUnit).bathrooms}}</div>
                      <div class="text-[7px] text-slate-500 uppercase">Bath</div>
                    </div>
                    <div class="bg-slate-800/60 rounded-lg p-2 text-center border border-white/5">
                      <div class="text-base">🪑</div>
                      <div class="text-[10px] font-black text-white">{{getBhkDetails(selectedUnit).hall}}</div>
                      <div class="text-[7px] text-slate-500 uppercase">Hall</div>
                    </div>
                  </div>
                </div>

                <!-- Unit Action Buttons -->
                <div class="grid grid-cols-2 gap-2 mb-4">
                  <!-- Remove/Restore Unit -->
                  <button (click)="toggleSkipUnit(selectedUnit)"
                    [class]="'py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ' + 
                      (isUnitSkipped(selectedUnit) ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20' : 'bg-danger/10 text-danger border-danger/30 hover:bg-danger/20')">
                    {{ isUnitSkipped(selectedUnit) ? '⎌ Restore Unit' : '🗑️ Remove Unit' }}
                  </button>

                  <!-- Remove Shop -->
                  <button *ngIf="isShopUnit(selectedUnit)" (click)="removeShop(selectedUnit)"
                    class="py-2 bg-blue-500/10 border border-blue-400/30 text-blue-300 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500/20 transition-all">
                    🚫 Clear Shop
                  </button>
                </div>
              </div>
              <div *ngIf="!selectedUnit" class="text-sm text-slate-600 italic">Select a unit to inspect</div>
            </div>

            <div *ngIf="selectedUnit" class="flex border-b border-white/5 bg-slate-900/40 shrink-0">
              <button (click)="inspectorTab = 'occupants'"
                [class]="'flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ' + (inspectorTab === 'occupants' ? 'text-white border-accent bg-accent/5' : 'text-slate-500 border-transparent hover:text-slate-300')">
                Occupants
              </button>
              <button (click)="inspectorTab = 'financials'"
                [class]="'flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ' + (inspectorTab === 'financials' ? 'text-white border-accent bg-accent/5' : 'text-slate-500 border-transparent hover:text-slate-300')">
                Financials
              </button>
            </div>

            <div class="flex-1 p-6 overflow-y-auto custom-scrollbar">
              <div *ngIf="selectedUnit">

                <!-- Occupants -->
                <div *ngIf="inspectorTab === 'occupants'" class="space-y-3">
                  <ng-container *ngIf="getOccupants(selectedUnit).length > 0; else noOccupant">
                    <div *ngFor="let occupant of getOccupants(selectedUnit); let i = index"
                      class="bg-slate-800/60 border border-white/10 p-4 rounded-2xl relative overflow-hidden hover:border-white/20 transition-all">
                      <div class="absolute top-0 left-0 w-1 h-full"
                        [class]="isShopUnit(selectedUnit) ? 'bg-blue-500' : 'bg-house'"></div>
                      <div class="flex items-start justify-between">
                        <div>
                          <span class="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Tenant {{i+1}}</span>
                          <div class="text-sm font-black text-white">{{occupant.name}}</div>
                          <div class="text-[10px] font-bold uppercase mt-0.5"
                            [class]="isShopUnit(selectedUnit) ? 'text-blue-400' : 'text-house'">{{occupant.role}}</div>
                          <div *ngIf="getUnitBhk(selectedUnit)" class="text-[9px] text-accent font-black mt-0.5">🏠 {{getUnitBhk(selectedUnit)}}</div>
                        </div>
                        <span class="text-xl">{{isShopUnit(selectedUnit) ? '🛒' : '👤'}}</span>
                      </div>
                      <div class="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-400 font-mono">
                        📞 {{occupant.phone || 'N/A'}}
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #noOccupant>
                    <div class="border border-dashed border-white/10 p-8 rounded-2xl text-center opacity-40">
                      <div class="text-3xl mb-2">👻</div>
                      <span class="text-[10px] font-black text-white uppercase tracking-[0.3em]">Vacant</span>
                    </div>
                  </ng-template>

                  <!-- Add Resident Button -->
                  <button (click)="openUnitForm(selectedUnit)"
                    class="w-full py-2.5 bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-accent/20 transition-all flex items-center justify-center gap-2">
                    + Add Resident
                  </button>
                </div>

                <!-- Financials -->
                <div *ngIf="inspectorTab === 'financials'" class="space-y-4">
                  <div class="bg-slate-800/40 border border-white/5 p-5 rounded-2xl focus-within:border-accent/50 transition-all">
                    <label class="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-2">
                      <span class="text-accent">💰</span> Monthly Rent
                    </label>
                    <div class="flex items-center text-xl font-black text-white">
                      <span class="mr-2 text-slate-500">$</span>
                      <input type="number" [(ngModel)]="unitRent" (change)="saveUnitDetail()"
                        class="w-full bg-transparent border-none p-0 text-white focus:outline-none font-black"/>
                    </div>
                  </div>
                  <div class="bg-slate-800/40 border border-white/5 p-5 rounded-2xl focus-within:border-accent/50 transition-all">
                    <label class="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-2">
                      <span class="text-accent">📐</span> Area SQFT
                    </label>
                    <div class="flex items-center text-xl font-black text-white">
                      <input type="number" [(ngModel)]="unitSqft" (change)="saveUnitDetail()"
                        class="w-full bg-transparent border-none p-0 text-white focus:outline-none font-black"/>
                      <span class="ml-2 text-slate-500 text-sm">ft²</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unit Resident Form Modal -->
    <div *ngIf="isUnitFormOpen" class="fixed inset-0 z-[300] flex items-center justify-center p-4" (click)="isUnitFormOpen = false">
      <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
      <div class="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-up" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-lg font-black text-white">Unit {{unitFormData.unit}}</h3>
            <p class="text-[10px] text-accent uppercase tracking-widest font-bold">Add Resident</p>
          </div>
          <button (click)="isUnitFormOpen = false" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">✕</button>
        </div>

        <div class="space-y-4">
          <!-- Name -->
          <div>
            <label class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Full Name</label>
            <input type="text" [(ngModel)]="unitFormData.name" placeholder="Enter name"
              class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-accent/50 transition-all placeholder:text-slate-600" />
          </div>

          <!-- Phone -->
          <div>
            <label class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Phone Number</label>
            <input type="text" [(ngModel)]="unitFormData.phone" placeholder="Enter phone"
              class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-accent/50 transition-all placeholder:text-slate-600" />
          </div>

          <!-- Role -->
          <div>
            <label class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Role</label>
            <select [(ngModel)]="unitFormData.role"
              class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-accent/50 transition-all">
              <option value="owner">Owner</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>

          <!-- BHK -->
          <div>
            <label class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">BHK Type</label>
            <select [(ngModel)]="unitFormData.bhk"
              class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-accent/50 transition-all">
              <option value="">Select BHK</option>
              <option value="1BHK">1 BHK</option>
              <option value="2BHK">2 BHK</option>
              <option value="3BHK">3 BHK</option>
            </select>
          </div>
        </div>

        <button (click)="saveUnitResident()"
          class="mt-6 w-full py-3 bg-accent text-slate-900 font-black text-sm uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-lg shadow-accent/20">
          💾 Save Resident
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AptDetailModalComponent {
  @Input() isOpen = false;
  @Input() plotKey = '';
  @Input() plotData!: PlotData;
  @Output() onClose = new EventEmitter<void>();
  @Output() onUpdatePlot = new EventEmitter<{ key: string; updates: Partial<PlotData> }>();

  selectedUnit: string | null = null;
  communityShops = COMMUNITY_SHOPS;
  commonFacilities = COMMON_FACILITIES;
  inspectorTab: 'occupants' | 'financials' = 'occupants';
  unitRent = 0;
  unitSqft = 0;
  dragShop: string | null = null;
  pendingMerge: string[] = [];
  isCtrlHeld = false;

  isUnitFormOpen = false;
  unitFormData: { unit: string; name: string; phone: string; role: 'owner' | 'tenant'; bhk: string } = {
    unit: '', name: '', phone: '', role: 'tenant', bhk: ''
  };

  openUnitForm(unitId: string) {
    this.unitFormData = { unit: unitId, name: '', phone: '', role: 'tenant', bhk: '' };
    this.isUnitFormOpen = true;
  }

  saveUnitResident() {
    if (!this.unitFormData.name.trim()) return;
    const newResident = {
      name: this.unitFormData.name.trim(),
      phone: this.unitFormData.phone.trim(),
      role: this.unitFormData.role,
      unit: this.unitFormData.unit
    };
    const unitBhkMap = { ...(this.plotData.aptConfig?.unitBhk || {}), [this.unitFormData.unit]: this.unitFormData.bhk };
    this.onUpdatePlot.emit({
      key: this.plotKey,
      updates: {
        residents: [...this.plotData.residents, newResident],
        aptConfig: { ...this.plotData.aptConfig!, unitBhk: unitBhkMap }
      }
    });
    this.isUnitFormOpen = false;
  }

  updateUnitName(unitId: string, newName: string) {
    if (!unitId) return;
    const unitNames = { ...(this.plotData.aptConfig?.unitNames || {}) };
    if (!newName.trim()) {
      delete unitNames[unitId];
    } else {
      unitNames[unitId] = newName;
    }
    this.onUpdatePlot.emit({
      key: this.plotKey,
      updates: { aptConfig: { ...this.plotData.aptConfig!, unitNames } }
    });
  }

  getUnitBhk(unitId: string): string {
    return this.plotData.aptConfig?.unitBhk?.[unitId] || '';
  }

  getBhkColor(unitId: string): string {
    const bhk = this.getUnitBhk(unitId);
    if (bhk === '1BHK') return 'text-green-300/80';
    if (bhk === '2BHK') return 'text-yellow-300/80';
    if (bhk === '3BHK') return 'text-pink-300/80';
    return 'text-slate-400/70';
  }

  getBhkDetails(unitId: string): { bedrooms: number; bathrooms: number; hall: number; kitchen: number; sqft: string } {
    const bhk = this.getUnitBhk(unitId);
    const map: Record<string, { bedrooms: number; bathrooms: number; hall: number; kitchen: number; sqft: string }> = {
      '1BHK': { bedrooms: 1, bathrooms: 1, hall: 1, kitchen: 1, sqft: '450–600' },
      '2BHK': { bedrooms: 2, bathrooms: 2, hall: 1, kitchen: 1, sqft: '750–1000' },
      '3BHK': { bedrooms: 3, bathrooms: 2, hall: 1, kitchen: 1, sqft: '1100–1400' },
    };
    return map[bhk] || { bedrooms: 0, bathrooms: 0, hall: 0, kitchen: 0, sqft: '—' };
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Control') this.isCtrlHeld = true;
    if (e.key === 'Escape') { this.pendingMerge = []; this.selectedUnit = null; }
  }
  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    if (e.key === 'Control') {
      this.isCtrlHeld = false;
      if (this.pendingMerge.length >= 2) this.executeMerge();
      else if (this.pendingMerge.length === 1) { this.selectedUnit = this.pendingMerge[0]; this.pendingMerge = []; }
    }
  }

  get floorsArray() { return Array(this.plotData.aptConfig?.floors || 0).fill(0); }
  get unitsArray() { return Array(this.plotData.aptConfig?.unitsPerFloor || 0).fill(0); }

  getUnitId(floor: number, unitIdx: number) {
    return `${floor}${String.fromCharCode(65 + unitIdx)}`;
  }

  isUnitSkipped(id: string) {
    return this.plotData.aptConfig?.skippedUnits?.includes(id) || false;
  }

  isShopUnit(id: string | null): boolean {
    if (!id) return false;
    return !!(this.plotData.aptConfig?.unitShops?.[id]);
  }

  getShopEmoji(id: string): string {
    const shopVal = this.plotData.aptConfig?.unitShops?.[id];
    return COMMUNITY_SHOPS.find(s => s.value === shopVal)?.emoji || '';
  }

  getShopLabel(id: string): string {
    const shopVal = this.plotData.aptConfig?.unitShops?.[id];
    return COMMUNITY_SHOPS.find(s => s.value === shopVal)?.label || '';
  }

  isUnitOccupied(id: string) {
    return this.plotData.residents.some(r => r.unit === id);
  }

  getOccupants(id: string) {
    return this.plotData.residents.filter(r => r.unit === id);
  }

  selectUnit(id: string) {
    if (this.isCtrlHeld) {
      this.pendingMerge = this.pendingMerge.includes(id)
        ? this.pendingMerge.filter(x => x !== id)
        : [...this.pendingMerge, id];
      this.selectedUnit = null;
    } else {
      this.pendingMerge = [];
      this.selectedUnit = this.selectedUnit === id ? null : id;
      if (this.selectedUnit) {
        const detail = this.plotData.aptConfig?.unitDetails?.[id];
        this.unitRent = detail?.rent || 0;
        this.unitSqft = detail?.sqft || 0;
        this.inspectorTab = 'occupants';
      }
    }
  }

  executeMerge() {
    if (this.pendingMerge.length < 2) return;
    const mergeGroups = (this.plotData.aptConfig?.mergeGroups || []).filter(g => !g.some(k => this.pendingMerge.includes(k)));
    this.onUpdatePlot.emit({
      key: this.plotKey,
      updates: { aptConfig: { ...this.plotData.aptConfig!, mergeGroups: [...mergeGroups, [...this.pendingMerge]] } }
    });
    this.pendingMerge = [];
    this.selectedUnit = null;
  }

  splitUnit(id: string) {
    const mergeGroups = (this.plotData.aptConfig?.mergeGroups || []).filter(g => !g.includes(id));
    this.onUpdatePlot.emit({
      key: this.plotKey,
      updates: { aptConfig: { ...this.plotData.aptConfig!, mergeGroups } }
    });
    this.selectedUnit = null;
  }

  getShopCount(): number {
    return Object.keys(this.plotData.aptConfig?.unitShops || {}).length;
  }

  onDropOnUnit(unitId: string) {
    if (!this.dragShop) return;
    const unitShops = { ...(this.plotData.aptConfig?.unitShops || {}), [unitId]: this.dragShop };
    this.onUpdatePlot.emit({
      key: this.plotKey,
      updates: { aptConfig: { ...this.plotData.aptConfig!, unitShops } }
    });
    this.dragShop = null;
  }

  removeShop(unitId: string) {
    const unitShops = { ...(this.plotData.aptConfig?.unitShops || {}) };
    delete unitShops[unitId];
    this.onUpdatePlot.emit({
      key: this.plotKey,
      updates: { aptConfig: { ...this.plotData.aptConfig!, unitShops } }
    });
  }

  isMergePrimary(id: string): boolean {
    return !!this.plotData.aptConfig?.mergeGroups?.find(g => g.includes(id) && g[0] === id);
  }

  isMergeSecondary(id: string): boolean {
    return !!this.plotData.aptConfig?.mergeGroups?.find(g => g.includes(id) && g[0] !== id);
  }

  getMergeSpan(id: string): number {
    const g = this.plotData.aptConfig?.mergeGroups?.find(g => g.includes(id));
    return g ? g.length : 1;
  }

  getMergedWidth(id: string): string {
    const span = this.getMergeSpan(id);
    // each unit = 5rem wide, gap = 0.75rem between units
    return span > 1 ? `${5 * span + 0.75 * (span - 1)}rem` : '5rem';
  }

  getMergeLabel(id: string): string {
    const g = this.plotData.aptConfig?.mergeGroups?.find(gr => gr.includes(id));
    return g ? g.map(k => (this.plotData.aptConfig?.unitNames?.[k] || k)).join('+') : id;
  }

  getUnitClass(id: string): string {
    const isSkipped = this.isUnitSkipped(id);
    const isSelected = this.selectedUnit === id;
    const isOccupied = this.isUnitOccupied(id);
    const hasShop = this.isShopUnit(id);
    const isPending = this.pendingMerge.includes(id);

    const base = 'w-20 h-24 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col items-center justify-center gap-0.5 ';

    if (isPending) return base + 'bg-purple-500/20 border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.3)] scale-105 z-10';
    if (isSelected) return base + 'bg-select/20 border-select shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-110 z-10';
    if (isSkipped) return base + 'bg-slate-900/60 border-dashed border-white/20 opacity-40 hover:opacity-70';
    if (hasShop) return base + 'bg-blue-600/25 border-blue-400/60 hover:border-blue-400 hover:bg-blue-600/35 hover:scale-105';
    if (isOccupied) return base + 'bg-house/15 border-house/40 hover:border-house/70 hover:scale-105';
    return base + 'bg-slate-800/80 border-slate-600/40 hover:border-slate-400/60 hover:bg-slate-700/80 hover:scale-105';
  }

  toggleFacility(f: string) {
    const facilities = this.plotData.aptConfig!.facilities.includes(f)
      ? this.plotData.aptConfig!.facilities.filter(x => x !== f)
      : [...this.plotData.aptConfig!.facilities, f];
    this.onUpdatePlot.emit({
      key: this.plotKey,
      updates: { aptConfig: { ...this.plotData.aptConfig!, facilities } }
    });
  }

  toggleSkipUnit(id: string | null) {
    if (!id) return;
    const skippedUnits = this.plotData.aptConfig?.skippedUnits || [];
    const updated = skippedUnits.includes(id)
      ? skippedUnits.filter(x => x !== id)
      : [...skippedUnits, id];
    this.onUpdatePlot.emit({
      key: this.plotKey,
      updates: { aptConfig: { ...this.plotData.aptConfig!, skippedUnits: updated } }
    });
  }

  setUnitBhk(id: string | null, bhk: string) {
    if (!id) return;
    const unitBhk = { ...(this.plotData.aptConfig?.unitBhk || {}), [id]: bhk };
    this.onUpdatePlot.emit({
      key: this.plotKey,
      updates: { aptConfig: { ...this.plotData.aptConfig!, unitBhk } }
    });
  }

  saveUnitDetail() {
    if (!this.selectedUnit) return;
    const unitDetails = { ...(this.plotData.aptConfig?.unitDetails || {}) };
    unitDetails[this.selectedUnit] = { rent: this.unitRent, sqft: this.unitSqft };
    this.onUpdatePlot.emit({
      key: this.plotKey,
      updates: { aptConfig: { ...this.plotData.aptConfig!, unitDetails } }
    });
  }

  onShopDragStart(shopValue: string) {
    this.dragShop = shopValue;
  }
}
