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

        const { inputManager, camera, grid, cellSize, colorPalette } = engine;
        const { mouseState } = inputManager;

        const selectedTool = colorPalette.selectedColor === null ? 'Gomme' : colorPalette.selectedColor;
        engine.debugDisplay.setCustomData('Outil', selectedTool);

        if (mouseState.isDown && mouseState.isEditing) {
            const worldPos = camera.screenToWorld(mouseState.screenX, mouseState.screenY);
            const cellX = Math.floor(worldPos.x / cellSize);
            const cellY = Math.floor(worldPos.y / cellSize);
            
            if (colorPalette.selectedColor === null) {
                grid.setCell(cellX, cellY, null);
            } else {
                grid.setCell(cellX, cellY, { color: colorPalette.selectedColor });
            }
        }
    }

    onRender(ctx, camera) {
    }
}
