// src/ui/diceRenderer.ts
import type { Die } from '../types';

export class DiceRenderer {
    private tray: HTMLElement;
    private zone: HTMLElement;
    private selectedDie: Die | null = null;
    private onArrange: (die: Die) => void = () => { };
    private onUnarrange: (die: Die) => void = () => { };
    private onReorder: (die: Die, newIndex: number) => void = () => { };
    private currentDicePool: Die[] = [];
    private currentArranged: Die[] = [];
    private draggedDie: Die | null = null;
    private dragSourceLocation: 'pool' | 'arranged' | null = null;

    constructor(trayId: string, zoneId: string) {
        this.tray = document.getElementById(trayId)!;
        this.zone = document.getElementById(zoneId)!;
    }

    setOnArrange(callback: (die: Die) => void): void {
        this.onArrange = callback;
    }

    setOnUnarrange(callback: (die: Die) => void): void {
        this.onUnarrange = callback;
    }

    setOnReorder(callback: (die: Die, newIndex: number) => void): void {
        this.onReorder = callback;
    }

    renderDiceTray(dice: Die[]): void {
        this.tray.innerHTML = '';
        this.selectedDie = null;
        this.currentDicePool = dice;

        dice.forEach(die => {
            const el = this.createDieElement(die, 'pool');
            this.tray.appendChild(el);
        });
    }

    setupArrangementZone(): void {
        // Drop zone for arrangement
        this.zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.zone.classList.add('drag-over');
        });

        this.zone.addEventListener('dragleave', () => {
            this.zone.classList.remove('drag-over');
        });

        this.zone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.zone.classList.remove('drag-over');
            this.clearDropIndicators();
            if (this.draggedDie && this.dragSourceLocation === 'pool') {
                this.onArrange(this.draggedDie);
            }
            this.draggedDie = null;
            this.dragSourceLocation = null;
        });

        // Click to place selected die
        this.zone.addEventListener('click', (e) => {
            // Only handle clicks on the zone itself, not on arranged dice
            if ((e.target as HTMLElement).classList.contains('die')) return;

            if (this.selectedDie && this.currentDicePool.includes(this.selectedDie)) {
                this.onArrange(this.selectedDie);
                this.selectedDie = null;
            }
        });

        // Make tray a drop zone for returning dice
        this.tray.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.tray.classList.add('drag-over');
        });

        this.tray.addEventListener('dragleave', () => {
            this.tray.classList.remove('drag-over');
        });

        this.tray.addEventListener('drop', (e) => {
            e.preventDefault();
            this.tray.classList.remove('drag-over');
            if (this.draggedDie && this.currentArranged.includes(this.draggedDie)) {
                this.onUnarrange(this.draggedDie);
                this.draggedDie = null;
            }
        });
    }

    renderArrangementZone(arrangedDice: Die[]): void {
        this.zone.innerHTML = '';
        this.currentArranged = arrangedDice;

        if (arrangedDice.length === 0) {
            this.zone.innerHTML = '<span class="zone-hint">Drag dice here or click to place</span>';
        }

        arrangedDice.forEach((die, index) => {
            const el = this.createDieElement(die, 'arranged');
            el.classList.add('arranged');

            const posLabel = document.createElement('span');
            posLabel.className = 'pos-label';
            posLabel.textContent = `${index + 1}`;
            el.appendChild(posLabel);

            this.zone.appendChild(el);
        });
    }

    private createDieElement(die: Die, location: 'pool' | 'arranged'): HTMLElement {
        const el = document.createElement('div');
        el.className = 'die';
        el.dataset.dieId = die.id;
        el.draggable = true;
        el.textContent = `${die.getCurrentValue()}`;

        // Drag events
        el.addEventListener('dragstart', (e) => {
            this.draggedDie = die;
            this.dragSourceLocation = location;
            el.classList.add('dragging');
            e.dataTransfer?.setData('text/plain', die.id);
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            this.clearDropIndicators();
            this.draggedDie = null;
            this.dragSourceLocation = null;
        });

        // Reorder drag events for arranged dice
        if (location === 'arranged') {
            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.draggedDie && this.dragSourceLocation === 'arranged' && this.draggedDie !== die) {
                    this.clearDropIndicators();
                    const rect = el.getBoundingClientRect();
                    const midX = rect.left + rect.width / 2;
                    if (e.clientX < midX) {
                        el.classList.add('drop-left');
                    } else {
                        el.classList.add('drop-right');
                    }
                }
            });

            el.addEventListener('dragleave', () => {
                el.classList.remove('drop-left', 'drop-right');
            });

            el.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.draggedDie && this.dragSourceLocation === 'arranged' && this.draggedDie !== die) {
                    const rect = el.getBoundingClientRect();
                    const midX = rect.left + rect.width / 2;
                    const targetIndex = this.currentArranged.indexOf(die);
                    const draggedIndex = this.currentArranged.indexOf(this.draggedDie);
                    let newIndex = e.clientX < midX ? targetIndex : targetIndex + 1;
                    // Adjust for removal of dragged item
                    if (draggedIndex < newIndex) newIndex--;
                    this.onReorder(this.draggedDie, newIndex);
                }
                this.clearDropIndicators();
                this.draggedDie = null;
                this.dragSourceLocation = null;
            });
        }

        // Click events
        if (location === 'pool') {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDieClick(die, el);
            });
        } else {
            // Click on arranged die to return it to pool
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onUnarrange(die);
            });
        }

        if (die.modifiers.length > 0) {
            const modBadge = document.createElement('span');
            modBadge.className = 'mod-badge';
            modBadge.textContent = die.modifiers.map(m => m.name).join(' ');
            el.appendChild(modBadge);
        }

        return el;
    }

    private handleDieClick(die: Die, element: HTMLElement): void {
        // If already selected, deselect
        if (this.selectedDie === die) {
            this.selectedDie = null;
            element.classList.remove('selected');
            return;
        }

        // Deselect previous
        this.tray.querySelectorAll('.die').forEach(el => el.classList.remove('selected'));

        // Select this one
        this.selectedDie = die;
        element.classList.add('selected');
    }

    private clearDropIndicators(): void {
        this.zone.querySelectorAll('.die').forEach(el => {
            el.classList.remove('drop-left', 'drop-right');
        });
    }
}
