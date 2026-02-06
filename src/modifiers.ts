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

// Conditional Modifier: If NEXT die is even, next die x2
export class IfEvenNextMultiply implements Modifier {
    type: 'conditional' = 'conditional';
    name: string;
    description: string;
    factor: number;

    constructor(factor: number = 2) {
        this.factor = factor;
        this.name = `Next Even→x${factor}`;
        this.description = `If NEXT die is EVEN, it gets x${factor}`;
    }

    apply(context: ModifierContext): number {
        const nextDie = context.allDice[context.dieIndex + 1];
        if (nextDie) {
            const nextValue = nextDie.getCurrentValue();
            if (nextValue % 2 === 0) {
                context.chainState.nextMultiplier *= this.factor;
            }
        }
        return context.currentValue;
    }
}

// Conditional Modifier: If NEXT die >= 4, next die +3
export class IfHighNextAdd implements Modifier {
    type: 'conditional' = 'conditional';
    name: string;
    description: string;
    threshold: number;
    bonus: number;

    constructor(threshold: number = 4, bonus: number = 3) {
        this.threshold = threshold;
        this.bonus = bonus;
        this.name = `Next≥${threshold}→+${bonus}`;
        this.description = `If NEXT die is ${threshold}+, it gets +${bonus}`;
    }

    apply(context: ModifierContext): number {
        const nextDie = context.allDice[context.dieIndex + 1];
        if (nextDie) {
            const nextValue = nextDie.getCurrentValue();
            if (nextValue >= this.threshold) {
                context.chainState.nextBonus += this.bonus;
            }
        }
        return context.currentValue;
    }
}

// Conditional Modifier: If NEXT die is max (6), next die x3
export class IfMaxNextMultiply implements Modifier {
    type: 'conditional' = 'conditional';
    name: string;
    description: string;
    factor: number;

    constructor(factor: number = 3) {
        this.factor = factor;
        this.name = `Next Max→x${factor}`;
        this.description = `If NEXT die is 6, it gets x${factor}`;
    }

    apply(context: ModifierContext): number {
        const nextDie = context.allDice[context.dieIndex + 1];
        if (nextDie) {
            const nextValue = nextDie.getCurrentValue();
            // Check if next value equals the max possible (assuming standard die)
            if (nextValue === 6) {
                context.chainState.nextMultiplier *= this.factor;
            }
        }
        return context.currentValue;
    }
}

// Face Upgrade Modifier: Permanently increases a specific face of a die by 1
// This modifier triggers a face selection UI when bought
export class FaceUpgradeModifier implements Modifier {
    type: 'faceUpgrade' = 'faceUpgrade';
    name: string;
    description: string;
    upgradeAmount: number;

    constructor(upgradeAmount: number = 1) {
        this.upgradeAmount = upgradeAmount;
        this.name = `Face Upgrade +${upgradeAmount}`;
        this.description = `Permanently upgrade a chosen face by +${upgradeAmount}`;
    }

    // This apply method doesn't change current value
    apply(context: ModifierContext): number {
        return context.currentValue;
    }
}
