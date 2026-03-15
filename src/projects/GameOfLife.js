export class GameOfLife {
    constructor() {
        this.time = 0;
        this.tickRate = 0.1;
        this.timeSinceLastTick = 0;
        this.isRunning = false;
        this.activeCells = new Set();
    }

    onInit(engine) {
        engine.debugDisplay.setCustomData('Projet', 'Game of Life');
        engine.debugDisplay.setCustomData('Edition', 'Shift + Clic Gauche');
        engine.debugDisplay.setCustomData('Contrôle', 'Espace (Play/Pause)');
        engine.debugDisplay.setCustomData('Palette', 'Touche C');
        
        const startX = 0;
        const startY = 0;
        
        engine.grid.setCell(startX, startY - 1, { color: '#fff' });
        engine.grid.setCell(startX + 1, startY, { color: '#fff' });
        engine.grid.setCell(startX - 1, startY + 1, { color: '#fff' });
        engine.grid.setCell(startX, startY + 1, { color: '#fff' });
        engine.grid.setCell(startX + 1, startY + 1, { color: '#fff' });

        this.handleKeyDown = (e) => {
            if (e.code === 'Space') {
                this.isRunning = !this.isRunning;
                engine.debugDisplay.setCustomData('État', this.isRunning ? 'En cours' : 'Pause');
            }
        };
        window.addEventListener('keydown', this.handleKeyDown);
    }

    onTick(dt, engine) {
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

        if (!this.isRunning) return;

        this.timeSinceLastTick += dt;
        if (this.timeSinceLastTick < this.tickRate) return;
        this.timeSinceLastTick = 0;

        const cellsToCheck = new Set();
        const aliveCells = [];
        
        for (const [chunkKey, chunk] of grid.chunks.entries()) {
            for (const [localKey, data] of chunk.cells.entries()) {
                const [localX, localY] = localKey.split(',').map(Number);
                const cellX = chunk.x * 32 + localX; // 32 est CHUNK_SIZE
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
