export class SandSimulation {
    constructor() {
        this.materials = {
            SAND: { color: '#e6c27a', type: 'SAND', density: 3 },
            WATER: { color: '#4da6ff', type: 'WATER', density: 1, spreadRate: 5 },
            STONE: { color: '#888888', type: 'SOLID', density: Infinity },
            WOOD: { color: '#8b5a2b', type: 'WOOD', density: Infinity, flammability: 0.1, health: 100 },
            LAVA: { color: '#ff4500', type: 'LAVA', density: 2, spreadRate: 2, flowDelay: 3 },
            EMBER: { color: '#ff7800', type: 'EMBER', density: 1 },
            VOID: { color: '#1a1a1a', type: 'KILL', density: 0 }
        };

        this.paletteColors = [
            this.materials.SAND.color,
            this.materials.WATER.color,
            this.materials.LAVA.color,
            this.materials.STONE.color,
            this.materials.WOOD.color,
            this.materials.VOID.color,
            null
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
            for (let x = -20; x <= 20; x++) {
                engine.grid.setCell(x, 10, { ...this.materials.STONE });
            }
            for (let y = -20; y <= 10; y++) {
                engine.grid.setCell(-20, y, { ...this.materials.STONE });
                engine.grid.setCell(20, y, { ...this.materials.STONE });
            }
            for (let x = -100; x <= 100; x++) {
                engine.grid.setCell(x, 50, { ...this.materials.VOID });
            }
        }
    }

    getMaterialFromColor(color) {
        if (!color) return null;
        for (const mat of Object.values(this.materials)) {
            if (mat.color === color) return mat;
        }
        return { color: color, type: 'SAND', density: 3 };
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
                            const chance = (material.type === 'SOLID' || material.type === 'WOOD') ? 1.0 : 0.3;
                            if (Math.random() <= chance) {
                                grid.setCell(centerX + dx, centerY + dy, { ...material, tickCounter: 0 });
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
                if (data.type !== 'SOLID' && data.type !== 'KILL') {
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
                const targetData = engine.grid.getCell(nx, ny);
                if (targetData && targetData.type === 'KILL') {
                    engine.grid.setCell(x, y, null);
                    updatedCells.add(`${x},${y}`);
                    return;
                }
                updatedCells.add(`${nx},${ny}`);
                engine.grid.setCell(nx, ny, data);
                engine.grid.setCell(x, y, targetData);
                cell.x = nx;
                cell.y = ny;
            };

            const canDisplace = (targetData, sourceData) => {
                if (!targetData) return true;
                if (targetData.type === 'SOLID' || targetData.type === 'WOOD') return false;
                return targetData.density < sourceData.density;
            };

            if (data.type === 'EMBER') {
                data.health = (data.health || 100) - 1;
                if (data.health <= 0) {
                    engine.grid.setCell(x, y, null);
                    continue;
                }
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const neighbor = engine.grid.getCell(x + dx, y + dy);
                        if (neighbor && neighbor.type === 'WOOD' && Math.random() < neighbor.flammability) {
                            neighbor.type = 'EMBER';
                            neighbor.color = this.materials.EMBER.color;
                            neighbor.health = this.materials.WOOD.health;
                        }
                    }
                }
            }

            let interacted = false;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const neighbor = engine.grid.getCell(x + dx, y + dy);
                    if (!neighbor) continue;

                    if (data.type === 'LAVA') {
                        if (neighbor.type === 'WATER') {
                            engine.grid.setCell(x, y, { ...this.materials.STONE });
                            interacted = true; break;
                        }
                        if (neighbor.type === 'WOOD' && Math.random() < 0.5) {
                            neighbor.type = 'EMBER';
                            neighbor.color = this.materials.EMBER.color;
                            neighbor.health = this.materials.WOOD.health;
                        }
                    }
                }
                if (interacted) break;
            }
            if (interacted) continue;


            if (data.type === 'SAND') {
                const down = engine.grid.getCell(x, y + 1);
                if (canDisplace(down, data)) { swap(x, y + 1); }
                else {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const dLeft = engine.grid.getCell(x - dir, y + 1);
                    const dRight = engine.grid.getCell(x + dir, y + 1);
                    if (canDisplace(dLeft, data)) { swap(x - dir, y + 1); }
                    else if (canDisplace(dRight, data)) { swap(x + dir, y + 1); }
                }
            }
            else if (data.type === 'WATER' || data.type === 'LAVA') {
                if (data.type === 'LAVA') {
                    data.tickCounter = (data.tickCounter || 0) + 1;
                    if (data.tickCounter % data.flowDelay !== 0) continue;
                }

                const down = engine.grid.getCell(x, y + 1);
                if (canDisplace(down, data)) {
                    swap(x, y + 1);
                } else {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const dSide1 = engine.grid.getCell(x - dir, y + 1);
                    const dSide2 = engine.grid.getCell(x + dir, y + 1);

                    if (canDisplace(dSide1, data)) { swap(x - dir, y + 1); }
                    else if (canDisplace(dSide2, data)) { swap(x + dir, y + 1); }
                    else {
                        let moved = false;
                        for (let i = 1; i <= data.spreadRate; i++) {
                            const nextCell = engine.grid.getCell(x + dir * i, y);
                            if (canDisplace(nextCell, data)) {
                                swap(x + dir * i, y);
                                moved = true;
                                break;
                            } else {
                                break;
                            }
                        }
                        if (!moved) {
                            for (let i = 1; i <= data.spreadRate; i++) {
                                const nextCell = engine.grid.getCell(x - dir * i, y);
                                if (canDisplace(nextCell, data)) {
                                    swap(x - dir * i, y);
                                    break;
                                } else {
                                    break;
                                }
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
