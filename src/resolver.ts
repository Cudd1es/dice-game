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
            nextMultiplier: 1,
            globalMultiplier: 1,
            stackBonus: 0,
            stackIncrement: 0
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

            // Apply incoming chain multiplier (from conditional modifiers)
            if (chainState.nextMultiplier !== 1) {
                const before = value;
                value = Math.floor(value * chainState.nextMultiplier);
                appliedEffects.push({
                    source: `Chain: x${chainState.nextMultiplier}`,
                    valueBefore: before,
                    valueAfter: value
                });
                chainState.nextMultiplier = 1;
            }

            // Apply global multiplier
            if (chainState.globalMultiplier !== 1) {
                const before = value;
                value = Math.floor(value * chainState.globalMultiplier);
                appliedEffects.push({
                    source: `Chain: x${chainState.globalMultiplier}`,
                    valueBefore: before,
                    valueAfter: value
                });
            }

            // Apply stack bonus (increases each die)
            if (chainState.stackBonus > 0) {
                const before = value;
                value += chainState.stackBonus;
                appliedEffects.push({
                    source: `Stack: +${chainState.stackBonus}`,
                    valueBefore: before,
                    valueAfter: value
                });
            }
            // Increase stack for next die
            chainState.stackBonus += chainState.stackIncrement;

            // Apply die-level modifiers
            for (const mod of die.modifiers) {
                const before = value;
                value = mod.apply({
                    currentValue: value,
                    dieIndex: i,
                    allDice: arrangedDice,
                    chainState
                });
                if (value !== before || mod.type === 'next' || mod.type === 'global' || mod.type === 'stack' || mod.type === 'conditional') {
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
                if (value !== before || mod.type === 'next' || mod.type === 'global' || mod.type === 'stack' || mod.type === 'conditional') {
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
