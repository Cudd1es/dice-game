# Dice Roguelike MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a playable web-based dice roguelike with chain resolution visualization, modifiers, and shop system.

**Architecture:** Single-page web app with modular TypeScript. Game state managed in a central GameState class. Chain resolution system processes dice left-to-right applying modifiers with step-by-step visualization.

**Tech Stack:** HTML5, TypeScript, Vanilla CSS, Vite (for TS bundling)

---

## Task 1: Project Setup (TypeScript + Vite)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/style.css`

**Step 1: Initialize project with Vite TypeScript template**

```bash
npm create vite@latest ./ -- --template vanilla-ts
```

**Step 2: Update package.json**

```json
{
  "name": "dice-roguelike",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

**Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dice Roguelike</title>
    <link rel="stylesheet" href="/src/style.css">
</head>
<body>
    <div id="game-container">
        <header id="game-header">
            <h1>Dice Roguelike</h1>
            <div id="stats">
                <span id="level-display">Level: 1</span>
                <span id="gold-display">Gold: 0</span>
                <span id="target-display">Target: 10</span>
            </div>
        </header>
        <main id="game-area">
            <div id="dice-tray"></div>
            <div id="arrangement-zone"></div>
            <div id="resolution-display"></div>
            <div id="score-display">Score: 0</div>
        </main>
        <footer id="game-controls">
            <button id="roll-btn">Roll Dice</button>
            <button id="confirm-btn" disabled>Confirm Arrangement</button>
        </footer>
    </div>
    <div id="shop-overlay" class="hidden"></div>
    <div id="game-over-overlay" class="hidden"></div>
    <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 4: Create base CSS with design system**

```css
:root {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --accent: #e94560;
    --accent-glow: #ff6b8a;
    --text-primary: #eee;
    --text-secondary: #aaa;
    --gold: #ffd700;
    --success: #4ade80;
    --danger: #ef4444;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

#game-container {
    width: 100%;
    max-width: 800px;
    padding: 2rem;
}

.hidden {
    display: none !important;
}
```

**Step 5: Create main.ts entry point**

```typescript
// src/main.ts
import './style.css';
import { Game } from './game';

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
```

**Step 6: Install and verify**

```bash
npm install
npm run dev
```

Run: Open http://localhost:5173 in browser
Expected: See "Dice Roguelike" title with styled header

**Step 7: Commit**

```bash
git add .
git commit -m "feat: project setup with Vite + TypeScript"
```

---

## Task 2: Core Type Definitions & Dice Model

**Files:**
- Create: `src/types.ts`
- Create: `src/dice.ts`

**Step 1: Create core type definitions**

```typescript
// src/types.ts
export interface ChainState {
    nextBonus: number;
    globalMultiplier: number;
}

export interface ModifierContext {
    currentValue: number;
    dieIndex: number;
    allDice: Die[];
    chainState: ChainState;
}

export interface ResolutionStep {
    dieId: string;
    originalValue: number;
    appliedEffects: AppliedEffect[];
    finalValue: number;
}

export interface AppliedEffect {
    source: string;  // e.g., "Chain: +2", "Modifier: ×2"
    valueBefore: number;
    valueAfter: number;
}

export interface Die {
    id: string;
    faces: DieFace[];
    modifiers: Modifier[];
    currentFaceIndex: number;
    getCurrentFace(): DieFace;
    getCurrentValue(): number;
    roll(): DieFace;
}

export interface DieFace {
    baseValue: number;
    modifiers: Modifier[];
    getValue(): number;
}

export interface Modifier {
    type: 'add' | 'multiply' | 'next' | 'global';
    name: string;
    description: string;
    apply(context: ModifierContext): number;
}

export type GamePhase = 'rolling' | 'arranging' | 'resolving' | 'shop' | 'gameover';
```

**Step 2: Create Dice implementation**

```typescript
// src/dice.ts
import type { Die, DieFace, Modifier, ModifierContext } from './types';

export class DieFaceImpl implements DieFace {
    baseValue: number;
    modifiers: Modifier[] = [];

    constructor(baseValue: number) {
        this.baseValue = baseValue;
    }

    getValue(): number {
        return this.baseValue;
    }
}

export class DieImpl implements Die {
    id: string;
    faces: DieFace[];
    modifiers: Modifier[] = [];
    currentFaceIndex: number = 0;

