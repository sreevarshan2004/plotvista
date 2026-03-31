import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlotData } from '../../../types';

@Component({
  selector: 'app-plot-cell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- SPLIT VIEW -->
    <div
      *ngIf="data?.splitDirection; else normalView"
      (contextmenu)="onContextMenu($event)"
      [class]="'plot-cell split-cell ' + customClass"
      [ngClass]="{ 'selected': isSelected && !selectedHalf, 'w-full h-full': isLarge }"
    >
      <div [class]="'split-container ' + (data?.splitDirection === 'v' ? 'split-h' : 'split-v')">
        <!-- HALF A -->
        <div
          class="split-half split-half-a"
          [ngClass]="{ 'selected': isSelected && selectedHalf === 'a', 'has-data': data?.splitData?.a?.type !== 'vacant' }"
          (click)="onSplitClick.emit('a'); $event.stopPropagation()"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event, 'a')"
        >
          <div class="split-half-inner" *ngIf="data?.splitData?.a?.type !== 'road'">
            <div *ngIf="data?.splitData?.a?.type && data?.splitData?.a?.type !== 'vacant'" class="split-icon">
              {{ data?.splitData?.a?.type === 'shop' ? getShopEmoji(data?.splitData?.a?.shopType) : getTypeIcon(data?.splitData?.a?.type) }}
            </div>
            <div class="split-label">{{ data?.splitData?.a?.name || (data?.splitDirection === 'v' ? 'LEFT' : 'TOP') }}</div>
            <div *ngIf="data?.splitData?.a?.type && data?.splitData?.a?.type !== 'vacant'" class="split-type">
              {{ data?.splitData?.a?.type === 'shop' ? (data?.splitData?.a?.name || 'Shop') : data?.splitData?.a?.type }}
            </div>
            <div *ngIf="data?.splitData?.a?.residents?.length" class="split-resident-name">
              {{ data?.splitData?.a?.residents?.[0]?.name }}
            </div>
            <div *ngIf="data?.splitData?.a?.residents?.length" class="split-resident-badge">
              {{ data?.splitData?.a?.residents?.length }}
            </div>
          </div>
          <div *ngIf="data?.splitData?.a?.type === 'road'" class="absolute inset-0 flex items-center justify-center plot-3d-road border border-white/5">
            <input type="text"
              [ngModel]="data?.splitData?.a?.name"
              (ngModelChange)="onNameChange.emit({half: 'a', name: $event})"
              (click)="$event.stopPropagation()"
              class="bg-transparent text-[8px] font-mono text-white/50 text-center uppercase tracking-[0.2em] w-[90%] outline-none focus:text-white"
              placeholder="ROAD"
            />
          </div>
        </div>
        <div class="split-divider"></div>
        <!-- HALF B -->
        <div
          class="split-half split-half-b"
          [ngClass]="{ 'selected': isSelected && selectedHalf === 'b', 'has-data': data?.splitData?.b?.type !== 'vacant' }"
          (click)="onSplitClick.emit('b'); $event.stopPropagation()"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event, 'b')"
        >
          <div class="split-half-inner" *ngIf="data?.splitData?.b?.type !== 'road'">
            <div *ngIf="data?.splitData?.b?.type && data?.splitData?.b?.type !== 'vacant'" class="split-icon">
              {{ data?.splitData?.b?.type === 'shop' ? getShopEmoji(data?.splitData?.b?.shopType) : getTypeIcon(data?.splitData?.b?.type) }}
            </div>
            <div class="split-label">{{ data?.splitData?.b?.name || (data?.splitDirection === 'v' ? 'RIGHT' : 'BOTTOM') }}</div>
            <div *ngIf="data?.splitData?.b?.type && data?.splitData?.b?.type !== 'vacant'" class="split-type">
              {{ data?.splitData?.b?.type === 'shop' ? (data?.splitData?.b?.name || 'Shop') : data?.splitData?.b?.type }}
            </div>
            <div *ngIf="data?.splitData?.b?.residents?.length" class="split-resident-name">
              {{ data?.splitData?.b?.residents?.[0]?.name }}
            </div>
            <div *ngIf="data?.splitData?.b?.residents?.length" class="split-resident-badge">
              {{ data?.splitData?.b?.residents?.length }}
            </div>
          </div>
          <div *ngIf="data?.splitData?.b?.type === 'road'" class="absolute inset-0 flex items-center justify-center plot-3d-road border border-white/5">
            <input type="text"
              [ngModel]="data?.splitData?.b?.name"
              (ngModelChange)="onNameChange.emit({half: 'b', name: $event})"
              (click)="$event.stopPropagation()"
              class="bg-transparent text-[8px] font-mono text-white/50 text-center uppercase tracking-[0.2em] w-[90%] outline-none focus:text-white"
              placeholder="ROAD"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- NORMAL VIEW -->
    <ng-template #normalView>
      <div
        (click)="onClick.emit()"
        (contextmenu)="onContextMenu($event)"
        (dragover)="onDragOver($event)"
        (drop)="onDrop($event, null)"
        [class]="'plot-cell group ' + getPlotClass() + ' ' + customClass"
        [ngClass]="{
          'selected': isSelected,
          'w-full h-full': isLarge,
          'road-joint': data?.type === 'road'
        }"
      >
        <!-- Truly vacant, no residents -->
        <div *ngIf="!data?.residents?.length && (!data || data.type === 'vacant')" class="opacity-30 flex flex-col items-center">
          <div class="text-[8px] font-black uppercase tracking-widest text-slate-500">Vacant</div>
          <div class="text-[10px] text-slate-400">{{ plotKey }}</div>
        </div>

        <!-- Typed plot (house, apt, park, etc.) -->
        <div *ngIf="data && data.type !== 'road' && data.type !== 'vacant'" class="flex flex-col items-center justify-center text-center p-2 relative w-full h-full">
          <div class="text-base mb-0.5">{{ data.type === 'shop' ? getShopEmoji(data.shopType) : getTypeIcon(data.type) }}</div>
          <div class="text-[9px] font-black uppercase tracking-tighter text-white truncate w-full px-1">
            {{ data.name || data.type }}
          </div>
          <!-- first resident name -->
          <div *ngIf="data.residents.length > 0" class="text-[8px] text-slate-300 truncate w-full px-1 mt-0.5">
            {{ data.residents[0].name }}
          </div>
          <div *ngIf="data.residents.length > 0" class="absolute -top-1 -right-1 bg-accent text-slate-900 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg border border-white/20">
            {{ data.residents.length }}
          </div>
        </div>

        <!-- Vacant plot WITH residents -->
        <div *ngIf="data?.residents?.length && (!data || data.type === 'vacant')" class="flex flex-col items-center justify-center text-center p-1 w-full h-full relative">
          <div class="text-base mb-0.5">&#128100;</div>
          <div class="text-[8px] font-black text-white truncate w-full px-1">{{ data?.residents?.[0]?.name }}</div>
          <div class="text-[7px] uppercase tracking-wide mt-0.5"
            [class]="data?.residents?.[0]?.role === 'owner' ? 'text-house' : 'text-apt'">
            {{ data?.residents?.[0]?.role }}
          </div>
          <div class="absolute -top-1 -right-1 bg-accent text-slate-900 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg border border-white/20">
            {{ data?.residents?.length }}
          </div>
        </div>

        <!-- Hover Overlay for SQFT Input -->
        <div *ngIf="!data || data.type !== 'road'" 
             class="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none group-hover:pointer-events-auto border border-accent/20 rounded-xl shadow-lg">
          <label class="text-[8px] font-black uppercase tracking-widest text-slate-800 mb-1">Area SQFT</label>
          <input type="number" 
            [ngModel]="data?.sqft" 
            (ngModelChange)="onSqftChange.emit($event)" 
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
            class="text-xs bg-slate-100 text-slate-900 font-extrabold font-mono border border-slate-200 rounded-lg px-2 py-1.5 w-20 text-center focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm transition-all" 
            placeholder="sqft" />
        </div>

        <!-- Road -->
        <div *ngIf="data?.type === 'road'" class="absolute inset-0 flex items-center justify-center overflow-visible plot-3d-road road-block">
          <!-- Road Base layer for always-dark effect -->
          <div class="absolute inset-0 bg-[#64748b]"></div>
          
          <!-- Dashed lines based on connectivity -->
          <!-- Vertical Lane lines -->
          <!-- Vertical Lane lines (Sleek 2px, Cleaner 60px Dashes) -->
          <div *ngIf="(data?.roadDirection === 'v' || (roadConnectivity?.top || roadConnectivity?.bottom))" 
            class="h-full w-[2px] pointer-events-none z-[1] mx-auto" 
            [style.background-image]="'linear-gradient(to bottom, #fbbf24 50%, transparent 50%)'" 
            [style.background-size]="'2px 60px'"></div>
          
          <!-- Horizontal Lane lines (Sleek 2px, Cleaner 60px Dashes) -->
          <div *ngIf="(data?.roadDirection === 'h' || !data?.roadDirection || (roadConnectivity?.left || roadConnectivity?.right))" 
            class="w-full h-[2px] absolute top-1/2 -translate-y-1/2 pointer-events-none z-[1]" 
            [style.background-image]="'linear-gradient(to right, #fbbf24 50%, transparent 50%)'" 
            [style.background-size]="'60px 2px'"></div>
          
          <!-- Road Name Input - Mastered Auto-Growing Layout (Direction Aware) -->
          <div *ngIf="data?.name && data?.name !== 'STREET'" 
            [class]="'absolute inset-0 flex items-center justify-center z-[50] m-auto bg-slate-900 border border-white/20 rounded-full shadow-2xl transition-all duration-300 ' + 
                     (data?.roadDirection === 'v' ? 'flex-col w-fit h-fit min-h-[100px] max-h-[280px] px-1.5 py-4' : 'flex-row w-fit h-fit min-w-[100px] max-w-[280px] px-4 py-1.5')">
            
            <div [class]="'flex items-center gap-2 w-full ' + (data?.roadDirection === 'v' ? 'flex-col grow' : 'flex-row')">
              <!-- Constant Icon -->
              <span class="text-[10px] opacity-80 shrink-0 pointer-events-none self-center">🛣️</span>
              
              <!-- Dynamic Growing Text Area -->
              <div [class]="'relative flex-1 flex items-center justify-center ' + (data?.roadDirection === 'v' ? 'min-h-[40px] w-full' : 'min-w-[40px] h-full')">
                <!-- Invisible measurement layer -->
                <span class="text-[10px] font-mono font-black uppercase tracking-widest invisible px-1" 
                  [style]="(data?.roadDirection === 'v' ? 'writing-mode: vertical-rl; overflow: hidden; width: 0;' : 'white-space: pre;') + ' color: white !important;'">{{data?.name || ''}}</span>
                
                <!-- Input Layer -->
                <input type="text" 
                  [ngModel]="data?.name" 
                  (ngModelChange)="onNameChange.emit({half: null, name: $event})" 
                  (click)="$event.stopPropagation()" 
                  (keydown)="$event.stopPropagation()" 
                  class="absolute inset-0 w-full h-full text-[10px] font-mono font-black uppercase tracking-widest bg-transparent border-none outline-none text-center focus:outline-none transition-all" 
                  [style]="(data?.roadDirection === 'v' ? 'writing-mode: vertical-rl;' : '') + ' color: white !important; -webkit-text-fill-color: white !important; font-weight: 900; caret-color: white;'"
                  placeholder="STREET" />
              </div>
            </div>
          </div>

          <!-- CONNECTIVITY BORDER HIDING (Simplified via CSS shadow or absolute overlays if needed) -->
          <div *ngIf="roadConnectivity?.top" class="absolute top-0 left-0 right-0 h-[1px] bg-[#0a0c10] z-[1]"></div>
          <div *ngIf="roadConnectivity?.bottom" class="absolute bottom-0 left-0 right-0 h-[1px] bg-[#0a0c10] z-[1]"></div>
          <div *ngIf="roadConnectivity?.left" class="absolute top-0 bottom-0 left-0 w-[1px] bg-[#0a0c10] z-[1]"></div>
          <div *ngIf="roadConnectivity?.right" class="absolute top-0 bottom-0 right-0 w-[1px] bg-[#0a0c10] z-[1]"></div>
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotCellComponent {
  @Input() plotKey = '';
  @Input() data?: PlotData;
  @Input() isSelected = false;
  @Input() selectedHalf: 'a' | 'b' | null = null;
  @Input() isLarge = false;
  @Input() customClass = '';
  @Input() roadConnectivity: { top: boolean, bottom: boolean, left: boolean, right: boolean } | null = null;
  @Output() onClick = new EventEmitter<void>();
  @Output() onRightClick = new EventEmitter<MouseEvent>();
  @Output() onSplitClick = new EventEmitter<'a' | 'b'>();
  @Output() onSqftChange = new EventEmitter<number>();
  @Output() onNameChange = new EventEmitter<{ half: 'a' | 'b' | null, name: string }>();
  @Output() onDropType = new EventEmitter<{ half: 'a' | 'b' | null, event: DragEvent }>();

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, half: 'a' | 'b' | null) {
    event.preventDefault();
    this.onDropType.emit({ half, event });
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    this.onRightClick.emit(event);
  }

  getShopEmoji(shopType?: string): string {
    const map: Record<string, string> = {
      grocery: '🛒', gym: '🏋️', playstation: '🎮', pharmacy: '💊',
      restaurant: '🍽️', bakery: '🥐', salon: '💈', laundry: '🧺',
      stationery: '📚', tailoring: '🧵', clinic: '🩺', atm: '🏧'
    };
    return shopType ? (map[shopType] || '🏪') : '🏪';
  }

  getTypeIcon(type?: string): string {
    switch (type) {
      case 'house': return '🏠';
      case 'apartment': return '🏢';
      case 'shop': return '🏪';
      case 'park': return '🌳';
      case 'watertank': return '🛢️';
      case 'hospital': return '🏥';
      case 'road': return '🛣️';
      default: return '';
    }
  }

  getPlotClass() {
    if (!this.data) return '';
    switch (this.data.type) {
      case 'house': return 'plot-3d-house';
      case 'apartment': return 'plot-3d-apt';
      case 'watertank': return 'plot-3d-tank';
      case 'hospital': return 'plot-3d-clinic';
      case 'park': return 'plot-3d-park';
      case 'road': return 'plot-3d-road';
      case 'vacant': return 'plot-vacant';
      default: return 'plot-vacant';
    }
  }
}
