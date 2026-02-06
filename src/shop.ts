// src/shop.ts
import type { Die, Modifier } from './types';
import { DieImpl, DoubleRollDie, CopyDie, ChainDie } from './dice';
import {
    AddModifier,
    MultiplyModifier,
    NextAddModifier,
    GlobalMultiplyModifier,
    StackAddModifier,
    IfEvenNextMultiply,
    IfHighNextAdd,
    IfMaxNextMultiply,
    FaceUpgradeModifier
} from './modifiers';

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
                price: 4 + level,
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
            },
            // New modifier types
            {
                create: () => new StackAddModifier(1),
                price: 12 + level * 2,
                name: (m: Modifier) => m.name,
                desc: (m: Modifier) => m.description
            },
            {
                create: () => new IfEvenNextMultiply(2),
                price: 10 + level,
                name: (m: Modifier) => m.name,
                desc: (m: Modifier) => m.description
            },
            {
                create: () => new IfHighNextAdd(4, 3),
                price: 8 + level,
                name: (m: Modifier) => m.name,
                desc: (m: Modifier) => m.description
            },
            {
                create: () => new IfMaxNextMultiply(3),
                price: 14 + level * 2,
                name: (m: Modifier) => m.name,
                desc: (m: Modifier) => m.description
            },
            // Face upgrade modifier - randomly selects a face value to upgrade
            {
                create: () => new FaceUpgradeModifier(1),
                price: 6 + level,
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
        interface DieType {
            create: () => Die;
            name: string;
            desc: string;
            price: number;
        }

        const dieTypes: DieType[] = [
            // Original dice
            { create: () => new DieImpl(`even-${Date.now()}`, [2, 2, 4, 4, 6, 6]), name: 'Even Die', desc: 'Faces: 2,2,4,4,6,6', price: 12 },
            { create: () => new DieImpl(`extreme-${Date.now()}`, [1, 1, 6, 6, 6, 6]), name: 'Extreme Die', desc: 'Faces: 1,1,6,6,6,6 (high risk, high reward)', price: 14 },
            { create: () => new DieImpl(`quad-${Date.now()}`, [4, 4, 4, 4, 4, 4]), name: 'Quad Die', desc: 'All faces are 4 (consistent)', price: 10 },
            // Special ability dice
            { create: () => new DoubleRollDie(`double-${Date.now()}`), name: 'Double Roll Die', desc: 'Rolls twice, takes higher', price: 20 },
            { create: () => new CopyDie(`copy-${Date.now()}`), name: 'Copy Die', desc: 'Copies previous die value', price: 18 },
            { create: () => new ChainDie(`chain-${Date.now()}`), name: 'Chain Die', desc: 'Standard die + Next+2 built-in', price: 16 }
        ];

        const choice = dieTypes[Math.floor(Math.random() * dieTypes.length)];

        return {
            type: 'die',
            die: choice.create(),
            name: choice.name,
            description: choice.desc,
            price: choice.price + level * 2
        };
    }
}