    constructor(id: string, faceValues: number[] = [1, 2, 3, 4, 5, 6]) {
        this.id = id;
        this.faces = faceValues.map(v => new DieFaceImpl(v));
    }

    roll(): DieFace {
        this.currentFaceIndex = Math.floor(Math.random() * 6);
        return this.getCurrentFace();
    }

    getCurrentFace(): DieFace {
        return this.faces[this.currentFaceIndex];
    }

    getCurrentValue(): number {
        return this.getCurrentFace().getValue();
    }
}
```

**Step 3: Create browser test**

```typescript
// src/tests/dice.test.ts
import { DieImpl } from '../dice';

export function runDiceTests(): void {
    const output: string[] = [];
    
    function assert(cond: boolean, msg: string): void {
        output.push(cond ? `✓ ${msg}` : `✗ ${msg}`);
    }

    // Test 1: Die creation
    const die = new DieImpl('test-1');
    assert(die.faces.length === 6, 'Die has 6 faces');
    assert(die.id === 'test-1', 'Die has correct id');

    // Test 2: Roll returns valid value
    die.roll();
    const val = die.getCurrentValue();
    assert(val >= 1 && val <= 6, `Roll returns 1-6: got ${val}`);

    // Test 3: Custom faces
    const customDie = new DieImpl('custom', [2, 2, 4, 4, 6, 6]);
    assert(customDie.faces[0].baseValue === 2, 'Custom face value correct');

    console.log('Dice Tests:\n' + output.join('\n'));
}
```

**Step 4: Commit**

```bash
git add src/types.ts src/dice.ts src/tests/
git commit -m "feat: add TypeScript types and Dice classes"
```

---

## Task 3: Modifier System

**Files:**
- Create: `src/modifiers.ts`

**Step 1: Create Modifier implementations**

```typescript
// src/modifiers.ts
import type { Modifier, ModifierContext } from './types';

export class AddModifier implements Modifier {
    type: 'add' = 'add';
    name: string;
    description: string;
    amount: number;

    constructor(amount: number) {
        this.amount = amount;
        this.name = `+${amount}`;
        this.description = `Add ${amount} to this die`;
    }

    apply(context: ModifierContext): number {
        return context.currentValue + this.amount;
    }
}

export class MultiplyModifier implements Modifier {
    type: 'multiply' = 'multiply';
    name: string;
    description: string;
    factor: number;

    constructor(factor: number) {
        this.factor = factor;
        this.name = `×${factor}`;
        this.description = `Multiply this die by ${factor}`;
    }

    apply(context: ModifierContext): number {
        return context.currentValue * this.factor;
    }
}

export class NextAddModifier implements Modifier {
    type: 'next' = 'next';
    name: string;
    description: string;
    amount: number;

    constructor(amount: number) {
        this.amount = amount;
        this.name = `Next+${amount}`;
        this.description = `Add ${amount} to the NEXT die`;
    }

    apply(context: ModifierContext): number {
        context.chainState.nextBonus += this.amount;
        return context.currentValue;
    }
}

export class GlobalMultiplyModifier implements Modifier {
    type: 'global' = 'global';
    name: string;
    description: string;
    factor: number;

    constructor(factor: number) {
        this.factor = factor;
        this.name = `All×${factor}`;
        this.description = `Multiply ALL subsequent dice by ${factor}`;
    }

    apply(context: ModifierContext): number {
        context.chainState.globalMultiplier *= this.factor;
        return context.currentValue;
    }
}
```

**Step 2: Commit**

```bash
git add src/modifiers.ts
git commit -m "feat: add Modifier system with Add, Multiply, Next, Global types"
```

---

## Task 4: Chain Resolution Engine with Step Tracking

**Files:**
- Create: `src/resolver.ts`

**Step 1: Create ChainResolver with detailed step tracking**

```typescript
// src/resolver.ts
import type { Die, ChainState, ResolutionStep, AppliedEffect } from './types';

export interface ResolutionResult {
    totalScore: number;
    steps: ResolutionStep[];
}

