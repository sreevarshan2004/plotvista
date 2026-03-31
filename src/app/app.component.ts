import { Component, computed, signal, ChangeDetectionStrategy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from './state.service';
import { PlotCellComponent } from './components/plot-cell/plot-cell.component';
import { AptModalComponent } from './components/apt-modal/apt-modal.component';
import { ResModalComponent } from './components/res-modal/res-modal.component';
import { AptDetailModalComponent } from './components/apt-detail-modal/apt-detail-modal.component';
import { PlotType, AptConfig, Resident, PlotData, ProjectMeta } from '../types';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotCellComponent, AptModalComponent, ResModalComponent, AptDetailModalComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  hStreets = 3;
  vStreets = 3;
  plotsPerBlock = 3;
  searchTerm = '';

  hStreetNames = computed(() => this.stateService.state().hStreetNames || ['Maple Avenue', 'Birch Lane', 'Cedar Boulevard', 'Oakwood Drive', 'Elm Street', 'Rosewood Path']);
  vStreetNames = computed(() => this.stateService.state().vStreetNames || ['Gold Crescent', 'Silver Close', 'Diamond Road', 'Pearl Way', 'Emerald Row', 'Sapphire Drive']);

  updateStreetName(type: 'h' | 'v', index: number, name: string) {
    this.stateService.saveState();
    this.stateService.updateStreetName(type, index, name);
  }

  isProjectInfoOpen = false;
  isAptModalOpen = false;
  isAptDetailOpen = false;
  isResModalOpen = false;
  isDetailModalOpen = false;
  isShopPickerOpen = false;
  isSidebarOpen = signal(true);
  classificationOpen = signal(false);
  shopPickerKey = '';
  resModalRole: 'owner' | 'tenant' = 'owner';

  // Drag and Drop State
  draggedType: PlotType | null = null;
  draggedRoadDirection: 'h' | 'v' | undefined = undefined;

  onDragStart(event: DragEvent, type: PlotType, direction?: 'h' | 'v') {
    this.draggedType = type;
    this.draggedRoadDirection = direction;
    // Set a ghost image or just text
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', type);

      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Required to allow drop
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent, key: string, half: 'a' | 'b' | null = null) {
    event.preventDefault();
    if (!this.draggedType) return;

    // Select the plot/half first to ensure setPlotType hits the right target
    this.stateService.selectPlot(key, half);
    this.setPlotType(key, this.draggedType, this.draggedRoadDirection);

    // Clear drag state
    this.draggedType = null;
    this.draggedRoadDirection = undefined;
  }

  readonly shopOptions = [
    { value: 'grocery', label: 'Grocery Store', emoji: '🛒', category: 'Food & Daily' },
    { value: 'gym', label: 'Gym', emoji: '🏋️', category: 'Fitness' },
    { value: 'playstation', label: 'PlayStation', emoji: '🎮', category: 'Gaming' },
    { value: 'pharmacy', label: 'Pharmacy', emoji: '💊', category: 'Health' },
    { value: 'restaurant', label: 'Restaurant', emoji: '🍽️', category: 'Food' },
    { value: 'bakery', label: 'Bakery', emoji: '🥐', category: 'Food' },
    { value: 'salon', label: 'Salon / Spa', emoji: '💈', category: 'Beauty' },
    { value: 'laundry', label: 'Laundry', emoji: '🧺', category: 'Services' },
    { value: 'stationery', label: 'Stationery', emoji: '📚', category: 'Education' },
    { value: 'tailoring', label: 'Tailoring', emoji: '🧵', category: 'Services' },
    { value: 'clinic', label: 'Mini Clinic', emoji: '🩺', category: 'Health' },
    { value: 'atm', label: 'ATM / Bank', emoji: '🏧', category: 'Finance' },
  ];

  openShopPicker(key: string) {
    this.shopPickerKey = key;
    // preserve selectedHalf when opening shop picker for a split cell
    const currentHalf = this.selectedHalf();
    this.stateService.selectPlot(key, currentHalf);
    this.isShopPickerOpen = true;
  }

  confirmShopType(shopType: string) {
    const key = this.shopPickerKey;
    if (!key) return;
    this.stateService.saveState();
    const half = this.selectedHalf();
    const currentData = half
      ? this.plots()[key]?.splitData?.[half]
      : this.plots()[key];
    this.stateService.updatePlot(key, {
      type: 'shop',
      shopType,
      name: this.shopOptions.find(o => o.value === shopType)?.label,
      residents: currentData?.residents || []
    });
    this.isShopPickerOpen = false;
  }

  getShopOption(value: string) {
    return this.shopOptions.find(o => o.value === value);
  }

  // ── MERGE ──────────────────────────────────────────────
  pendingMerge: string[] = [];
  isCtrlHeld = false;
  mergeGroups = computed(() => this.state().mergeGroups || []);

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Control') this.isCtrlHeld = true;
    if (e.key === 'Escape') { this.pendingMerge = []; this.isCtrlHeld = false; }
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    if (e.key !== 'Control') return;
    this.isCtrlHeld = false;
    if (this.pendingMerge.length >= 2) this.executeMerge();
    else this.pendingMerge = [];
  }

  executeMerge() {
    if (this.pendingMerge.length < 2) return;
    this.stateService.saveState();
    this.stateService.mergePlots([...this.pendingMerge]);
    this.pendingMerge = [];
  }

  unmerge(key: string) { this.stateService.saveState(); this.stateService.unmerge(key); }

  // Cell size signals
  zoom = signal(1.0);
  CELL = computed(() => 96 * this.zoom());
  ROAD = computed(() => 64 * this.zoom());

  zoomIn() { if (this.zoom() < 2.0) this.zoom.update(z => +(z + 0.1).toFixed(1)); }
  zoomOut() { if (this.zoom() > 0.4) this.zoom.update(z => +(z - 0.1).toFixed(1)); }
  resetZoom() { this.zoom.set(1.0); }

  // Convert a plot key to its pixel top-left position on the canvas
  getCellPixelPos(key: string): { x: number; y: number; w: number; h: number } | null {
    const m = key.match(/r(\d+)c(\d+)pr(\d+)pc(\d+)/);
    if (!m) return null;
    const r = +m[1], c = +m[2], pr = +m[3], pc = +m[4];
    const C = this.CELL(), R = this.ROAD();
    // x = sum of blocks before column c (each block = plotsPerBlock*C) + roads between blocks + pc*C
    const x = c * (this.plotsPerBlock * C + R) + pc * C;
    // y = sum of blocks before row r + roads between blocks + pr*C
    const y = r * (this.plotsPerBlock * C + R) + pr * C;
    return { x, y, w: C, h: C };
  }

  // Compute the bounding rectangle for a merge group
  getMergeRect(group: string[]): { x: number; y: number; w: number; h: number } | null {
    const positions = group.map(k => this.getCellPixelPos(k)).filter(Boolean) as { x: number; y: number; w: number; h: number }[];
    if (!positions.length) return null;
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x + p.w));
    const maxY = Math.max(...positions.map(p => p.y + p.h));
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  getMergeGroupOf(key: string): string[] | null {
    return this.mergeGroups().find(g => g.includes(key)) || null;
  }

  isMergePrimary(key: string): boolean {
    const g = this.getMergeGroupOf(key); return !!g && g[0] === key;
  }

  isMergeSecondary(key: string): boolean {
    const g = this.getMergeGroupOf(key); return !!g && g[0] !== key;
  }

  // No longer needed for grid span — kept empty for template compat
  getMergeStyle(_key: string): { [k: string]: string } { return {}; }

  isPendingMerge(key: string) { return this.pendingMerge.includes(key); }

  roadStartKey = signal<string | null>(null);
  roadEndKey = signal<string | null>(null);

  isNightMode = true;

  toggleTheme() {
    if (this.isNightMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }


  state = this.stateService.state;
  selectedKey = computed(() => this.state().selectedKey);
  selectedHalf = computed(() => this.state().selectedHalf);
  plots = computed(() => this.state().plots);

  roadConnectivity = computed(() => {
    const p = this.plots();
    const conn: Record<string, { top: boolean, bottom: boolean, left: boolean, right: boolean }> = {};

    Object.keys(p).forEach(key => {
      if (p[key].type !== 'road') return;
      const coords = this.parseKey(key);
      if (!coords) return;
      const { globalR, globalC } = coords;

      conn[key] = {
        top: p[this.createKeyFromGlobal(globalR - 1, globalC)]?.type === 'road',
        bottom: p[this.createKeyFromGlobal(globalR + 1, globalC)]?.type === 'road',
        left: p[this.createKeyFromGlobal(globalR, globalC - 1)]?.type === 'road',
        right: p[this.createKeyFromGlobal(globalR, globalC + 1)]?.type === 'road'
      };
    });
    return conn;
  });

  selectedPlot = computed(() => {
    const key = this.selectedKey();
    const half = this.selectedHalf();
    const plot = key ? this.plots()[key] : null;
    if (plot?.splitDirection && half) {
      return plot.splitData?.[half] || null;
    }
    return plot;
  });

  stats = computed(() => {
    const s = this.state();
    const total = (this.hStreets + 1) * (this.vStreets + 1) * (this.plotsPerBlock * this.plotsPerBlock);
    let houses = 0, apts = 0, residents = 0;
    Object.values(s.plots).forEach((p: PlotData) => {
      if (p.type === 'house') houses++;
      if (p.type === 'apartment') apts++;
      residents += p.residents.length;
    });
    return { total, houses, apts, vacant: total - houses - apts, residents };
  });

  constructor(private stateService: StateService) { }

  ngOnInit() { this.loadHardcodedJson(); }

  loadHardcodedJson() {
    //json data
    const H = 2, V = 2, PSB = 2;
    const plots: Record<string, PlotData> = {};
    const k = (r: number, c: number, pr: number, pc: number) => `r${r}c${c}pr${pr}pc${pc}`;

    for (let r = 0; r <= H; r++) {
      for (let c = 0; c <= V; c++) {
        for (let pr = 0; pr < PSB; pr++) {
          for (let pc = 0; pc < PSB; pc++) {
            const key = k(r, c, pr, pc);

            // Distribution Logic
            if (r === 0 && c === 0) {
              // Block 0,0: Luxury Apartments
              plots[key] = {
                type: 'apartment',
                name: `Prestige Tower ${String.fromCharCode(65 + pr * PSB + pc)}`,
                residents: [],
                aptConfig: {
                  floors: 12,
                  unitsPerFloor: 6,
                  blockName: `Tower ${String.fromCharCode(65 + pr * PSB + pc)}`,
                  facilities: ['GYM', 'SWIMMING POOL', 'CLUBHOUSE', 'CCTV 24/7', 'EV CHARGING', 'KIDS PLAY AREA', 'MINI THEATER', 'JOGGING TRACK', 'GAZEBO'],
                  defaultBhk: '3 BHK',
                  unitNames: { '1A': 'PENTHOUSE-01' }
                }
              };
            } else if (r === 0 && c === 1) {
              // Block 0,1: Luxury Villas
              plots[key] = {
                type: 'house',
                name: `Signature Villa #${(pr * PSB + pc + 1).toString().padStart(3, '0')}`,
                price: 32000000,
                sqft: 4200,
                residents: []
              };
            } else if (r === 1 && c === 0) {
              // Block 1,0: Utilities (Tank & Park)
              if (pr === 1 && pc === 1) {
                plots[key] = { type: 'watertank', name: 'MAIN WATER RESERVOIR', residents: [] };
              } else if (pr === 1) {
                plots[key] = { type: 'watertank', name: 'AUX TANK ' + pc, residents: [] };
              } else {
                plots[key] = { type: 'park', name: 'GREEN ZONE ' + (pr * PSB + pc), residents: [] };
              }
            } else if (r === 1 && c === 1) {
              // Block 1,1: Commercial Hub
              const shopIdx = (pr * PSB + pc) % this.shopOptions.length;
              const shop = this.shopOptions[shopIdx];
              plots[key] = {
                type: 'shop',
                shopType: shop.value,
                name: `Prestige ${shop.label}`,
                residents: []
              };
            } else {
              // Other blocks: Mixed Residential
              if ((pr + pc) % 2 === 0) {
                plots[key] = {
                  type: 'house',
                  name: `Villa ${r}${c}-${pr}${pc}`,
                  price: 18000000,
                  sqft: 2400,
                  residents: []
                };
              } else {
                plots[key] = { type: 'park', name: 'COMMUNITY PARK', residents: [] };
              }
            }
          }
        }
      }
    }

    this.hStreets = H;
    this.vStreets = V;
    this.plotsPerBlock = PSB;

    const projectMeta: ProjectMeta = {
      totalLandArea: '10,000 SQ.MTS',
      netPlotArea: '9,800 SQ.MTS',
      plottedArea: '7,000 SQ.MTS (71%)',
      roadArea: '2,000 SQ.MTS (20%)',
      openArea: '500 SQ.MTS (5%)',
      utilityArea: '300 SQ.MTS (3%)',
      civicAmenities: '200 SQ.MTS (2%)',
      totalPlots: 144
    };

    this.stateService.state.update(s => ({
      ...s,
      plots,
      hStreets: H,
      vStreets: V,
      plotsPerBlock: PSB,
      projectMeta,
      hStreetNames: ['Maple Avenue', 'Birch Lane', 'Cedar Boulevard', 'Oakwood Drive', 'Elm Street', 'Rosewood Path', 'Willow Walk', 'Jasmine Court'],
      vStreetNames: ['Gold Crescent', 'Silver Close', 'Diamond Road', 'Pearl Way', 'Emerald Row', 'Sapphire Drive', 'Ruby Street', 'Ivory Lane']
    }));

    console.log("THE NEW 3x3x3 LAYOUT JSON:", JSON.stringify({ global: { H, V, PSB }, hStreetNames: this.hStreetNames(), vStreetNames: this.vStreetNames(), projectMeta, plots }, null, 2));

    this.stateService.saveState();
  }

  @HostListener('document:click')
  closeDetailOnOutside() { }

  onPlotRightClick(event: MouseEvent, key: string, data: PlotData) {
    event.preventDefault();
    event.stopPropagation();
    this.stateService.selectPlot(key);
    this.resModalRole = 'owner';
    this.isResModalOpen = true;
  }

  getResident(data: PlotData | null | undefined, role: 'owner' | 'tenant'): Resident | undefined {
    return data?.residents?.find(r => r.role === role);
  }

  generateLayout() {
    this.stateService.saveState();
    this.stateService.selectPlot(null);
    this.stateService.state.update(s => ({ ...s, plots: {} }));
  }

  resetLayout() {
    this.stateService.saveState();
    this.stateService.state.update(s => ({ ...s, plots: {}, selectedKey: null }));
  }

  undo() { this.stateService.undo(); }

  canUndo = computed(() => this.stateService.undoStack().length > 0);

  setPlotType(key: string, type: PlotType, direction?: 'h' | 'v') {
    if (type === 'apartment') { this.isAptModalOpen = true; return; }
    this.stateService.saveState();
    const plot = this.plots()[key];
    const half = this.selectedHalf();
    const targetData = (plot?.splitDirection && half) ? plot.splitData?.[half] : plot;

    const group = this.getMergeGroupOf(key);
    const isMerged = !!group;
    const displayName = isMerged ? `Merged ${type.charAt(0).toUpperCase() + type.slice(1)}` :
      (type === 'house' ? (half ? `${half.toUpperCase()} House ${key.replace('r', '').replace('c', '-').replace('pr', '-').replace('pc', '-')}` : `House ${key.replace('r', '').replace('c', '-').replace('pr', '-').replace('pc', '-')}`) : undefined);

    this.stateService.updatePlot(key, {
      type,
      residents: type === 'road' ? [] : (targetData?.residents || []),
      price: type === 'house' ? 6000 : undefined,
      sqft: type === 'house' ? 1200 : (isMerged ? 2400 : undefined),
      name: displayName,
      roadDirection: type === 'road' ? direction : undefined
    } as any);
  }

  updateCellName(key: string, event: { half: 'a' | 'b' | null, name: string }) {
    this.stateService.saveState();
    if (event.half) {
      const plot = this.plots()[key];
      if (plot?.splitDirection) {
        const splitData = { ...plot.splitData! };
        splitData[event.half] = { ...splitData[event.half], name: event.name };
        this.stateService.state.update(s => ({ ...s, plots: { ...s.plots, [key]: { ...plot, splitData } } }));
      }
    } else {
      this.stateService.updatePlot(key, { name: event.name });
    }
  }

  updatePlotDetails(key: string, updates: Partial<PlotData>) {
    this.stateService.updatePlot(key, updates);
  }

  updateSqft(key: string, sqft: number) {
    this.stateService.saveState();
    this.stateService.updatePlot(key, { sqft });
  }

  handleAptConfirm(config: AptConfig) {
    const key = this.selectedKey();
    if (!key) return;
    this.stateService.saveState();
    this.stateService.updatePlot(key, { type: 'apartment', aptConfig: config, residents: this.plots()[key]?.residents || [] });
    this.isAptModalOpen = false;
  }

  handleResSave(resident: Resident) {
    const key = this.selectedKey();
    if (!key) return;
    this.stateService.saveState();
    this.stateService.addResident(key, resident);
    this.isResModalOpen = false;
  }

  deleteResident(key: string, idx: number) {
    const plot = this.plots()[key];
    if (!plot) return;
    this.stateService.saveState();
    const newResidents = [...plot.residents];
    newResidents.splice(idx, 1);
    this.stateService.updatePlot(key, { residents: newResidents });
  }

  fillBlockWithParks() { this.fillBlockWithType('park'); }
  fillBlockWithRoads() { this.fillBlockWithType('road'); }

  private fillBlockWithType(type: PlotType) {
    const key = this.selectedKey();
    if (!key) return;
    const match = key.match(/r(\d+)c(\d+)/);
    if (!match) return;
    this.stateService.saveState();
    const r = match[1], c = match[2];
    for (let pr = 0; pr < this.plotsPerBlock; pr++)
      for (let pc = 0; pc < this.plotsPerBlock; pc++)
        this.stateService.updatePlot(`r${r}c${c}pr${pr}pc${pc}`, { type, residents: [] });
  }

  addMiddleRoadsToSelectedBlock() {
    const key = this.selectedKey();
    if (!key) return;
    const match = key.match(/r(\d+)c(\d+)/);
    if (!match) return;
    this.stateService.saveState();
    const r = parseInt(match[1]), c = parseInt(match[2]);
    const mid = Math.floor(this.plotsPerBlock / 2);
    for (let pr = 0; pr < this.plotsPerBlock; pr++)
      this.stateService.updatePlot(`r${r}c${c}pr${pr}pc${mid}`, { type: 'road', residents: [], roadDirection: 'v' });
    for (let pc = 0; pc < this.plotsPerBlock; pc++)
      this.stateService.updatePlot(`r${r}c${c}pr${mid}pc${pc}`, { type: 'road', residents: [], roadDirection: 'h' });
  }

  fillRowWithRoads() {
    const key = this.selectedKey();
    if (!key) return;
    const match = key.match(/r(\d+)c(\d+)pr(\d+)pc(\d+)/);
    if (!match) return;
    this.stateService.saveState();
    const r = match[1], pr = match[3];
    for (let c = 0; c <= this.vStreets; c++)
      for (let pc = 0; pc < this.plotsPerBlock; pc++)
        this.stateService.updatePlot(`r${r}c${c}pr${pr}pc${pc}`, { type: 'road', residents: [], roadDirection: 'h' });
  }

  fillColWithRoads() {
    const key = this.selectedKey();
    if (!key) return;
    const match = key.match(/r(\d+)c(\d+)pr(\d+)pc(\d+)/);
    if (!match) return;
    this.stateService.saveState();
    const c = match[2], pc = match[4];
    for (let r = 0; r <= this.hStreets; r++)
      for (let pr = 0; pr < this.plotsPerBlock; pr++)
        this.stateService.updatePlot(`r${r}c${c}pr${pr}pc${pc}`, { type: 'road', residents: [], roadDirection: 'v' });
  }

  fillCrossWithRoads() { this.fillRowWithRoads(); this.fillColWithRoads(); }

  addMiddleRoadsToAll() {
    this.stateService.saveState();
    const mid = Math.floor(this.plotsPerBlock / 2);
    for (let r = 0; r <= this.hStreets; r++)
      for (let c = 0; c <= this.vStreets; c++) {
        for (let pr = 0; pr < this.plotsPerBlock; pr++)
          this.stateService.updatePlot(`r${r}c${c}pr${pr}pc${mid}`, { type: 'road', residents: [], roadDirection: 'v' });
        for (let pc = 0; pc < this.plotsPerBlock; pc++)
          this.stateService.updatePlot(`r${r}c${c}pr${mid}pc${pc}`, { type: 'road', residents: [], roadDirection: 'h' });
      }
  }

  setRoadStart() { this.roadStartKey.set(this.selectedKey()); }
  setRoadEnd() { this.roadEndKey.set(this.selectedKey()); }

  drawPathRoad() {
    const start = this.roadStartKey(), end = this.roadEndKey();
    if (!start || !end) return;
    const s = this.parseKey(start), e = this.parseKey(end);
    if (!s || !e) return;
    this.stateService.saveState();
    for (let gc = Math.min(s.globalC, e.globalC); gc <= Math.max(s.globalC, e.globalC); gc++)
      this.stateService.updatePlot(this.createKeyFromGlobal(s.globalR, gc), { type: 'road', residents: [], roadDirection: 'h' });
    for (let gr = Math.min(s.globalR, e.globalR); gr <= Math.max(s.globalR, e.globalR); gr++)
      this.stateService.updatePlot(this.createKeyFromGlobal(gr, e.globalC), { type: 'road', residents: [], roadDirection: 'v' });
    this.roadStartKey.set(null);
    this.roadEndKey.set(null);
  }

  private parseKey(key: string) {
    const match = key.match(/r(\d+)c(\d+)pr(\d+)pc(\d+)/);
    if (!match) return null;
    const r = parseInt(match[1]), c = parseInt(match[2]), pr = parseInt(match[3]), pc = parseInt(match[4]);
    return { r, c, pr, pc, globalR: r * this.plotsPerBlock + pr, globalC: c * this.plotsPerBlock + pc };
  }

  private createKeyFromGlobal(gr: number, gc: number) {
    return `r${Math.floor(gr / this.plotsPerBlock)}c${Math.floor(gc / this.plotsPerBlock)}pr${gr % this.plotsPerBlock}pc${gc % this.plotsPerBlock}`;
  }

  clearPlot(key: string) {
    this.stateService.saveState();
    const half = this.selectedHalf();
    if (half) {
      this.stateService.state.update(s => {
        const plots = { ...s.plots };
        const plot = plots[key];
        if (plot && plot.splitDirection) {
          const splitData = { ...plot.splitData! };
          splitData[half] = { type: 'vacant', name: undefined, residents: [], shopType: undefined, price: undefined, sqft: undefined } as any;
          plots[key] = { ...plot, splitData };
        }
        return { ...s, plots };
      });
    } else {
      this.stateService.state.update(s => {
        const plots = { ...s.plots };
        delete plots[key];
        return { ...s, plots };
      });
    }
  }

  selectPlot(key: string, half: 'a' | 'b' | null = null) {
    if (this.isCtrlHeld) {
      if (this.pendingMerge.includes(key)) {
        this.pendingMerge = this.pendingMerge.filter(k => k !== key);
      } else {
        this.pendingMerge = [...this.pendingMerge, key];
      }
      return;
    }
    this.stateService.selectPlot(key, half);
    const plot = this.plots()[key];
    const hasData = plot && (plot.type !== 'vacant' && plot.type !== 'road') || (plot?.residents?.length ?? 0) > 0;
    if (hasData) this.isDetailModalOpen = true;
  }

  getMatchedCoords() {
    return Object.entries(this.plots())
      .filter(([_, data]) => this.searchTerm && data.name?.toLowerCase().includes(this.searchTerm.toLowerCase()))
      .map(([key]) => {
        const m = key.match(/r(\d+)c(\d+)/);
        return m ? { r: parseInt(m[1]), c: parseInt(m[2]) } : null;
      }).filter(Boolean);
  }

  isPlotMatched(key: string) {
    const plot = this.plots()[key];
    return this.searchTerm && plot?.name?.toLowerCase().includes(this.searchTerm.toLowerCase());
  }

  isBlockHighlighted(r: number, c: number) {
    return this.getMatchedCoords().some(coord => coord?.r === r && coord?.c === c);
  }

  isRoadHighlighted(r: number, c: number, type: 'h' | 'v') {
    const coords = this.getMatchedCoords();
    return type === 'v'
      ? coords.some(coord => coord?.c === c || coord?.c === c + 1)
      : coords.some(coord => coord?.r === r || coord?.r === r + 1);
  }

  isIntersectionHighlighted(r: number, c: number) {
    return this.isRoadHighlighted(r, c, 'h') || this.isRoadHighlighted(r, c, 'v');
  }

  getRange(n: number) { return Array(n + 1).fill(0).map((_, i) => i); }
  getSubRange(n: number) { return Array(n).fill(0).map((_, i) => i); }

  getBlockKeys(r: number, c: number) {
    const keys = [];
    for (let pr = 0; pr < this.plotsPerBlock; pr++)
      for (let pc = 0; pc < this.plotsPerBlock; pc++)
        keys.push(`r${r}c${c}pr${pr}pc${pc}`);
    return keys;
  }

  isAllParks(r: number, c: number) {
    return this.getBlockKeys(r, c).every(k => this.plots()[k]?.type === 'park');
  }

  splitPlot(key: string, direction: 'h' | 'v' = 'v') {
    this.stateService.saveState();
    this.stateService.splitPlot(key, direction);
  }

  unsplitPlot(key: string) {
    this.stateService.saveState();
    this.stateService.unsplitPlot(key);
  }

  handleSplitClick(key: string, half: 'a' | 'b') {
    this.stateService.selectPlot(key, half);
    const plot = this.plots()[key];
    const halfData = plot?.splitData?.[half];
    const hasData = halfData && (halfData.type !== 'vacant' || halfData.residents.length > 0);
    if (hasData) this.isDetailModalOpen = true;
  }

  isSplitCell(key: string): boolean {
    return !!this.plots()[key]?.splitDirection;
  }
}
