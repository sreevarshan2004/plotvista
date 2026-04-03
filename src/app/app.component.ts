import { Component, computed, signal, ChangeDetectionStrategy, OnInit, HostListener } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  isSidebarExtended = signal(false);
  sidebarStage = signal<0 | 1 | 2>(0); // 0=narrow, 1=wide, 2=full
  classificationOpen = signal(true);
  othersOpen = signal(true);
  shopPickerKey = '';
  resModalRole: 'owner' | 'tenant' = 'owner';
  layoutRotation = signal(0);
  compassRightPos = computed(() => {
    if (!this.isSidebarOpen()) return 32; // Standard margin when closed
    const stage = this.sidebarStage();
    const widths = [288, 480, 700];
    return widths[stage] + 32; // Offset by sidebar width plus margin
  });

  isContextMenuOpen = signal(false);
  contextMenuPos = { x: 0, y: 0 };
  contextMenuKey = '';
  isRenameModalOpen = signal(false);
  renameValue = '';

  rotateLayout() {
    this.layoutRotation.update(r => r + 90);
  }

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

  getShopColorClass(category: string): string {
    switch (category) {
      case 'Health': return 'bg-sky-50 border-sky-100 text-sky-700 hover:border-sky-400';
      case 'Food': return 'bg-sky-50 border-sky-100 text-sky-700 hover:border-sky-400';
      case 'Beauty':
      case 'Services': return 'bg-sky-50 border-sky-100 text-sky-700 hover:border-sky-400';
      case 'Finance':
      case 'Tech': return 'bg-sky-50 border-sky-100 text-sky-700 hover:border-sky-400';
      case 'Entertainment': return 'bg-sky-50 border-sky-100 text-sky-700 hover:border-sky-400';
      case 'Education': return 'bg-sky-50 border-sky-100 text-sky-700 hover:border-sky-400';
      default: return 'bg-sky-50 border-sky-100 text-sky-700 hover:border-sky-400';
    }
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

  getBlockX(c: number): number {
    let x = 0;
    const road = this.ROAD();
    for (let i = 0; i < c; i++) {
      x += this.getMaxBlockCols(i) * this.CELL() + road;
    }
    return x;
  }

  getBlockY(r: number): number {
    let y = 0;
    const road = this.ROAD();
    for (let i = 0; i < r; i++) {
      y += this.getMaxBlockRows(i) * this.CELL() + road;
    }
    return y;
  }

  zoomIn() { if (this.zoom() < 2.0) this.zoom.update(z => +(z + 0.1).toFixed(1)); }
  zoomOut() { if (this.zoom() > 0.4) this.zoom.update(z => +(z - 0.1).toFixed(1)); }
  resetZoom() { this.zoom.set(1.0); }

  // Convert a plot key to its pixel top-left position on the canvas
  getCellPixelPos(key: string): { x: number; y: number; w: number; h: number } | null {
    const fullKey = key.split('-')[0];
    const halfSuffix = key.includes('-') ? key.split('-')[1] : null;
    
    const m = fullKey.match(/r(\d+)c(\d+)pr(\d+)pc(\d+)/);
    if (!m) return null;
    const r = +m[1], c = +m[2], pr = +m[3], pc = +m[4];
    const C = this.CELL();
    
    const baseX = this.getBlockX(c);
    const baseY = this.getBlockY(r);
    
    let x = baseX + pc * C;
    let y = baseY + pr * C;
    let w = C;
    let h = C;
    
    if (halfSuffix) {
      const plot = this.plots()[fullKey];
      if (plot?.splitDirection === 'v') {
        w = C / 2;
        if (halfSuffix === 'b') x += w;
      } else if (plot?.splitDirection === 'h') {
        h = C / 2;
        if (halfSuffix === 'b') y += h;
      }
    }
    
    return { x, y, w, h };
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
    return this.mergeGroups().find(g => 
      g.includes(key) || g.includes(key + '-a') || g.includes(key + '-b')
    ) || null;
  }

  isMergePrimary(key: string): boolean {
    const g = this.getMergeGroupOf(key);
    // It's a primary only if the FULL key itself is the primary (at index 0)
    return !!g && g[0] === key;
  }

  isMergeSecondary(key: string): boolean {
    const g = this.getMergeGroupOf(key);
    if (!g) return false;
    // It's a full secondary only if the FULL key itself is in the group (not as index 0)
    return g.includes(key) && g[0] !== key;
  }

  getHiddenHalf(key: string): 'a' | 'b' | null {
    const group = this.mergeGroups().find(g => g.includes(key + '-a') || g.includes(key + '-b'));
    if (!group) return null;
    if (group.includes(key + '-a')) return 'a';
    if (group.includes(key + '-b')) return 'b';
    return null;
  }

  // No longer needed for grid span — kept empty for template compat
  getMergeStyle(_key: string): { [k: string]: string } { return {}; }

  isPendingMerge(key: string) { 
    return this.pendingMerge.includes(key) || 
           this.pendingMerge.includes(key + '-a') || 
           this.pendingMerge.includes(key + '-b'); 
  }

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

  constructor(private stateService: StateService, public router: Router) { }

  ngOnInit() { 
    this.loadHardcodedJson(); 
    document.body.classList.add('light-theme');
  }

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
                name: `MACS Tower ${String.fromCharCode(65 + pr * PSB + pc)}`,
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
                name: `MACS ${shop.label}`,
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
    
    // Ensure we target the primary cell if it's a merged block
    const group = this.getMergeGroupOf(key);
    const targetKey = group ? group[0] : key;
    
    this.contextMenuKey = targetKey;
    this.contextMenuPos = { x: event.clientX, y: event.clientY };
    this.isContextMenuOpen.set(true);
  }

  openRenameModal() {
    const plot = this.plots()[this.contextMenuKey];
    this.renameValue = plot?.name || '';
    this.isRenameModalOpen.set(true);
    this.isContextMenuOpen.set(false);
  }

  saveRename() {
    if (this.contextMenuKey) {
      this.stateService.saveState();
      this.stateService.updatePlot(this.contextMenuKey, { name: this.renameValue });
    }
    this.isRenameModalOpen.set(false);
  }

  openResidentModal() {
    this.stateService.selectPlot(this.contextMenuKey);
    this.resModalRole = 'owner';
    this.isResModalOpen = true;
    this.isContextMenuOpen.set(false);
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
      name: plot?.name || displayName,
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

  updateSecurityGuard(key: string, field: 'name' | 'phone', value: string) {
    const plot = this.plots()[key];
    if (!plot) return;
    const residents = plot.residents?.length
      ? [...plot.residents]
      : [{ name: '', phone: '', role: 'owner' as const }];
    residents[0] = { ...residents[0], [field]: value };
    this.stateService.updatePlot(key, { residents });
  }

  updateSqft(key: string, sqft: number) {
    this.stateService.saveState();
    this.stateService.updatePlot(key, { sqft });
  }

  handleAptConfirm(config: AptConfig) {
    const key = this.selectedKey();
    if (!key) return;
    this.stateService.saveState();
    
    // Auto-update name if it's a merged plot
    const isMerged = !!this.getMergeGroupOf(key);
    const updates: any = { 
      type: 'apartment', 
      aptConfig: config, 
      residents: this.plots()[key]?.residents || [] 
    };
    if (isMerged) {
      updates.name = 'Merged Apartment';
    }
    
    this.stateService.updatePlot(key, updates);
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

  fillRowWithHouse() {
    const key = this.selectedKey();
    if (!key) return;
    const match = key.match(/r(\d+)c(\d+)pr(\d+)pc(\d+)/);
    if (!match) return;
    this.stateService.saveState();
    const r = match[1], pr = match[3];
    for (let c = 0; c <= this.vStreets; c++)
      for (let pc = 0; pc < this.plotsPerBlock; pc++) {
        const targetKey = `r${r}c${c}pr${pr}pc${pc}`;
        this.stateService.updatePlot(targetKey, { 
          type: 'house', 
          name: `House ${r}${c}-${pr}${pc}`,
          price: 6000,
          sqft: 1200,
          residents: [] 
        });
      }
  }

  fillColWithHouse() {
    const key = this.selectedKey();
    if (!key) return;
    const match = key.match(/r(\d+)c(\d+)pr(\d+)pc(\d+)/);
    if (!match) return;
    this.stateService.saveState();
    const c = match[2], pc = match[4];
    for (let r = 0; r <= this.hStreets; r++)
      for (let pr = 0; pr < this.plotsPerBlock; pr++) {
        const targetKey = `r${r}c${c}pr${pr}pc${pc}`;
        this.stateService.updatePlot(targetKey, { 
          type: 'house', 
          name: `House ${r}${c}-${pr}${pc}`,
          price: 6000,
          sqft: 1200,
          residents: [] 
        });
      }
  }

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
      const mergeKey = half ? `${key}-${half}` : key;
      if (this.pendingMerge.includes(mergeKey)) {
        this.pendingMerge = this.pendingMerge.filter(k => k !== mergeKey);
      } else {
        this.pendingMerge = [...this.pendingMerge, mergeKey];
      }
      return;
    }
    const group = this.getMergeGroupOf(key);
    const targetKey = group ? group[0] : key;
    this.stateService.selectPlot(targetKey, half);
    const plot = this.plots()[targetKey];
    const hasData = plot && (
      (plot.type && plot.type !== 'vacant' && plot.type !== 'road') ||
      (plot.residents?.length ?? 0) > 0
    );
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
    if (this.isCtrlHeld) {
      this.selectPlot(key, half);
      return;
    }
    this.stateService.selectPlot(key, half);
    const plot = this.plots()[key];
    const halfData = plot?.splitData?.[half];
    const hasData = halfData && (halfData.type !== 'vacant' || halfData.residents.length > 0);
    if (hasData) this.isDetailModalOpen = true;
  }

  isSplitCell(key: string): boolean {
    return !!this.plots()[key]?.splitDirection;
  }

  // ── BLOCK CUSTOMIZATION ──────────────────────────────
  isBlockCustomizeOpen = false;
  blockCustomizeTarget = { r: 0, c: 0 };
  blockCustomizeRows = 2;
  blockCustomizeCols = 2;

  blockOverrides = computed(() => this.state().blockOverrides || {});

  getBlockRows(r: number, c: number): number {
    return this.blockOverrides()[`${r}_${c}`]?.rows ?? this.plotsPerBlock;
  }

  getBlockCols(r: number, c: number): number {
    return this.blockOverrides()[`${r}_${c}`]?.cols ?? this.plotsPerBlock;
  }

  openBlockCustomize(r: number, c: number, event: MouseEvent) {
    event.stopPropagation();
    this.blockCustomizeTarget = { r, c };
    this.blockCustomizeRows = this.getBlockRows(r, c);
    this.blockCustomizeCols = this.getBlockCols(r, c);
    this.isBlockCustomizeOpen = true;
  }

  applyBlockCustomize() {
    const { r, c } = this.blockCustomizeTarget;
    this.stateService.saveState();
    this.stateService.setBlockOverride(r, c, this.blockCustomizeRows, this.blockCustomizeCols);
    this.isBlockCustomizeOpen = false;
  }

  resetBlockCustomize() {
    const { r, c } = this.blockCustomizeTarget;
    this.stateService.saveState();
    this.stateService.clearBlockOverride(r, c);
    this.isBlockCustomizeOpen = false;
  }

  getBlockKeysCustom(r: number, c: number): string[] {
    const keys = [];
    const rows = this.getBlockRows(r, c);
    const cols = this.getBlockCols(r, c);
    for (let pr = 0; pr < rows; pr++)
      for (let pc = 0; pc < cols; pc++)
        keys.push(`r${r}c${c}pr${pr}pc${pc}`);
    return keys;
  }

  isBlockOverridden(r: number, c: number): boolean {
    return !!this.blockOverrides()[`${r}_${c}`];
  }

  getMaxBlockRows(r: number): number {
    let max = 0;
    for (let c = 0; c <= this.vStreets; c++)
      max = Math.max(max, this.getBlockRows(r, c));
    return max;
  }

  getMaxBlockCols(c: number): number {
    let max = 0;
    for (let r = 0; r <= this.hStreets; r++)
      max = Math.max(max, this.getBlockCols(r, c));
    return max;
  }

  addRow() { this.hStreets = Math.min(this.hStreets + 1, 8); }
  addCol() { this.vStreets = Math.min(this.vStreets + 1, 8); }

  // ── GATE ──────────────────────────────────────────────
  isGatePickerOpen = false;
  gatePickerKey = '';
  gateConfig: { position: 'top' | 'bottom' | 'left' | 'right'; type: 'cyber' | 'side'; label: string; isCustom: boolean } = { position: 'top', type: 'cyber', label: 'ENTRANCE', isCustom: false };
  readonly gateNames = ['ENTRANCE', 'EXIT', 'GATE A', 'CUSTOMIZE'];

  readonly gateTypes = [
    { value: 'cyber',     label: 'Cyber Gate',     emoji: '⚡', desc: 'High-Tech Neon Style' },
    { value: 'side',      label: 'Side Gate',      emoji: '🏙️', desc: 'Modern Elite Style' },
  ];

  openGatePicker(key: string) {
    this.gatePickerKey = key;
    const existing = this.plots()[key]?.gate;
    const isCustom = !this.gateNames.includes(existing?.label || 'ENTRANCE');
    this.gateConfig = { 
      position: (existing?.position || 'top') as any, 
      type: (existing?.type || 'cyber') as any,
      label: existing?.label || 'ENTRANCE',
      isCustom: isCustom
    };
    this.isGatePickerOpen = true;
  }

  confirmGate() {
    const key = this.gatePickerKey;
    if (key) {
      this.stateService.saveState();
      this.stateService.updatePlot(key, { 
        gate: { 
          position: this.gateConfig.position as any, 
          type: this.gateConfig.type as any,
          label: this.gateConfig.isCustom ? this.gateConfig.label : (this.gateConfig.label === 'CUSTOMIZE' ? '' : this.gateConfig.label)
        } 
      });
    }
    this.isGatePickerOpen = false;
  }

  removeGate() {
    const key = this.gatePickerKey;
    if (!key) return;
    this.stateService.saveState();
    this.stateService.updatePlot(key, { gate: undefined });
    this.isGatePickerOpen = false;
  }

  // Vacant plot click — select and open sidebar
  onVacantClick(key: string) {
    this.stateService.selectPlot(key);
    if (!this.isSidebarOpen()) this.isSidebarOpen.set(true);
  }

  getMergeTypeColor(type: string | undefined): string {
    const colors: Record<string, string> = {
      house:     '#10b981',
      apartment: '#0ea5e9',
      park:      '#22c55e',
      shop:      '#06b6d4',
      watertank: '#3b82f6',
      hospital:  '#ef4444',
    };
    return colors[type || ''] || '#94a3b8';
  }

  getMergeBlockStyle(type: string | undefined, isSelected: boolean): string {
    const selectedBorder = isSelected ? `box-shadow: 0 0 0 2px ${this.getMergeTypeColor(type)};` : '';
    return `background:#ffffff; border:1px solid #e2e8f0; ${selectedBorder}`;
  }

  getMergeGlassLayer(_type: string | undefined): string { return ''; }
  getMergeGlowRing(_type: string | undefined, _units: number): string { return ''; }

  // ── SVG POLYGON MERGE SHAPE ──────────────────────────
  getMergePolygonPath(group: string[]): string | null {
    const positions = group.map(k => this.getCellPixelPos(k)).filter(Boolean) as { x: number; y: number; w: number; h: number }[];
    if (!positions.length) return null;

    const C = this.CELL();
    const step = C / 2; 
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));

    const cellSet = new Set<string>();
    positions.forEach(p => {
      const c = Math.round((p.x - minX) / step);
      const r = Math.round((p.y - minY) / step);
      const cols = Math.round(p.w / step);
      const rows = Math.round(p.h / step);
      for (let ir = 0; ir < rows; ir++) {
        for (let ic = 0; ic < cols; ic++) {
          cellSet.add(`${r + ir},${c + ic}`);
        }
      }
    });

    const has = (r: number, c: number) => cellSet.has(`${r},${c}`);

    // Collect all outer edges
    const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
    cellSet.forEach(key => {
      const parts = key.split(',');
      const r = parseInt(parts[0]);
      const c = parseInt(parts[1]);
      const x = minX + c * step;
      const y = minY + r * step;

      if (!has(r - 1, c)) edges.push({ x1: x, y1: y, x2: x + step, y2: y }); // top
      if (!has(r + 1, c)) edges.push({ x1: x + step, y1: y + step, x2: x, y2: y + step }); // bottom
      if (!has(r, c - 1)) edges.push({ x1: x, y1: y + step, x2: x, y2: y }); // left
      if (!has(r, c + 1)) edges.push({ x1: x + step, y1: y, x2: x + step, y2: y + step }); // right
    });

    if (edges.length === 0) return null;

    // Chain edges into a closed polygon path
    const pt = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`;
    const edgeMap = new Map<string, { x: number; y: number }>();
    edges.forEach(e => edgeMap.set(pt(e.x1, e.y1), { x: e.x2, y: e.y2 }));

    const start = edges[0];
    let cur = { x: start.x1, y: start.y1 };
    const points: string[] = [`M${cur.x.toFixed(2)},${cur.y.toFixed(2)}`];
    const visited = new Set<string>();

    for (let i = 0; i < edges.length; i++) {
      const key = pt(cur.x, cur.y);
      if (visited.has(key)) break;
      visited.add(key);
      const next = edgeMap.get(key);
      if (!next) break;
      points.push(`L${next.x.toFixed(2)},${next.y.toFixed(2)}`);
      cur = next;
    }
    points.push('Z');
    return points.join(' ');
  }

  getMergeCentroid(group: string[]): { x: number; y: number } | null {
    const positions = group.map(k => this.getCellPixelPos(k)).filter(Boolean) as { x: number; y: number; w: number; h: number }[];
    if (!positions.length) return null;
    const avgX = positions.reduce((s, p) => s + p.x + p.w / 2, 0) / positions.length;
    const avgY = positions.reduce((s, p) => s + p.y + p.h / 2, 0) / positions.length;
    return { x: avgX, y: avgY };
  }

  getMergeSvgBounds(group: string[]): { x: number; y: number; w: number; h: number } | null {
    const positions = group.map(k => this.getCellPixelPos(k)).filter(Boolean) as { x: number; y: number; w: number; h: number }[];
    if (!positions.length) return null;
    const pad = 6;
    const minX = Math.min(...positions.map(p => p.x)) - pad;
    const minY = Math.min(...positions.map(p => p.y)) - pad;
    const maxX = Math.max(...positions.map(p => p.x + p.w)) + pad;
    const maxY = Math.max(...positions.map(p => p.y + p.h)) + pad;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  toggleSidebarExtension() {
    this.isSidebarExtended.set(!this.isSidebarExtended());
  }

  cycleSidebarStage() {
    this.sidebarStage.update(s => ((s + 1) % 3) as 0 | 1 | 2);
  }

  sidebarWidthClass = computed(() => {
    if (!this.isSidebarOpen()) return 'w-0 opacity-0 overflow-hidden';
    const stage = this.sidebarStage();
    if (stage === 0) return 'w-72';
    if (stage === 1) return 'w-[480px]';
    return 'w-[700px]';
  });

  getPlotIconPath(type?: PlotType, shopType?: string): string {
    if (!type || type === 'vacant' || type === 'road') return '';
    let iconFile = `${type}.png`;
    if (type === 'shop') {
      const shopMap: Record<string, string> = {
        'gym': 'gym.png',
        'playstation': 'playstation.png',
        'bank': 'bank.png',
        'atm': 'bank.png',
        'miniclinic': 'mini clinic.png',
        'pharmacy': 'pharmacy.png',
        'bakery': 'bakery.png',
        'grosary': 'grosary.png',
        'grocery': 'grosary.png',
        'laundry': 'laundary (1).png',
        'tailoring': 'tailor (1).png',
        'salon': 'spa (1).png',
        'spa': 'spa (1).png',
      };
      if (shopType && shopMap[shopType.toLowerCase()]) {
        iconFile = shopMap[shopType.toLowerCase()];
      } else {
        iconFile = 'shop.png';
      }
    } else if (type === 'watertank') {
      iconFile = 'watertank.png';
    }
    return `assets/plot-icons/${iconFile}`;
  }

  getPillarStyle(type: string | undefined, label?: string): string {
    if (!type) return 'background: #94a3b8;';
    const isExit = label?.toLowerCase().includes('exit');
    const color = isExit ? '#ef4444' : (type === 'cyber' ? '#1d4ed8' : '#1e293b');
    const accent = isExit ? '#fee2e2' : (type === 'cyber' ? '#38bdf8' : '#475569');
    
    if (type === 'cyber') {
      return `background: linear-gradient(135deg, ${accent} 0%, ${color} 100%); border: 1px solid ${isExit ? '#991b1b' : '#1e3a8a'}; box-shadow: 0 0 15px ${isExit ? 'rgba(239,68,68,0.4)' : 'rgba(14,165,233,0.4)'};`;
    }
    return `background: linear-gradient(135deg, ${accent} 0%, ${color} 100%); border: 1px solid ${isExit ? '#991b1b' : '#0f172a'};`;
  }

  getBarStyle(type: string | undefined, label?: string): string {
    if (!type) return 'background: #64748b;';
    const isExit = label?.toLowerCase().includes('exit');
    if (isExit) return 'background: linear-gradient(to bottom, #f87171, #ef4444); border: 1px solid #991b1b;';
    
    switch (type) {
      case 'cyber': return 'background: linear-gradient(to bottom, #0ea5e9, #2563eb); border: 1px solid #1e40af;';
      case 'side': return 'background: linear-gradient(to bottom, #1e293b, #0f172a); border: 1px solid #020617;';
      default: return 'background: #64748b;';
    }
  }
}
