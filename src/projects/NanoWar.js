/**
 * Projet : La Guerre des Nanobots (Guerre de Territoire Haute Performance)
 * Concept : Seules les têtes chercheuses sont calculées. Le territoire généré est passif.
 */
export class NanoWar {
    constructor() {
        this.materials = {
            TERRITORY_CYAN: { type: 'TERRITORY_CYAN', color: '#004466' },
            TERRITORY_PINK: { type: 'TERRITORY_PINK', color: '#660044' },

            BOT_CYAN: { type: 'BOT_CYAN', color: '#00ffff' },
            BOT_PINK: { type: 'BOT_PINK', color: '#ff00ff' },

            WALL: { type: 'WALL', color: '#333344' },

            FLASH: { type: 'FLASH', color: '#ffffff' }
        };

        this.paletteColors = [
            { color: this.materials.BOT_CYAN.color, name: 'Colonie Cyan' },
            { color: this.materials.BOT_PINK.color, name: 'Colonie Rose' },
            { color: this.materials.WALL.color, name: 'Mur de Confinement' },
            null
        ];
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', '⚔️ Guerre des Nanobots');
        engine.debugDisplay.setCustomData('Performance', 'Optimisation Frontline & Arène');
        engine.timeControl.setTPS(60);

        engine.colorPalette.colors = this.paletteColors;
        engine.colorPalette.selectedColor = this.paletteColors[0];
        if (!engine.colorPalette.visible && engine.colorPalette.toggle) {
            engine.colorPalette.toggle();
        }

        if (!dataLoaded) {
            const arenaSize = 80;
            for (let x = -arenaSize; x <= arenaSize; x++) {
                for (let y = -arenaSize; y <= arenaSize; y++) {
                    if (x === -arenaSize || x === arenaSize || y === -arenaSize || y === arenaSize) {
                        engine.grid.setCell(x, y, { ...this.materials.WALL });
                    }
                }
            }

            this.spawnColony(engine.grid, -60, 0, 'BOT_CYAN');
            this.spawnColony(engine.grid, 60, 0, 'BOT_PINK');
        }
    }

    spawnColony(grid, cx, cy, botType) {
        for (let i = 0; i < 20; i++) {
            const x = cx + Math.floor(Math.random() * 10 - 5);
            const y = cy + Math.floor(Math.random() * 10 - 5);
            grid.setCell(x, y, { ...this.materials[botType], boredom: 0 });
        }
    }

    handleInputs(engine) {
        const { inputManager, camera, grid, cellSize, colorPalette } = engine;
        const { mouseState } = inputManager;

        if (mouseState.isDown && !mouseState.shiftKey) {
            const worldPos = camera.screenToWorld(mouseState.screenX, mouseState.screenY);
            const cx = Math.floor(worldPos.x / cellSize);
            const cy = Math.floor(worldPos.y / cellSize);

            const radius = 3;
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (dx*dx + dy*dy <= radius*radius) {
                        if (colorPalette.selectedColor === null) {
                            grid.setCell(cx + dx, cy + dy, null);
                        } else {
                            const selectedHex = colorPalette.selectedColor.color;

                            if (selectedHex === this.materials.WALL.color) {
                                grid.setCell(cx + dx, cy + dy, { ...this.materials.WALL });
                            } else if (Math.random() > 0.5) {
                                const type = selectedHex === '#00ffff' ? 'BOT_CYAN' : 'BOT_PINK';
                                grid.setCell(cx + dx, cy + dy, { ...this.materials[type], boredom: 0 });
                            }
                        }
                    }
                }
            }
        }
    }

    onTick(dt, engine) {
        const activeCells = [];
        const updatedCells = new Set();

        for (const chunk of engine.grid.chunks.values()) {
            for (const [localKey, data] of chunk.cells.entries()) {
                if (data.type.startsWith('BOT') || data.type === 'FLASH') {
                    const [localX, localY] = localKey.split(',').map(Number);
                    activeCells.push({ x: chunk.x * 32 + localX, y: chunk.y * 32 + localY, data });
                }
            }
        }

        for (const cell of activeCells) {
            const { x, y, data } = cell;
            if (updatedCells.has(`${x},${y}`)) continue;

            if (data.type === 'FLASH') {
                engine.grid.setCell(x, y, null);
                continue;
            }

            const isCyan = data.type === 'BOT_CYAN';
            const ownTrail = isCyan ? 'TERRITORY_CYAN' : 'TERRITORY_PINK';
            const enemyTrail = isCyan ? 'TERRITORY_PINK' : 'TERRITORY_CYAN';
            const enemyBot = isCyan ? 'BOT_PINK' : 'BOT_CYAN';

            const dirs = [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]];
            const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
            const tx = x + dx;
            const ty = y + dy;

            const target = engine.grid.getCell(tx, ty);

            if (!target) {
                engine.grid.setCell(tx, ty, data);
                engine.grid.setCell(x, y, { ...this.materials[ownTrail] });
                updatedCells.add(`${tx},${ty}`);
                data.boredom = 0;

                if (Math.random() < 0.03) {
                    engine.grid.setCell(x, y, { ...this.materials[data.type], boredom: 0 });
                }
            }
            else if (target.type === ownTrail) {
                data.boredom = (data.boredom || 0) + 1;

                if (data.boredom > 30) {
                    engine.grid.setCell(x, y, { ...this.materials[ownTrail] });
                } else {
                    engine.grid.setCell(tx, ty, data);
                    engine.grid.setCell(x, y, { ...this.materials[ownTrail] });
                    updatedCells.add(`${tx},${ty}`);
                }
            }
            else if (target.type === enemyTrail) {
                engine.grid.setCell(tx, ty, data);

                if (Math.random() < 0.40) {
                    engine.grid.setCell(x, y, { ...this.materials[data.type], boredom: 0 });
                } else {
                    engine.grid.setCell(x, y, { ...this.materials[ownTrail] });
                }
                updatedCells.add(`${tx},${ty}`);
                data.boredom = 0;
            }
            else if (target.type === enemyBot) {
                engine.grid.setCell(tx, ty, { ...this.materials.FLASH });
                engine.grid.setCell(x, y, { ...this.materials.FLASH });
                updatedCells.add(`${tx},${ty}`);
            }
            else if (target.type === 'WALL') {
                data.boredom = (data.boredom || 0) + 1;
                if (data.boredom > 30) {
                    engine.grid.setCell(x, y, { ...this.materials[ownTrail] });
                }
            }
        }
    }

    onRender(ctx, camera) {
    }
}