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
                    <span class="effect-calc">${effect.valueBefore} -> ${effect.valueAfter}</span>
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
