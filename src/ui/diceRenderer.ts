// src/ui/diceRenderer.ts
import type { Die } from '../types';

export class DiceRenderer {
    private tray: HTMLElement;
    private zone: HTMLElement;
    private selectedDie: Die | null = null;
    private onArrange: (die: Die) => void = () => { };

    constructor(trayId: string, zoneId: string) {
        this.tray = document.getElementById(trayId)!;
        this.zone = document.getElementById(zoneId)!;
    }

    setOnArrange(callback: (die: Die) => void): void {
        this.onArrange = callback;
    }

    renderDiceTray(dice: Die[]): void {
        this.tray.innerHTML = '';
        this.selectedDie = null;

        dice.forEach(die => {
            const el = this.createDieElement(die);
            el.addEventListener('click', () => this.handleDieClick(die, el));
            this.tray.appendChild(el);
        });
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

    setupArrangementZone(): void {
        this.zone.addEventListener('click', () => {
            if (this.selectedDie) {
                this.onArrange(this.selectedDie);
                this.selectedDie = null;
            }
        });
    }

    renderArrangementZone(arrangedDice: Die[]): void {
        this.zone.innerHTML = '';

        if (arrangedDice.length === 0) {
            this.zone.innerHTML = '<span class="zone-hint">Click a die, then click here to place</span>';
        }

        arrangedDice.forEach((die, index) => {
            const el = this.createDieElement(die);
            el.classList.add('arranged');

            const posLabel = document.createElement('span');
            posLabel.className = 'pos-label';
            posLabel.textContent = `${index + 1}`;
            el.appendChild(posLabel);

            this.zone.appendChild(el);
        });
    }

    private createDieElement(die: Die): HTMLElement {
        const el = document.createElement('div');
        el.className = 'die';
        el.dataset.dieId = die.id;
        el.textContent = `${die.getCurrentValue()}`;

        if (die.modifiers.length > 0) {
            const modBadge = document.createElement('span');
            modBadge.className = 'mod-badge';
            modBadge.textContent = die.modifiers.map(m => m.name).join(' ');
            el.appendChild(modBadge);
        }

        return el;
    }
}
