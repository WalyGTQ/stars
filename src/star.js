/**
 * Star.js - A time-aware star background library for web portfolios.
 * Author: Antigravity/USER
 * License: MIT
 */

class StarBackground {
    constructor(options = {}) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.animationId = null;
        
        // Default configuration
        this.config = {
            container: options.container || document.body,
            starCount: options.starCount || 150,
            baseSpeed: options.baseSpeed || 0.05,
            enableTimeAwareness: options.enableTimeAwareness !== false,
            manualTheme: options.manualTheme || null, // 'night', 'dawn', 'day', 'sunset'
            ...options
        };

        this.init();
    }

    init() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';

        this.config.container.appendChild(this.canvas);
        this.resize();

        window.addEventListener('resize', () => this.resize());
        
        this.createStars();
        this.animate();
    }

    getTheme() {
        if (this.config.manualTheme) return this.themes[this.config.manualTheme];

        const hour = new Date().getHours();
        
        if (hour >= 5 && hour < 8) return this.themes.dawn;
        if (hour >= 8 && hour < 17) return this.themes.day;
        if (hour >= 17 && hour < 20) return this.themes.sunset;
        return this.themes.night;
    }

    themes = {
        night: {
            background: 'radial-gradient(circle at center, #0a0e14 0%, #000000 100%)',
            starColors: ['#ffffff', '#e1e1e1', '#fff9e6'],
            density: 1.0,
            opacity: 0.8
        },
        dawn: {
            background: 'linear-gradient(to bottom, #2c3e50, #000000, #ff7e5f)',
            starColors: ['#ffecd2', '#fcb69f'],
            density: 0.4,
            opacity: 0.5
        },
        day: {
            background: 'linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%)',
            starColors: ['#ffffff'],
            density: 0.1,
            opacity: 0.2
        },
        sunset: {
            background: 'linear-gradient(to bottom, #203a43, #2c5364, #f46b45)',
            starColors: ['#ffd89b', '#19033d'],
            density: 0.6,
            opacity: 0.6
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createStars(); // Re-populate on resize
    }

    createStars() {
        this.stars = [];
        const theme = this.getTheme();
        const adjustedCount = Math.floor(this.config.starCount * theme.density);

        for (let i = 0; i < adjustedCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                color: theme.starColors[Math.floor(Math.random() * theme.starColors.length)],
                velocity: (Math.random() - 0.5) * this.config.baseSpeed,
                opacity: Math.random() * theme.opacity
            });
        }
    }

    draw() {
        const theme = this.getTheme();
        
        // Apply background
        this.canvas.style.background = theme.background;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fillStyle = star.color;
            this.ctx.globalAlpha = star.opacity;
            this.ctx.fill();

            // Movement logic
            star.y += star.velocity;
            if (star.y > this.canvas.height) star.y = 0;
            if (star.y < 0) star.y = this.canvas.height;
        });
    }

    animate() {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        cancelAnimationFrame(this.animationId);
        this.canvas.remove();
        window.removeEventListener('resize', this.resize);
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StarBackground;
} else if (typeof define === 'function' && define.amd) {
    define([], () => StarBackground);
} else {
    window.StarBackground = StarBackground;
}