export class ChainResolver {
    resolve(arrangedDice: Die[]): ResolutionResult {
        const chainState: ChainState = {
            nextBonus: 0,
            globalMultiplier: 1
        };
        
        let totalScore = 0;
        const steps: ResolutionStep[] = [];

        for (let i = 0; i < arrangedDice.length; i++) {
            const die = arrangedDice[i];
            const originalValue = die.getCurrentValue();
            let value = originalValue;
            const appliedEffects: AppliedEffect[] = [];
            
            // Apply incoming chain bonus
            if (chainState.nextBonus !== 0) {
                const before = value;
                value += chainState.nextBonus;
                appliedEffects.push({
                    source: `Chain: +${chainState.nextBonus}`,
                    valueBefore: before,
                    valueAfter: value
                });
                chainState.nextBonus = 0;
            }
            
            // Apply global multiplier
            if (chainState.globalMultiplier !== 1) {
                const before = value;
                value *= chainState.globalMultiplier;
                appliedEffects.push({
                    source: `Chain: ×${chainState.globalMultiplier}`,
                    valueBefore: before,
                    valueAfter: value
                });
            }
            
            // Apply die-level modifiers
            for (const mod of die.modifiers) {
                const before = value;
                value = mod.apply({
                    currentValue: value,
                    dieIndex: i,
                    allDice: arrangedDice,
                    chainState
                });
                if (value !== before || mod.type === 'next' || mod.type === 'global') {
                    appliedEffects.push({
                        source: `Die Mod: ${mod.name}`,
                        valueBefore: before,
                        valueAfter: value
                    });
                }
            }
            
            // Apply face-level modifiers
            const face = die.getCurrentFace();
            for (const mod of face.modifiers) {
                const before = value;
                value = mod.apply({
                    currentValue: value,
                    dieIndex: i,
                    allDice: arrangedDice,
                    chainState
                });
                if (value !== before || mod.type === 'next' || mod.type === 'global') {
                    appliedEffects.push({
                        source: `Face Mod: ${mod.name}`,
                        valueBefore: before,
                        valueAfter: value
                    });
                }
            }
            
            steps.push({
                dieId: die.id,
                originalValue,
                appliedEffects,
                finalValue: value
            });
            
            totalScore += value;
        }

        return { totalScore, steps };
    }
}
```

**Step 2: Commit**

```bash
git add src/resolver.ts
git commit -m "feat: add ChainResolver with step-by-step tracking"
```

---

## Task 5: Resolution Visualization UI

**Files:**
- Create: `src/ui/resolutionRenderer.ts`
- Update: `src/style.css`

**Step 1: Create ResolutionRenderer**

```typescript
// src/ui/resolutionRenderer.ts
import type { ResolutionStep } from '../types';

export class ResolutionRenderer {
    private container: HTMLElement;

    constructor(containerId: string) {
        this.container = document.getElementById(containerId)!;
    }

    async showResolution(steps: ResolutionStep[], totalScore: number): Promise<void> {
        this.container.innerHTML = '';
        this.container.classList.add('active');
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            await this.showStep(step, i + 1);
            await this.delay(600);
        }
        
        // Show total
        const totalEl = document.createElement('div');
        totalEl.className = 'resolution-total';
        totalEl.innerHTML = `<strong>Total Score: ${totalScore}</strong>`;
        this.container.appendChild(totalEl);
        await this.animateIn(totalEl);
    }

    private async showStep(step: ResolutionStep, position: number): Promise<void> {
        const stepEl = document.createElement('div');
        stepEl.className = 'resolution-step';
        
        // Die header
        const header = document.createElement('div');
        header.className = 'step-header';
        header.innerHTML = `<span class="step-pos">#${position}</span> Die: <span class="step-value">${step.originalValue}</span>`;
        stepEl.appendChild(header);
        
        // Effects
        if (step.appliedEffects.length > 0) {
            const effectsList = document.createElement('div');
            effectsList.className = 'step-effects';
            
            for (const effect of step.appliedEffects) {
                const effectEl = document.createElement('div');
                effectEl.className = 'step-effect';
                effectEl.innerHTML = `
                    <span class="effect-source">${effect.source}</span>
                    <span class="effect-calc">${effect.valueBefore} → ${effect.valueAfter}</span>
                `;
                effectsList.appendChild(effectEl);
            }
            stepEl.appendChild(effectsList);
        }
        
        // Final value
        const finalEl = document.createElement('div');
        finalEl.className = 'step-final';
        finalEl.innerHTML = `= <span class="final-value">${step.finalValue}</span>`;
        stepEl.appendChild(finalEl);
        
        this.container.appendChild(stepEl);
        await this.animateIn(stepEl);
    }

    private animateIn(el: HTMLElement): Promise<void> {
        return new Promise(resolve => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            requestAnimationFrame(() => {
                el.style.transition = 'all 0.3s ease-out';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                setTimeout(resolve, 300);
            });
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clear(): void {
        this.container.innerHTML = '';
        this.container.classList.remove('active');
    }
}
```

**Step 2: Add resolution CSS**

Add to `src/style.css`:

```css
/* Resolution Display */
#resolution-display {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 1rem;
    margin: 1rem 0;
    min-height: 50px;
}

