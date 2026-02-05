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
        onBuy: (index: number, targetDieId: string | null) => void,
        onSkip: () => void
    ): void {
        this.overlay.classList.remove('hidden');
        this.overlay.innerHTML = `
            <div class="overlay-content shop-content">
                <h2>Shop</h2>
                <p class="shop-gold">Gold: <span class="gold">${gold}</span></p>
                <div class="shop-items"></div>
                <button id="skip-shop-btn">Continue</button>
            </div>
        `;

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
                            ${existingDice.map(d => `<option value="${d.id}">${d.id} (${d.getCurrentValue()})</option>`).join('')}
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

        this.overlay.querySelector('#skip-shop-btn')!.addEventListener('click', onSkip);
    }

    hide(): void {
        this.overlay.classList.add('hidden');
    }

    updateGold(gold: number): void {
        const goldEl = this.overlay.querySelector('.gold');
        if (goldEl) goldEl.textContent = `${gold}`;
    }
}
