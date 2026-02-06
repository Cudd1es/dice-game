// src/dice.ts
import type { Die, DieFace, Modifier } from './types';
import { NextAddModifier } from './modifiers';

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
        this.currentFaceIndex = Math.floor(Math.random() * this.faces.length);
        return this.getCurrentFace();
    }

    getCurrentFace(): DieFace {
        return this.faces[this.currentFaceIndex];
    }

    getCurrentValue(): number {
        return this.getCurrentFace().getValue();
    }
}

// Double Roll Die: roll twice, take higher value
export class DoubleRollDie extends DieImpl {
    constructor(id: string) {
        super(id, [1, 2, 3, 4, 5, 6]);
    }

    roll(): DieFace {
        const roll1 = Math.floor(Math.random() * this.faces.length);
        const roll2 = Math.floor(Math.random() * this.faces.length);
        this.currentFaceIndex = this.faces[roll1].getValue() >= this.faces[roll2].getValue() ? roll1 : roll2;
        return this.getCurrentFace();
    }
}

// Copy Die: copies value of previous die in chain
export class CopyDie extends DieImpl {
    copiedValue: number = 1;

    constructor(id: string) {
        super(id, [0, 0, 0, 0, 0, 0]); // Placeholder faces
    }

    setCopiedValue(value: number): void {
        this.copiedValue = value;
    }

    getCurrentValue(): number {
        return this.copiedValue;
    }
}

// Chain Die: standard die with built-in Next+2 modifier
export class ChainDie extends DieImpl {
    constructor(id: string) {
        super(id, [1, 2, 3, 4, 5, 6]);
        this.modifiers.push(new NextAddModifier(2));
    }
}