#resolution-display.active {
    border: 1px solid var(--accent);
}

.resolution-step {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 0.8rem;
    margin-bottom: 0.5rem;
}

.step-header {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
}

.step-pos {
    color: var(--accent);
    font-weight: bold;
    margin-right: 0.5rem;
}

.step-value {
    font-weight: bold;
    color: var(--text-primary);
}

.step-effects {
    padding-left: 1rem;
    border-left: 2px solid var(--accent);
    margin: 0.5rem 0;
}

.step-effect {
    display: flex;
    justify-content: space-between;
    padding: 0.3rem 0;
    font-size: 0.9rem;
}

.effect-source {
    color: var(--gold);
}

.effect-calc {
    color: var(--text-secondary);
}

.step-final {
    text-align: right;
    font-size: 1.2rem;
}

.final-value {
    color: var(--success);
    font-weight: bold;
}

.resolution-total {
    text-align: center;
    font-size: 1.5rem;
    padding: 1rem;
    margin-top: 1rem;
    background: linear-gradient(145deg, rgba(233, 69, 96, 0.2), rgba(255, 107, 138, 0.1));
    border-radius: 8px;
    color: var(--accent-glow);
}
```

**Step 3: Commit**

```bash
git add src/ui/resolutionRenderer.ts src/style.css
git commit -m "feat: add step-by-step resolution visualization"
```

---

## Task 6: Click-to-Select Dice Interaction

**Files:**
- Create: `src/ui/diceRenderer.ts`
- Update: `src/style.css`

**Step 1: Create DiceRenderer with click-to-select**

```typescript
// src/ui/diceRenderer.ts
import type { Die } from '../types';

export class DiceRenderer {
    private tray: HTMLElement;
    private zone: HTMLElement;
    private selectedDie: Die | null = null;
    private onArrange: (die: Die) => void = () => {};

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
            
            // Allow removing from arrangement
            el.addEventListener('click', () => {
                // Optional: could allow reordering here
            });
            
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
```

**Step 2: Add dice interaction CSS**

Add to `src/style.css`:

```css
/* Dice Styles */
#dice-tray, #arrangement-zone {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    min-height: 100px;
    margin: 1rem 0;
    border-radius: 12px;
}

#dice-tray {
    background: var(--bg-secondary);
}

#arrangement-zone {
    background: rgba(233, 69, 96, 0.1);
    border: 2px dashed var(--accent);
    transition: all 0.3s;
    cursor: pointer;
}

#arrangement-zone:hover {
    background: rgba(233, 69, 96, 0.15);
    border-color: var(--accent-glow);
}

.zone-hint {
    color: var(--text-secondary);
    font-style: italic;
}

.die {
    width: 70px;
    height: 70px;
    background: linear-gradient(145deg, #2a2a4a, #1a1a3a);
    border: 2px solid var(--accent);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    cursor: pointer;
    position: relative;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    user-select: none;
}

.die:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(233, 69, 96, 0.3);
}

.die.selected {
    border-color: var(--gold);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    transform: translateY(-5px) scale(1.05);
}

.die.arranged {
    cursor: default;
}

.mod-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--gold);
    color: #000;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
}

.pos-label {
    position: absolute;
    bottom: -20px;
    font-size: 0.8rem;
    color: var(--text-secondary);
}

/* Buttons */
#game-controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
}

#game-controls button {
    background: var(--accent);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    transition: all 0.2s;
}

#game-controls button:hover:not(:disabled) {
    background: var(--accent-glow);
    transform: translateY(-2px);
}

