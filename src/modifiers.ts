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

// Stack Modifier: Each subsequent die gets increasing bonus
export class StackAddModifier implements Modifier {
    type: 'stack' = 'stack';
    name: string;
    description: string;
    increment: number;

    constructor(increment: number) {
        this.increment = increment;
        this.name = `Stack+${increment}`;
        this.description = `Each die after this gets +${increment} more (+1, +2, +3...)`;
    }

    apply(context: ModifierContext): number {
        context.chainState.stackIncrement += this.increment;
        return context.currentValue;
    }
}

// Conditional Modifier: If current die is even, next die x2
export class IfEvenNextMultiply implements Modifier {
    type: 'conditional' = 'conditional';
    name: string;
    description: string;
    factor: number;

    constructor(factor: number = 2) {
        this.factor = factor;
        this.name = `Even→x${factor}`;
        this.description = `If this die is EVEN, next die x${factor}`;
    }

    apply(context: ModifierContext): number {
        if (context.currentValue % 2 === 0) {
            context.chainState.nextMultiplier *= this.factor;
        }
        return context.currentValue;
    }
}

// Conditional Modifier: If current die >= 4, next die +3
export class IfHighNextAdd implements Modifier {
    type: 'conditional' = 'conditional';
    name: string;
    description: string;
    threshold: number;
    bonus: number;

    constructor(threshold: number = 4, bonus: number = 3) {
        this.threshold = threshold;
        this.bonus = bonus;
        this.name = `≥${threshold}→+${bonus}`;
        this.description = `If this die is ${threshold}+, next die +${bonus}`;
    }

    apply(context: ModifierContext): number {
        if (context.currentValue >= this.threshold) {
            context.chainState.nextBonus += this.bonus;
        }
        return context.currentValue;
    }
}

// Conditional Modifier: If current die is max (6), next die x3
export class IfMaxNextMultiply implements Modifier {
    type: 'conditional' = 'conditional';
    name: string;
    description: string;
    factor: number;

    constructor(factor: number = 3) {
        this.factor = factor;
        this.name = `Max→x${factor}`;
        this.description = `If this die is 6, next die x${factor}`;
    }

    apply(context: ModifierContext): number {
        // Check if current value equals the max possible (assuming standard die)
        if (context.currentValue === 6) {
            context.chainState.nextMultiplier *= this.factor;
        }
        return context.currentValue;
    }
}
