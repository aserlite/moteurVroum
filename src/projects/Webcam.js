/**
 * Projet : Webcam
 * Concept : Affichage du flux vidéo en temps réel dans la grille du moteur.
 */
export class Webcam {
    constructor() {
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.style.display = 'none';

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        this.width = 106;
        this.height = 60;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.streamActive = false;
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', '📷 Webcam Matrix');
        engine.debugDisplay.setCustomData('Résolution', `${this.width} x ${this.height}`);

        engine.timeControl.setTPS(30);
        engine.colorPalette.colors = [];
        engine.colorPalette.enabled = false;

        if (!dataLoaded) {
            navigator.mediaDevices.getUserMedia({ video: { width: 426, height: 240 } })
                .then(stream => {
                    this.video.srcObject = stream;
                    this.streamActive = true;
                })
                .catch(err => {
                    console.error("Erreur Webcam :", err);
                    engine.debugDisplay.setCustomData('Erreur', 'Caméra non autorisée/trouvée');
                });
        }
    }

    rgbToHex(r, g, b) {
        return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
    }

    onTick(dt, engine) {
        if (!this.streamActive || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) return;

        this.ctx.drawImage(this.video, 0, 0, this.width, this.height);

        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;

        const offsetX = -Math.floor(this.width / 2);
        const offsetY = -Math.floor(this.height / 2);

        const updatedCells = new Set();

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const index = (y * this.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                const mirrorX = offsetX + (this.width - 1 - x);
                const finalY = offsetY + y;

                const hexColor = this.rgbToHex(r, g, b);

                const currentCell = engine.grid.getCell(mirrorX, finalY);
                if (!currentCell || currentCell.color !== hexColor) {
                    engine.grid.setCell(mirrorX, finalY, { type: 'CAM_PIXEL', color: hexColor });
                    updatedCells.add(`${mirrorX},${finalY}`);
                }
            }
        }
    }

    onRender(ctx, camera) {}
}