#game-controls button:disabled {
    background: #666;
    cursor: not-allowed;
}
```

**Step 3: Commit**

```bash
git add src/ui/diceRenderer.ts src/style.css
git commit -m "feat: add click-to-select dice interaction"
```

---

## Task 7: Game State Manager

**Files:**
- Create: `src/gameState.ts`

**Step 1: Create GameState class**

```typescript
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
        this.gold = 0;
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
        // Simple progression: 10 + (level-1) * 5
        return 10 + (this.level - 1) * 5;
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
```

**Step 2: Commit**

```bash
git add src/gameState.ts
git commit -m "feat: add GameState manager"
```

---

## Task 8: Main Game Loop

**Files:**
- Create: `src/game.ts`
- Update: `src/main.ts`

**Step 1: Create Game class**

```typescript
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
        // Placeholder - implement in Task 9
        const overlay = document.getElementById('shop-overlay')!;
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div class="overlay-content">
                <h2>Shop</h2>
                <p>Gold: ${this.state.gold}</p>
                <p>(Shop items coming soon)</p>
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
```

**Step 2: Verify game loop works**

```bash
npm run dev
```

Run: Open http://localhost:5173
Expected: 
- Click "Roll Dice" shows 3 dice
- Click die to select (golden border)
- Click arrangement zone to place
- After arranging all 3, "Confirm" button enables
- Click Confirm shows step-by-step resolution animation
- Win/loss triggers correctly

**Step 3: Commit**

```bash
git add src/game.ts src/main.ts
git commit -m "feat: implement main game loop with resolution visualization"
```

---

## Task 9: Shop System

**Files:**
- Create: `src/shop.ts`
- Create: `src/ui/shopRenderer.ts`
- Update: `src/game.ts`
- Update: `src/style.css`

**Step 1: Create Shop class**

```typescript
// src/shop.ts
import type { Die, Modifier } from './types';
import { DieImpl } from './dice';
import { AddModifier, MultiplyModifier, NextAddModifier, GlobalMultiplyModifier } from './modifiers';

export interface ShopItem {
    type: 'modifier' | 'die';
    item?: Modifier;
    die?: Die;
    name: string;
    description: string;
    price: number;
}

export class Shop {
    generateItems(level: number): ShopItem[] {
        const items: ShopItem[] = [];
        
        // Always offer 2-3 modifiers
        items.push(this.randomModifier(level));
        items.push(this.randomModifier(level));
        
        // 50% chance for special die
        if (Math.random() > 0.5) {
            items.push(this.randomSpecialDie(level));
        }
        
        return items;
    }

    private randomModifier(level: number): ShopItem {
        const types = [
            { 
                create: () => new AddModifier(Math.ceil(level / 2) + 1), 
                price: 5 + level,
                name: (m: Modifier) => m.name,
                desc: (m: Modifier) => m.description
            },
            { 
                create: () => new MultiplyModifier(2), 
                price: 10 + level * 2,
                name: (m: Modifier) => m.name,
                desc: (m: Modifier) => m.description
            },
            { 
                create: () => new NextAddModifier(3), 
                price: 8 + level,
                name: (m: Modifier) => m.name,
                desc: (m: Modifier) => m.description
            },
            { 
                create: () => new GlobalMultiplyModifier(1.5), 
                price: 15 + level * 2,
                name: (m: Modifier) => m.name,
                desc: (m: Modifier) => m.description
            }
        ];
        
        const choice = types[Math.floor(Math.random() * types.length)];
        const modifier = choice.create();
        
        return {
            type: 'modifier',
            item: modifier,
            name: choice.name(modifier),
            description: choice.desc(modifier),
            price: choice.price
        };
    }

