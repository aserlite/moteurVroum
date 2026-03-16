export class TimeControl {
    constructor() {
        this.isPaused = false;
        this.targetTPS = 60;
        this.tickInterval = 1 / this.targetTPS;
        this.accumulator = 0;
        this.stepRequested = false;

        // Slider properties
        this.tpsOptions = [1, 2, 5, 10, 20, 30, 60, 120, 300]; // Valeurs possibles du slider
        this.sliderIndex = 6; // Index par défaut (60 TPS)
        this.isDraggingSlider = false;
    }

    setTPS(tps) {
        // Si le projet force un TPS, on essaie de l'ajuster au plus proche dans nos options
        let closestIndex = 0;
        let minDiff = Infinity;
        for (let i = 0; i < this.tpsOptions.length; i++) {
            const diff = Math.abs(this.tpsOptions[i] - tps);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }
        
        this.sliderIndex = closestIndex;
        this.targetTPS = this.tpsOptions[this.sliderIndex];
        this.tickInterval = 1 / this.targetTPS;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    step() {
        this.isPaused = true;
        this.stepRequested = true;
    }

    update(dt) {
        if (this.stepRequested) {
            this.stepRequested = false;
            return 1;
        }

        if (this.isPaused) {
            return 0;
        }

        this.accumulator += dt;
        let ticksToRun = 0;
        
        // Sécurité pour éviter la spirale de la mort (si on lagge trop, on limite le rattrapage)
        if (this.accumulator > 0.5) {
            this.accumulator = 0.5;
        }

        while (this.accumulator >= this.tickInterval) {
            ticksToRun++;
            this.accumulator -= this.tickInterval;
        }

        return ticksToRun;
    }

    // Gestion de la souris pour le slider
    handleMouseDown(mouseX, mouseY, canvasWidth, canvasHeight) {
        const bounds = this.getBounds(canvasWidth, canvasHeight);
        
        // Vérifier si le clic est dans la zone entière du TimeControl
        if (mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
            mouseY >= bounds.y && mouseY <= bounds.y + bounds.height) {
            
            // Vérifier si le clic est spécifiquement sur le slider
            if (mouseY >= bounds.y + 40 && mouseY <= bounds.y + 60) {
                this.isDraggingSlider = true;
                this.updateSliderFromMouse(mouseX, bounds);
            }
            return true; // Le clic a été absorbé par l'UI
        }
        return false;
    }

    handleMouseMove(mouseX, mouseY, canvasWidth, canvasHeight) {
        if (this.isDraggingSlider) {
            const bounds = this.getBounds(canvasWidth, canvasHeight);
            this.updateSliderFromMouse(mouseX, bounds);
            return true;
        }
        return false;
    }

    handleMouseUp() {
        if (this.isDraggingSlider) {
            this.isDraggingSlider = false;
            return true;
        }
        return false;
    }

    updateSliderFromMouse(mouseX, bounds) {
        const padding = 10;
        const trackStart = bounds.x + padding;
        const trackEnd = bounds.x + bounds.width - padding;
        const trackWidth = trackEnd - trackStart;
        
        // Calculer la position relative de la souris (entre 0 et 1)
        let relativePos = (mouseX - trackStart) / trackWidth;
        relativePos = Math.max(0, Math.min(1, relativePos));
        
        // Trouver l'index le plus proche
        const steps = this.tpsOptions.length - 1;
        this.sliderIndex = Math.round(relativePos * steps);
        
        // Mettre à jour le TPS
        this.targetTPS = this.tpsOptions[this.sliderIndex];
        this.tickInterval = 1 / this.targetTPS;
    }

    getBounds(canvasWidth, canvasHeight) {
        const boxWidth = 200;
        const boxHeight = 90; // Agrandi pour faire de la place au slider
        const padding = 10;
        const boxX = canvasWidth - boxWidth - padding;
        const boxY = canvasHeight - boxHeight - padding;
        return { x: boxX, y: boxY, width: boxWidth, height: boxHeight, padding };
    }

    render(ctx) {
        ctx.save();
        ctx.resetTransform();

        const bounds = this.getBounds(ctx.canvas.width, ctx.canvas.height);

        // Fond
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 8);
        ctx.fill();
        ctx.stroke();

        // Texte statique
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        ctx.fillText(`Statut: ${this.isPaused ? '⏸️ PAUSE' : '▶️ PLAY'}`, bounds.x + bounds.padding, bounds.y + bounds.padding);
        ctx.fillText(`Vitesse: ${this.targetTPS} TPS`, bounds.x + bounds.padding, bounds.y + bounds.padding + 20);
        
        // DESSIN DU SLIDER
        const trackY = bounds.y + bounds.padding + 45;
        const trackStart = bounds.x + bounds.padding;
        const trackWidth = bounds.width - bounds.padding * 2;
        
        // Ligne de fond (piste)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(trackStart, trackY);
        ctx.lineTo(trackStart + trackWidth, trackY);
        ctx.stroke();

        // Position du curseur
        const steps = this.tpsOptions.length - 1;
        const progress = this.sliderIndex / steps;
        const knobX = trackStart + trackWidth * progress;

        // Ligne active (verte)
        ctx.strokeStyle = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(trackStart, trackY);
        ctx.lineTo(knobX, trackY);
        ctx.stroke();

        // Curseur (bouton)
        ctx.fillStyle = this.isDraggingSlider ? '#fff' : '#ddd';
        ctx.beginPath();
        ctx.arc(knobX, trackY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Raccourci en bas
        ctx.fillStyle = '#aaa';
        ctx.font = '11px monospace';
        ctx.fillText(`(Espace: Play/Pause | N: Step)`, bounds.x + bounds.padding, bounds.y + bounds.height - bounds.padding - 10);

        ctx.restore();
    }
}
