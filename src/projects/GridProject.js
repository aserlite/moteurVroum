export class GridProject {
    constructor() {
        this.time = 0;
    }

    onInit(engine) {
        engine.debugDisplay.setCustomData('Projet', 'GridProject Actif');
        engine.debugDisplay.setCustomData('Edition', 'Shift + Clic Gauche');
        engine.debugDisplay.setCustomData('Palette', 'Touche C');
    }

    onTick(dt, engine) {
        this.time += dt;

        const animX = Math.floor(Math.sin(this.time * 2) * 5);
        const animY = Math.floor(Math.cos(this.time * 2) * 5);
        engine.grid.setCell(animX, animY, { color: 'cyan' });

        // L'édition à la souris est maintenant gérée par le Core pour être indépendante du framerate du jeu !
        // Plus besoin de le refaire ici.
    }

    onRender(ctx, camera) {
    }
}