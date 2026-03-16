export class SandSimulation {
    constructor() {
        this.materials = {
            SAND: { color: '#e6c27a', type: 'SAND', density: 2 },
            WATER: { color: '#4da6ff', type: 'WATER', density: 1, spreadRate: 5 },
            STONE: { color: '#888888', type: 'SOLID', density: Infinity },
            WOOD: { color: '#8b5a2b', type: 'SOLID', density: Infinity }
        };

        this.paletteColors = [
            this.materials.SAND.color,
            this.materials.WATER.color,
            this.materials.STONE.color,
            this.materials.WOOD.color,
            null // Gomme
        ];
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', 'Falling Sand Physics');
        engine.debugDisplay.setCustomData('Edition', 'Shift + Clic Gauche (Pinceau)');
        engine.debugDisplay.setCustomData('Palette', 'Touche C');
        
        engine.timeControl.setTPS(60);

        engine.colorPalette.colors = this.paletteColors;
        engine.colorPalette.selectedColor = this.paletteColors[0];

        if (!dataLoaded) {
            for (let x = -10; x <= 10; x++) {
                engine.grid.setCell(x, 10, { color: this.materials.STONE.color, type: 'SOLID', density: Infinity });
            }
            for (let y = 0; y <= 10; y++) {
                engine.grid.setCell(-10, y, { color: this.materials.STONE.color, type: 'SOLID', density: Infinity });
                engine.grid.setCell(10, y, { color: this.materials.STONE.color, type: 'SOLID', density: Infinity });
            }
        }
    }

    getMaterialFromColor(color) {
        if (!color) return null;
        for (const mat of Object.values(this.materials)) {
            if (mat.color === color) return mat;
        }
        return { color: color, type: 'SAND', density: 2 };
    }

    handleInputs(engine) {
        const { inputManager, camera, grid, cellSize, colorPalette } = engine;
        const { mouseState } = inputManager;

        const selectedTool = colorPalette.selectedColor === null ? 'Gomme' : colorPalette.selectedColor;
        engine.debugDisplay.setCustomData('Outil', selectedTool);

        if (mouseState.isDown && mouseState.isEditing) {
            const worldPos = camera.screenToWorld(mouseState.screenX, mouseState.screenY);
            const centerX = Math.floor(worldPos.x / cellSize);
            const centerY = Math.floor(worldPos.y / cellSize);
            
            const brushSize = 2;
            const material = this.getMaterialFromColor(colorPalette.selectedColor);

            for (let dx = -brushSize; dx <= brushSize; dx++) {
                for (let dy = -brushSize; dy <= brushSize; dy++) {
                    if (dx*dx + dy*dy <= brushSize*brushSize) {
                        if (colorPalette.selectedColor === null) {
                            grid.setCell(centerX + dx, centerY + dy, null);
                        } else if (!grid.getCell(centerX + dx, centerY + dy)) {
                            const chance = material.type === 'SOLID' ? 1.0 : 0.3;
                            if (Math.random() <= chance) {
                                grid.setCell(centerX + dx, centerY + dy, { ...material });
                            }
                        }
                    }
                }
            }
        }
    }

    onTick(dt, engine) {
        const cellsToUpdate = [];
        const updatedCells = new Set();

        for (const chunk of engine.grid.chunks.values()) {
            for (const [localKey, data] of chunk.cells.entries()) {
                if (data.type !== 'SOLID') {
                    const [localX, localY] = localKey.split(',').map(Number);
                    cellsToUpdate.push({
                        x: chunk.x * 32 + localX,
                        y: chunk.y * 32 + localY,
                        data: data
                    });
                }
            }
        }

        cellsToUpdate.sort((a, b) => {
            if (a.y !== b.y) return b.y - a.y;
            return Math.random() - 0.5;
        });

        for (const cell of cellsToUpdate) {
            if (updatedCells.has(`${cell.x},${cell.y}`)) continue;
            const { x, y, data } = cell;

            const swap = (nx, ny) => {
                updatedCells.add(`${nx},${ny}`);
                const targetData = engine.grid.getCell(nx, ny);
                engine.grid.setCell(nx, ny, data);
                engine.grid.setCell(x, y, targetData);
                cell.x = nx;
                cell.y = ny;
            };

            const canDisplace = (targetData, sourceData) => {
                if (!targetData) return true; // C'est vide
                if (targetData.type === 'SOLID') return false; // C'est dur
                return targetData.density < sourceData.density; // C'est plus léger
            };

            if (data.type === 'SAND') {
                const down = engine.grid.getCell(x, y + 1);
                
                if (canDisplace(down, data)) {
                    swap(x, y + 1);
                } else {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const downLeft = engine.grid.getCell(x - dir, y + 1);
                    const downRight = engine.grid.getCell(x + dir, y + 1);

                    if (canDisplace(downLeft, data)) {
                        swap(x - dir, y + 1);
                    } else if (canDisplace(downRight, data)) {
                        swap(x + dir, y + 1);
                    }
                }
            }
            else if (data.type === 'WATER') {
                const down = engine.grid.getCell(x, y + 1);
                
                if (canDisplace(down, data)) {
                    swap(x, y + 1);
                } else {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const downSide1 = engine.grid.getCell(x - dir, y + 1);
                    const downSide2 = engine.grid.getCell(x + dir, y + 1);

                    if (canDisplace(downSide1, data)) {
                        swap(x - dir, y + 1);
                    } else if (canDisplace(downSide2, data)) {
                        swap(x + dir, y + 1);
                    } else {
                        let targetX = x;
                        for (let i = 1; i <= data.spreadRate; i++) {
                            const sideCell = engine.grid.getCell(x + dir * i, y);
                            if (canDisplace(sideCell, data)) {
                                targetX = x + dir * i;
                            } else {
                                break;
                            }
                        }
                        if (targetX !== x) {
                            swap(targetX, y);
                        } else {
                            for (let i = 1; i <= data.spreadRate; i++) {
                                const sideCell = engine.grid.getCell(x - dir * i, y);
                                if (canDisplace(sideCell, data)) {
                                    targetX = x - dir * i;
                                } else {
                                    break;
                                }
                            }
                            if (targetX !== x) {
                                swap(targetX, y);
                            }
                        }
                    }
                }
            }
        }
    }

    onRender(ctx, camera) {
    }
}