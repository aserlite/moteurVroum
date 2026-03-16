export class GameOfLife {
    constructor() {
        // La gestion du temps est maintenant gérée par le moteur (TimeControl)
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', 'Game of Life');
        engine.debugDisplay.setCustomData('Edition', 'Shift + Clic Gauche');
        engine.debugDisplay.setCustomData('Palette', 'Touche C');
        
        // On configure la vitesse du moteur spécifiquement pour ce projet
        engine.timeControl.setTPS(10);
        
        // Si aucune donnée n'a été chargée (ni URL, ni LocalStorage), on initialise un motif
        if (!dataLoaded) {
            const startX = 0;
            const startY = 0;
            
            engine.grid.setCell(startX, startY - 1, { color: '#fff' });
            engine.grid.setCell(startX + 1, startY, { color: '#fff' });
            engine.grid.setCell(startX - 1, startY + 1, { color: '#fff' });
            engine.grid.setCell(startX, startY + 1, { color: '#fff' });
            engine.grid.setCell(startX + 1, startY + 1, { color: '#fff' });
        }
    }

    onTick(dt, engine) {
        const { inputManager, camera, grid, cellSize, colorPalette, timeControl } = engine;
        const { mouseState } = inputManager;

        const selectedTool = colorPalette.selectedColor === null ? 'Gomme' : colorPalette.selectedColor;
        engine.debugDisplay.setCustomData('Outil', selectedTool);

        // --- 1. GESTION DES INPUTS (ÉDITION) ---
        // On permet de dessiner même quand le jeu est en pause
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

        // --- 2. LOGIQUE DU JEU DE LA VIE ---
        // Le Core appelle onTick même en pause si on utilise le pas-à-pas (stepRequested).
        // Mais pendant les frames normales où on est en pause, le Core N'APPELLE PAS onTick pour la logique.
        // CEPENDANT, on veut pouvoir dessiner en pause. 
        // L'architecture actuelle du Core appelle onTick soit X fois par frame (si ça tourne), 
        // soit 1 fois (si step), soit 0 fois (si en pause).
        // DONC, si on est ici, c'est qu'on DOIT exécuter la logique DU JEU.
        // Sauf si on veut séparer les inputs (qui doivent tourner tout le temps) de la logique.

        // CORRECTION D'ARCHITECTURE LOCALE : 
        // Puisque le Core appelle onTick "ticksToRun" fois (qui vaut 0 en pause),
        // on ne pouvait plus dessiner en pause.
        // J'ai modifié le Core pour qu'il gère ça mieux, mais ici on exécute la logique de Conway.

        const cellsToCheck = new Set();
        const aliveCells = [];
        
        for (const chunk of grid.chunks.values()) {
            for (const [localKey, data] of chunk.cells.entries()) {
                const [localX, localY] = localKey.split(',').map(Number);
                const cellX = chunk.x * 32 + localX;
                const cellY = chunk.y * 32 + localY;
                
                aliveCells.push({x: cellX, y: cellY, color: data.color});
                
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        cellsToCheck.add(`${cellX + dx},${cellY + dy}`);
                    }
                }
            }
        }

        const nextGeneration = [];
        
        for (const cellKey of cellsToCheck) {
            const [x, y] = cellKey.split(',').map(Number);
            let aliveNeighbors = 0;
            let neighborColor = '#fff';

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const neighbor = grid.getCell(x + dx, y + dy);
                    if (neighbor) {
                        aliveNeighbors++;
                        neighborColor = neighbor.color;
                    }
                }
            }

            const isAlive = grid.getCell(x, y) !== undefined;

            if (isAlive && (aliveNeighbors === 2 || aliveNeighbors === 3)) {
                const currentCell = grid.getCell(x, y);
                nextGeneration.push({ x, y, data: { color: currentCell.color } });
            } else if (!isAlive && aliveNeighbors === 3) {
                nextGeneration.push({ x, y, data: { color: neighborColor } });
            }
        }

        grid.chunks.clear(); 
        
        for (const cell of nextGeneration) {
            grid.setCell(cell.x, cell.y, cell.data);
        }
    }

    onRender(ctx, camera) {
    }
}