export class ColorPalette {
    constructor() {
        this.isOpen = false;
        this.colors = ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', null];
        this.selectedColor = this.colors[0];
        this.swatchSize = 30;
        this.padding = 10;
    }

    toggle() {
        this.isOpen = !this.isOpen;
    }

    handleClick(screenX, screenY) {
        if (!this.isOpen) return false;

        const { x, y, width, height } = this.getBounds();
        if (screenX < x || screenX > x + width || screenY < y || screenY > y + height) {
            return false;
        }

        const localX = screenX - x - this.padding;
        const localY = screenY - y - this.padding;

        const cols = 5;
        const col = Math.floor(localX / (this.swatchSize + this.padding));
        const row = Math.floor(localY / (this.swatchSize + this.padding));

        const index = row * cols + col;
        if (index >= 0 && index < this.colors.length) {
            this.selectedColor = this.colors[index];
        }

        return true;
    }

    getBounds() {
        const cols = 5;
        const rows = Math.ceil(this.colors.length / cols);
        const width = cols * (this.swatchSize + this.padding) + this.padding;
        const height = rows * (this.swatchSize + this.padding) + this.padding;
        const x = (window.innerWidth - width) / 2;
        const y = window.innerHeight - height - 20;
        return { x, y, width, height };
    }

    render(ctx) {
        if (!this.isOpen) return;

        const { x, y, width, height } = this.getBounds();
        const cols = 5;

        ctx.save();
        ctx.resetTransform();

        ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();
        ctx.stroke();

        for (let i = 0; i < this.colors.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const swatchX = x + this.padding + col * (this.swatchSize + this.padding);
            const swatchY = y + this.padding + row * (this.swatchSize + this.padding);

            if (this.colors[i] === null) {
                ctx.fillStyle = '#333';
                ctx.fillRect(swatchX, swatchY, this.swatchSize, this.swatchSize);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(swatchX + 5, swatchY + 5);
                ctx.lineTo(swatchX + this.swatchSize - 5, swatchY + this.swatchSize - 5);
                ctx.moveTo(swatchX + this.swatchSize - 5, swatchY + 5);
                ctx.lineTo(swatchX + 5, swatchY + this.swatchSize - 5);
                ctx.stroke();
            } else {
                ctx.fillStyle = this.colors[i];
                ctx.fillRect(swatchX, swatchY, this.swatchSize, this.swatchSize);
            }

            if (this.colors[i] === this.selectedColor) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.strokeRect(swatchX - 1.5, swatchY - 1.5, this.swatchSize + 3, this.swatchSize + 3);
            }
        }

        ctx.restore();
    }
}
