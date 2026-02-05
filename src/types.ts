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
    source: string;  // e.g., "Chain: +2", "Modifier: x2"
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
