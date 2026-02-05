// src/game.ts
import { GameState } from './gameState';
import { ChainResolver } from './resolver';
import { DiceRenderer } from './ui/diceRenderer';
import { ResolutionRenderer } from './ui/resolutionRenderer';
import type { Die } from './types';

export class Game {
    private state: GameState;
    private resolver: ChainResolver;
    private diceRenderer: DiceRenderer;
    private resolutionRenderer: ResolutionRenderer;

    constructor() {
        this.state = new GameState();
        this.resolver = new ChainResolver();
        this.diceRenderer = new DiceRenderer('dice-tray', 'arrangement-zone');
        this.resolutionRenderer = new ResolutionRenderer('resolution-display');
    }

    init(): void {
        this.diceRenderer.setOnArrange((die) => this.handleDieArrange(die));
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
        const overlay = document.getElementById('shop-overlay')!;
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div class="overlay-content">
                <h2>Shop</h2>
                <p>Gold: ${this.state.gold}</p>
                <p>(Shop items coming in next task)</p>
                <button id="skip-shop-btn">Continue</button>
            </div>
        `;
        document.getElementById('skip-shop-btn')!.addEventListener('click', () => {
            overlay.classList.add('hidden');
            this.state.endShop();
            document.getElementById('roll-btn')!.removeAttribute('disabled');
            this.updateUI();
        });
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
}
