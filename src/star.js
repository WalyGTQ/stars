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
            manualTheme: options.manualTheme || null, 
            interactive: options.interactive !== false,
            parallaxFactor: options.parallaxFactor || 0.03,
            ...options
        };

        this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
        this.parallax = { x: 0, y: 0 };
        this.hover = {
            timer: null,
            target: null,
            startTime: 0,
            isShowing: false
        };

        this.init();
    }

    init() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'auto'; // Needed for hover

        this.config.container.appendChild(this.canvas);
        
        // Tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.style.cssText = `
            position: fixed;
            padding: 12px 20px;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            border-radius: 12px;
            font-family: 'Outfit', sans-serif;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 1000;
            font-size: 14px;
        `;
        document.body.appendChild(this.tooltip);

        this.resize();

        window.addEventListener('resize', () => this.resize());
        
        if (this.config.interactive) {
            window.addEventListener('mousemove', (e) => {
                this.mouse.tx = (e.clientX - window.innerWidth / 2) * this.config.parallaxFactor;
                this.mouse.ty = (e.clientY - window.innerHeight / 2) * this.config.parallaxFactor;
                this.checkHover(e.clientX, e.clientY);
            });
        }
        
        this.createStars();
        this.createCelestialBodies();
        this.animate();
    }

    createCelestialBodies() {
        this.bodies = [];
        const theme = this.getTheme();
        if (theme.name === 'day') return;

        // Simplified Moon Calculation (Approximate phase)
        const date = new Date();
        const lp = 2551443; 
        const new_moon = new Date(1970, 0, 7, 20, 35, 0);
        const phase = ((date.getTime() - new_moon.getTime()) / 1000) % lp;
        const phasePercentage = phase / lp;

        this.bodies.push({
            type: 'moon',
            name: 'The Moon',
            description: `Phase: ${Math.floor(phasePercentage * 100)}% - Earth's only natural satellite.`,
            x: this.canvas.width * 0.8,
            y: this.canvas.height * 0.2,
            size: 30,
            phase: phasePercentage
        });

        // Add some planets
        const planets = [
            { name: 'Mars', color: '#ff4d4d', info: 'The Red Planet. Home to Olympus Mons.' },
            { name: 'Jupiter', color: '#ffcc99', info: 'Gas Giant. Known for its Great Red Spot.' },
            { name: 'Saturn', color: '#f0e68c', info: 'The Ringed Planet. Majestic and gold.' }
        ];

        planets.forEach((p, i) => {
            this.bodies.push({
                type: 'planet',
                name: p.name,
                description: p.info,
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 4 + Math.random() * 4,
                color: p.color
            });
        });
    }

    checkHover(mx, my) {
        let found = null;
        const threshold = 40;

        [...this.stars, ...this.bodies].forEach(obj => {
            // Apply parallax to coordinate check
            const ox = obj.x - this.parallax.x;
            const oy = obj.y - this.parallax.y;
            const dist = Math.sqrt((mx - ox)**2 + (my - oy)**2);
            
            if (dist < (obj.size || 2) + threshold) {
                found = obj;
            }
        });

        if (found && found.name) {
            if (this.hover.target !== found) {
                this.hover.target = found;
                this.hover.startTime = Date.now();
            } else if (!this.hover.isShowing && Date.now() - this.hover.startTime > 3000) {
                this.showTooltip(found, mx, my);
            }
        } else {
            this.hover.target = null;
            this.hideTooltip();
        }
    }

    showTooltip(obj, x, y) {
        this.hover.isShowing = true;
        this.tooltip.style.left = `${x + 20}px`;
        this.tooltip.style.top = `${y + 20}px`;
        this.tooltip.innerHTML = `<strong>${obj.name}</strong><br>${obj.description || 'A distant star in our galaxy.'}`;
        this.tooltip.style.opacity = '1';
    }

    hideTooltip() {
        this.hover.isShowing = false;
        this.tooltip.style.opacity = '0';
    }

    getTheme() {
        if (this.config.manualTheme) return { ...this.themes[this.config.manualTheme], name: this.config.manualTheme };

        const hour = new Date().getHours();
        if (hour >= 5 && hour < 8) return { ...this.themes.dawn, name: 'dawn' };
        if (hour >= 8 && hour < 17) return { ...this.themes.day, name: 'day' };
        if (hour >= 17 && hour < 20) return { ...this.themes.sunset, name: 'sunset' };
        return { ...this.themes.night, name: 'night' };
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
        this.createStars();
        this.createCelestialBodies();
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
                opacity: Math.random() * theme.opacity,
                name: i % 20 === 0 ? 'Star Specimen' : null // Only Some are "discoverable"
            });
        }
    }

    draw() {
        const theme = this.getTheme();
        
        // Smooth parallax
        this.parallax.x += (this.mouse.tx - this.parallax.x) * 0.05;
        this.parallax.y += (this.mouse.ty - this.parallax.y) * 0.05;

        // Apply background
        this.canvas.style.background = theme.background;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.parallax.x, -this.parallax.y);

        // Draw Stars
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fillStyle = star.color;
            this.ctx.globalAlpha = star.opacity;
            this.ctx.fill();

            star.y += star.velocity;
            if (star.y > this.canvas.height + 100) star.y = -100;
            if (star.y < -100) star.y = this.canvas.height + 100;
        });

        // Draw Celestial Bodies
        this.bodies.forEach(body => {
            if (body.type === 'moon') {
                this.drawMoon(body);
            } else {
                this.drawPlanet(body);
            }
        });

        this.ctx.restore();
    }

    drawMoon(moon) {
        const x = moon.x, y = moon.y, r = moon.size;
        
        this.ctx.save();
        this.ctx.shadowBlur = 40;
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        
        // Moon Base
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fill();
        
        // Moon Shadow (Phase)
        this.ctx.globalCompositeOperation = 'source-atop';
        this.ctx.beginPath();
        const offset = (moon.phase * 2 - 1) * r * 2;
        this.ctx.arc(x + offset, y, r * 1.1, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawPlanet(p) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = p.color;
        this.ctx.fill();
        
        // Simple Ring for Saturn
        if (p.name === 'Saturn') {
            this.ctx.beginPath();
            this.ctx.ellipse(p.x, p.y, p.size * 2.2, p.size * 0.6, Math.PI / 4, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    animate() {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        cancelAnimationFrame(this.animationId);
        this.canvas.remove();
        this.tooltip.remove();
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
