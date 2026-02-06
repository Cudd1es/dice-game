// src/gameState.ts
import type { Die, GamePhase } from './types';
import { DieImpl } from './dice';

export class GameState {
    level: number = 1;
    gold: number = 0;
    dice: Die[] = [];
    arrangedDice: Die[] = [];
    phase: GamePhase = 'rolling';
    currentScore: number = 0;

    constructor() {
        this.reset();
    }

    reset(): void {
        this.level = 1;
        this.gold = 10;
        this.dice = this.createStarterDice();
        this.arrangedDice = [];
        this.phase = 'rolling';
        this.currentScore = 0;
    }

    private createStarterDice(): Die[] {
        return [
            new DieImpl('die-1'),
            new DieImpl('die-2'),
            new DieImpl('die-3')
        ];
    }

    getTargetScore(): number {
        // Gentler progression: 8 + (level-1) * 3
        return 8 + (this.level - 1) * 3;
    }

    rollAllDice(): void {
        this.dice.forEach(die => die.roll());
        this.arrangedDice = [];
        this.phase = 'arranging';
    }

    arrangeDie(die: Die): boolean {
        if (this.arrangedDice.includes(die)) return false;
        this.arrangedDice.push(die);
        return true;
    }

    unarrangeDie(die: Die): boolean {
        const index = this.arrangedDice.indexOf(die);
        if (index === -1) return false;
        this.arrangedDice.splice(index, 1);
        return true;
    }

    isArrangementComplete(): boolean {
        return this.arrangedDice.length === this.dice.length;
    }

    getUnarrangedDice(): Die[] {
        return this.dice.filter(d => !this.arrangedDice.includes(d));
    }

    advanceLevel(): void {
        this.level++;
        this.phase = 'shop';
    }

    endShop(): void {
        this.phase = 'rolling';
    }

    gameOver(): void {
        this.phase = 'gameover';
    }
}
