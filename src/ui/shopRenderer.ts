// src/ui/shopRenderer.ts
import type { Die } from '../types';
import type { ShopItem } from '../shop';

export class ShopRenderer {
    private overlay: HTMLElement;

    constructor(overlayId: string) {
        this.overlay = document.getElementById(overlayId)!;
    }

    render(
        items: ShopItem[],
        gold: number,
        existingDice: Die[],
        refreshCost: number,
        onBuy: (index: number, targetDieId: string | null) => void,
        onRefresh: () => void,
        onSkip: () => void
    ): void {
        this.overlay.classList.remove('hidden');
        this.overlay.innerHTML = `
            <div class="overlay-content shop-content">
                <h2>Shop</h2>
                <div class="shop-header">
                    <p class="shop-gold">Gold: <span class="gold">${gold}</span></p>
                    <button id="refresh-btn" class="refresh-btn" ${gold < refreshCost ? 'disabled' : ''}>
                        Refresh (${refreshCost}g)
                    </button>
                </div>
                <div class="shop-layout">
                    <div class="shop-items"></div>
                    <div class="dice-sidebar">
                        <h3>Your Dice</h3>
                        <div class="dice-list"></div>
                    </div>
                </div>
                <button id="skip-shop-btn">Continue</button>
            </div>
        `;

        // Render dice sidebar
        const diceList = this.overlay.querySelector('.dice-list')!;
        existingDice.forEach((die, index) => {
            const dieEl = document.createElement('div');
            dieEl.className = 'sidebar-die';
            const modText = die.modifiers.length > 0
                ? die.modifiers.map(m => m.name).join(', ')
                : 'No modifiers';
            dieEl.innerHTML = `
                <span class="die-number">#${index + 1}</span>
                <span class="die-id">${this.getDieName(die)}</span>
                <span class="die-mods">${modText}</span>
            `;
            diceList.appendChild(dieEl);
        });

        // Render shop items
        const itemsContainer = this.overlay.querySelector('.shop-items')!;

        items.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';

            if (item.type === 'modifier') {
                itemEl.innerHTML = `
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.description}</div>
                    <div class="item-price">${item.price} gold</div>
                    <label>Apply to: 
                        <select class="target-select">
                            ${existingDice.map((d, i) => `<option value="${d.id}">#${i + 1} ${this.getDieName(d)}</option>`).join('')}
                        </select>
                    </label>
                    <button class="buy-btn" ${gold < item.price ? 'disabled' : ''}>Buy</button>
                `;
            } else {
                itemEl.innerHTML = `
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.description}</div>
                    <div class="item-price">${item.price} gold</div>
                    <button class="buy-btn" ${gold < item.price ? 'disabled' : ''}>Add to Dice</button>
                `;
            }

            itemEl.querySelector('.buy-btn')!.addEventListener('click', () => {
                const targetSelect = itemEl.querySelector('.target-select') as HTMLSelectElement | null;
                const targetDieId = targetSelect ? targetSelect.value : null;
                onBuy(index, targetDieId);
            });

            itemsContainer.appendChild(itemEl);
        });

        this.overlay.querySelector('#refresh-btn')!.addEventListener('click', onRefresh);
        this.overlay.querySelector('#skip-shop-btn')!.addEventListener('click', onSkip);
    }

    private getDieName(die: Die): string {
        // Try to extract a readable name from the die id
        const id = die.id;
        if (id.startsWith('even-')) return 'Even Die';
        if (id.startsWith('extreme-')) return 'Extreme Die';
        if (id.startsWith('triple-')) return 'Triple Die';
        if (id.startsWith('lucky7-')) return 'Lucky 7';
        if (id.startsWith('risky-')) return 'Risky Die';
        if (id.startsWith('double-')) return 'Double Roll';
        if (id.startsWith('copy-')) return 'Copy Die';
        if (id.startsWith('chain-')) return 'Chain Die';
        if (id.startsWith('die-')) return 'd6';
        return 'd6';
    }

    hide(): void {
        this.overlay.classList.add('hidden');
    }

    updateGold(gold: number): void {
        const goldEl = this.overlay.querySelector('.gold');
        if (goldEl) goldEl.textContent = `${gold}`;
    }

    renderFaceSelection(
        die: Die,
        onSelect: (faceIndex: number) => void,
        onCancel: () => void
    ): void {
        // We reuse the overlay but change content
        this.overlay.innerHTML = `
            <div class="overlay-content">
                <h2>Select Face to Upgrade</h2>
                <p>Choose which face of the ${this.getDieName(die)} to upgrade (+1)</p>
                <div class="face-selection-grid">
                    ${die.faces.map((face, index) => `
                        <div class="face-option" data-index="${index}">
                            <span class="face-index">Face ${index + 1}</span>
                            <div class="face-value">${face.getValue()}</div>
                        </div>
                    `).join('')}
                </div>
                <button id="cancel-selection-btn" class="cancel-btn">Cancel</button>
            </div>
        `;

        this.overlay.querySelectorAll('.face-option').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt((el as HTMLElement).dataset.index || '0');
                onSelect(index);
            });
        });

        document.getElementById('cancel-selection-btn')!.addEventListener('click', onCancel);
    }
}
