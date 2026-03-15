/**
 * Template de base pour la création d'un projet/règle.
 * Ce fichier ne doit pas être modifié directement.
 * Copiez-le dans le dossier /src/projects/ et renommez la classe.
 */
export class BaseRule {
    constructor() {
        // Initialisez ici les variables d'état de votre projet
        // ex: this.time = 0;
    }

    /**
     * Appelé une seule fois au chargement du projet.
     * Idéal pour configurer la grille initiale ou l'interface de debug.
     * @param {Object} engine - L'instance du moteur principal (Core)
     */
    onInit(engine) {
        // engine.debugDisplay.setCustomData('Projet', 'Mon Nouveau Projet');
        // engine.grid.setCell(0, 0, { color: '#ff0000' });
    }

    /**
     * Appelé à chaque frame avant le rendu.
     * C'est ici que réside la logique de mise à jour (simulation, inputs).
     * @param {number} dt - Le delta time en secondes depuis la dernière frame
     * @param {Object} engine - L'instance du moteur principal (Core)
     */
    onTick(dt, engine) {
        // const { inputManager, camera, grid, colorPalette } = engine;
        // const { mouseState } = inputManager;

        // Exemple: dessiner au clic
        // if (mouseState.isDown && mouseState.isEditing) {
        //     const worldPos = camera.screenToWorld(mouseState.screenX, mouseState.screenY);
        //     const cellX = Math.floor(worldPos.x / engine.cellSize);
        //     const cellY = Math.floor(worldPos.y / engine.cellSize);
        //     grid.setCell(cellX, cellY, { color: colorPalette.selectedColor || '#fff' });
        // }
    }

    /**
     * Appelé à chaque frame après le rendu de la grille par le moteur.
     * Utilisez cette méthode UNIQUEMENT si vous avez besoin de dessiner des éléments
     * personnalisés par-dessus la grille (UI, curseurs spéciaux, effets).
     * @param {CanvasRenderingContext2D} ctx - Le contexte du canvas (déjà transformé par la caméra)
     * @param {Object} camera - L'instance de la caméra (pour les conversions d'espace si besoin)
     */
    onRender(ctx, camera) {
        // ctx.fillStyle = 'red';
        // ctx.fillRect(0, 0, 10, 10);
    }
}
