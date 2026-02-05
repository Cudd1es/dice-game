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
        this.name = `x${factor}`;
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
        this.name = `All x${factor}`;
        this.description = `Multiply ALL subsequent dice by ${factor}`;
    }

    apply(context: ModifierContext): number {
        context.chainState.globalMultiplier *= this.factor;
        return context.currentValue;
    }
}
