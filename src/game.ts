// src/game.ts
import { GameState } from './gameState';
import { ChainResolver } from './resolver';
import { DiceRenderer } from './ui/diceRenderer';
import { ResolutionRenderer } from './ui/resolutionRenderer';
import { ShopRenderer } from './ui/shopRenderer';
import { Shop, ShopItem } from './shop';
import { DieImpl, DoubleRollDie, CopyDie, ChainDie } from './dice';
import type { Die } from './types';

export class Game {
    private state: GameState;
    private resolver: ChainResolver;
    private diceRenderer: DiceRenderer;
    private resolutionRenderer: ResolutionRenderer;
    private shopRenderer: ShopRenderer;
    private shop: Shop;
    private currentShopItems: ShopItem[] = [];

    constructor() {
        this.state = new GameState();
        this.resolver = new ChainResolver();
        this.diceRenderer = new DiceRenderer('dice-tray', 'arrangement-zone');
        this.resolutionRenderer = new ResolutionRenderer('resolution-display');
        this.shopRenderer = new ShopRenderer('shop-overlay');
        this.shop = new Shop();
    }

    init(): void {
        this.diceRenderer.setOnArrange((die) => this.handleDieArrange(die));
        this.diceRenderer.setOnUnarrange((die) => this.handleDieUnarrange(die));
        this.diceRenderer.setupArrangementZone();

        document.getElementById('roll-btn')!.addEventListener('click', () => this.rollDice());
        document.getElementById('confirm-btn')!.addEventListener('click', () => this.confirmArrangement());

        this.updateUI();
    }

    private rollDice(): void {
        this.state.rollAllDice();
        this.resolutionRenderer.clear();
        this.diceRenderer.renderDiceTray(this.state.dice);
        this.diceRenderer.renderArrangementZone([]);

        document.getElementById('roll-btn')!.setAttribute('disabled', 'true');
        document.getElementById('confirm-btn')!.setAttribute('disabled', 'true');

        this.updateUI();
    }

    private handleDieArrange(die: Die): void {
        if (this.state.arrangeDie(die)) {
            this.diceRenderer.renderDiceTray(this.state.getUnarrangedDice());
            this.diceRenderer.renderArrangementZone(this.state.arrangedDice);

            if (this.state.isArrangementComplete()) {
                document.getElementById('confirm-btn')!.removeAttribute('disabled');
            }
        }
    }

    private handleDieUnarrange(die: Die): void {
        if (this.state.unarrangeDie(die)) {
            this.diceRenderer.renderDiceTray(this.state.getUnarrangedDice());
            this.diceRenderer.renderArrangementZone(this.state.arrangedDice);

            // Disable confirm if arrangement is no longer complete
            document.getElementById('confirm-btn')!.setAttribute('disabled', 'true');
        }
    }

    private async confirmArrangement(): Promise<void> {
        this.state.phase = 'resolving';
        document.getElementById('confirm-btn')!.setAttribute('disabled', 'true');

        const result = this.resolver.resolve(this.state.arrangedDice);
        this.state.currentScore = result.totalScore;

        await this.resolutionRenderer.showResolution(result.steps, result.totalScore);

        const target = this.state.getTargetScore();
        if (result.totalScore >= target) {
            this.handleWin(result.totalScore, target);
        } else {
            this.handleLoss();
        }
    }

    private handleWin(score: number, target: number): void {
        const bonus = Math.floor((score - target) / 5);
        this.state.gold += 5 + bonus;
        this.state.advanceLevel();
        this.updateUI();

        setTimeout(() => this.showShop(), 1000);
    }

    private handleLoss(): void {
        this.state.gameOver();
        this.showGameOver();
    }

    private showShop(): void {
        this.currentShopItems = this.shop.generateItems(this.state.level);

        this.shopRenderer.render(
            this.currentShopItems,
            this.state.gold,
            this.state.dice,
            (index, targetDieId) => this.handleBuy(index, targetDieId),
            () => this.closeShop()
        );
    }

    private handleBuy(index: number, targetDieId: string | null): void {
        const item = this.currentShopItems[index];
        if (!item || this.state.gold < item.price) return;

        this.state.gold -= item.price;

        if (item.type === 'modifier' && item.item && targetDieId) {
            const targetDie = this.state.dice.find(d => d.id === targetDieId);
            if (targetDie) {
                targetDie.modifiers.push(item.item);
            }
        } else if (item.type === 'die' && item.die) {
            this.state.dice.push(item.die);
        }

        // Remove purchased item
        this.currentShopItems.splice(index, 1);

        // Re-render shop
        this.shopRenderer.render(
            this.currentShopItems,
            this.state.gold,
            this.state.dice,
            (i, tid) => this.handleBuy(i, tid),
            () => this.closeShop()
        );

        this.updateUI();
    }

    private closeShop(): void {
        this.shopRenderer.hide();
        this.state.endShop();
        document.getElementById('roll-btn')!.removeAttribute('disabled');
        this.updateUI();
    }

    private showGameOver(): void {
        const overlay = document.getElementById('game-over-overlay')!;
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div class="overlay-content">
                <h2>Game Over</h2>
                <p>Reached Level ${this.state.level}</p>
                <p>Final Score: ${this.state.currentScore}</p>
                <button id="restart-btn">Try Again</button>
            </div>
        `;
        document.getElementById('restart-btn')!.addEventListener('click', () => this.restart());
    }

    private restart(): void {
        this.state.reset();
        document.getElementById('game-over-overlay')!.classList.add('hidden');
        document.getElementById('shop-overlay')!.classList.add('hidden');
        document.getElementById('roll-btn')!.removeAttribute('disabled');
        this.diceRenderer.renderDiceTray([]);
        this.diceRenderer.renderArrangementZone([]);
        this.resolutionRenderer.clear();
        this.updateUI();
    }

    private updateUI(): void {
        document.getElementById('level-display')!.textContent = `Level: ${this.state.level}`;
        document.getElementById('gold-display')!.textContent = `Gold: ${this.state.gold}`;
        document.getElementById('target-display')!.textContent = `Target: ${this.state.getTargetScore()}`;
        document.getElementById('score-display')!.textContent = `Score: ${this.state.currentScore}`;
    }

    // Debug/Test methods
    public addGold(amount: number): void {
        this.state.gold += amount;
        this.updateUI();
        console.log(`Added ${amount} gold. Current gold: ${this.state.gold}`);
    }

    public addSpecialDice(type: string): void {
        let newDie: Die;
        const id = `debug-${Date.now()}`;

        switch (type.toLowerCase()) {
            case 'lucky7':
                newDie = new DieImpl(id, [1, 2, 3, 4, 5, 7]);
                break;
            case 'risky':
                newDie = new DieImpl(id, [-2, 0, 4, 6, 8, 10]);
                break;
            case 'double':
            case 'doubleroll':
                newDie = new DoubleRollDie(id);
                break;
            case 'copy':
                newDie = new CopyDie(id);
                break;
            case 'chain':
                newDie = new ChainDie(id);
                break;
            default:
                console.error(`Unknown dice type: ${type}. Valid types: lucky7, risky, double, copy, chain`);
                return;
        }

        this.state.dice.push(newDie);
        this.diceRenderer.renderDiceTray(this.state.getUnarrangedDice()); // Re-render pool
        console.log(`Added ${type} die!`);
    }
}
