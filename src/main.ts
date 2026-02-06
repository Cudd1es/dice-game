// src/main.ts
import './style.css';
import { Game } from './game';

declare global {
    interface Window {
        game: Game;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
    window.game = game;
    console.log('🎲 Game initialized! Use window.game.addGold(100) or window.game.addSpecialDice("lucky7") to test.');
});