    private randomSpecialDie(level: number): ShopItem {
        const dieTypes = [
            { faces: [2, 2, 4, 4, 6, 6], name: 'Even Die', desc: 'Faces: 2,2,4,4,6,6', price: 12 },
            { faces: [1, 1, 1, 6, 6, 6], name: 'Extreme Die', desc: 'Faces: 1,1,1,6,6,6', price: 10 },
            { faces: [3, 3, 3, 3, 3, 3], name: 'Triple Die', desc: 'All faces are 3', price: 8 }
        ];
        
        const choice = dieTypes[Math.floor(Math.random() * dieTypes.length)];
        
        return {
            type: 'die',
            die: new DieImpl(`special-${Date.now()}`, choice.faces),
            name: choice.name,
            description: choice.desc,
            price: choice.price + level * 2
        };
    }
}
```

**Step 2: Create ShopRenderer**

```typescript
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
```

**Step 3: Add shop CSS**

Add to `src/style.css`:

```css
/* Overlay Styles */
#shop-overlay, #game-over-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.overlay-content {
    background: var(--bg-secondary);
    padding: 2rem;
    border-radius: 16px;
    border: 2px solid var(--accent);
    text-align: center;
    max-width: 500px;
    width: 90%;
}

.shop-content h2 {
    color: var(--gold);
    margin-bottom: 0.5rem;
}

.shop-gold {
    font-size: 1.2rem;
    margin-bottom: 1rem;
}

.shop-gold .gold {
    color: var(--gold);
    font-weight: bold;
}

.shop-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1.5rem 0;
    max-height: 50vh;
    overflow-y: auto;
}

.shop-item {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid var(--text-secondary);
    text-align: left;
}

.item-name {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--accent-glow);
}

.item-desc {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin: 0.5rem 0;
}

.item-price {
    color: var(--gold);
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.target-select {
    margin: 0.5rem 0;
    padding: 0.3rem 0.5rem;
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--text-secondary);
    border-radius: 4px;
}

.buy-btn, #skip-shop-btn, #restart-btn {
    background: var(--accent);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 0.5rem;
    transition: background 0.2s;
}

.buy-btn:hover:not(:disabled), #skip-shop-btn:hover, #restart-btn:hover {
    background: var(--accent-glow);
}

.buy-btn:disabled {
    background: #666;
    cursor: not-allowed;
}

#skip-shop-btn {
    margin-top: 1rem;
    padding: 0.8rem 2rem;
}
```

**Step 4: Integrate shop into Game class**

Update `src/game.ts` showShop method to use Shop and ShopRenderer

**Step 5: Commit**

```bash
git add src/shop.ts src/ui/shopRenderer.ts src/game.ts src/style.css
git commit -m "feat: add shop system with modifiers and special dice"
```

---

## Task 10: Final Integration & Testing

**Files:**
- All files

**Step 1: Full playthrough test**

```bash
npm run dev
```

Run: Open http://localhost:5173, play through 5+ levels

**Expected behaviors:**
1. ✓ Roll dice works
2. ✓ Click-to-select and place works
3. ✓ Chain resolution shows step-by-step animation
4. ✓ Win/loss detection works
5. ✓ Shop appears after win
6. ✓ Can buy modifiers
7. ✓ Modifiers affect future rounds (visible in resolution)
8. ✓ Game over on loss
9. ✓ Restart works

**Step 2: Build production bundle**

```bash
npm run build
```

Expected: `dist/` folder created with minified files

**Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete MVP implementation with TypeScript"
```

---

## Verification Summary

### Dev Server Testing
```bash
npm run dev
# Open http://localhost:5173
```

### Build Verification
```bash
npm run build
npm run preview
# Open http://localhost:4173
```

### Manual Testing Checklist
1. [ ] Roll dice and verify random values appear
2. [ ] Click die to select (golden border appears)
3. [ ] Click arrangement zone to place selected die
4. [ ] Verify only unplaced dice remain in tray
5. [ ] Confirm button enables when all dice placed
6. [ ] Resolution shows step-by-step with animations
7. [ ] Win a level and verify shop appears
8. [ ] Buy a modifier and verify gold deducted
9. [ ] Play next round and verify modifier shows in resolution
10. [ ] Lose a level and verify game over screen
11. [ ] Restart and verify clean state

---

## File Structure (Final)

```
dice-game/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts
│   ├── game.ts
│   ├── gameState.ts
│   ├── dice.ts
│   ├── types.ts
│   ├── modifiers.ts
│   ├── resolver.ts
│   ├── shop.ts
│   ├── style.css
│   ├── ui/
│   │   ├── diceRenderer.ts
│   │   ├── resolutionRenderer.ts
│   │   └── shopRenderer.ts
│   └── tests/
│       └── dice.test.ts
└── docs/
    ├── design.md
    └── plans/
        └── 2025-02-04-dice-roguelike-mvp.md
```
