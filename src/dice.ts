// src/dice.ts
import type { Die, DieFace, Modifier } from './types';

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
