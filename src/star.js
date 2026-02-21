/**
 * Star.js - Pro Edition
 * A high-performance, time-aware star background library for web portfolios.
 * License: MIT
 */

class StarBackground {
    #canvas;
    #ctx;
    #stars = [];
    #bodies = [];
    #animationId = null;
    #config;
    #mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    #parallax = { x: 0, y: 0 };
    #hover = { target: null, startTime: 0, isShowing: false };
    #tooltip;
    #dpr = 1;

    // Métodos vinculados para poder remover los event listeners
    #boundResize;
    #boundMouseMove;

    constructor(options = {}) {
        this.#config = {
            container: options.container || document.body,
            starCount: options.starCount || 200,
            baseSpeed: options.baseSpeed || 0.05,
            enableTimeAwareness: options.enableTimeAwareness !== false,
            manualTheme: options.manualTheme || null,
            interactive: options.interactive !== false,
            parallaxFactor: options.parallaxFactor || 0.03,
            ...options
        };

        this.#boundResize = this.#resize.bind(this);
        this.#boundMouseMove = this.#handleMouseMove.bind(this);

        this.#init();
    }

    #init() {
        this.#canvas = document.createElement('canvas');
        this.#ctx = this.#canvas.getContext('2d', { alpha: false }); // alpha: false optimiza el fondo sólido
        
        this.#canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            pointer-events: auto;
            will-change: transform;
        `;

        this.#config.container.appendChild(this.#canvas);
        this.#setupTooltip();
        this.#resize();

        window.addEventListener('resize', this.#boundResize);
        
        if (this.#config.interactive) {
            window.addEventListener('mousemove', this.#boundMouseMove, { passive: true });
        }
        
        this.#animate();
    }

    #setupTooltip() {
        this.#tooltip = document.createElement('div');
        this.#tooltip.style.cssText = `
            position: fixed;
            padding: 12px 20px;
            background: rgba(10, 14, 20, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            color: #ececec;
            border-radius: 8px;
            font-family: system-ui, -apple-system, sans-serif;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            font-size: 14px;
            line-height: 1.4;
            transform: translate(0, 0); /* Aceleración por hardware */
        `;
        document.body.appendChild(this.#tooltip);
    }

    #handleMouseMove(e) {
        this.#mouse.x = e.clientX;
        this.#mouse.y = e.clientY;
        this.#mouse.tx = (e.clientX - window.innerWidth / 2) * this.#config.parallaxFactor;
        this.#mouse.ty = (e.clientY - window.innerHeight / 2) * this.#config.parallaxFactor;
    }

    #createCelestialBodies() {
        this.#bodies = [];
        const theme = this.#getTheme();
        if (theme.name === 'day') return;

        const date = new Date();
        const lp = 2551443; 
        const new_moon = new Date(1970, 0, 7, 20, 35, 0);
        const phasePercentage = (((date.getTime() - new_moon.getTime()) / 1000) % lp) / lp;

        const w = this.#canvas.width / this.#dpr;
        const h = this.#canvas.height / this.#dpr;

        this.#bodies.push({
            type: 'moon',
            name: 'La Luna',
            description: `Fase lunar: ${Math.floor(phasePercentage * 100)}%<br>Satélite natural de la Tierra.`,
            x: w * 0.8,
            y: h * 0.2,
            size: 35,
            phase: phasePercentage
        });

        // Ton 618 - Agujero negro supermasivo
        this.#bodies.push({
            type: 'blackhole',
            name: 'TON 618',
            description: 'Cuásar hiperluminoso y agujero negro ultramasivo.<br>Masa: ~66 mil millones de masas solares.',
            x: w * 0.2,
            y: h * 0.7,
            size: 12,
            color: '#000000'
        });

        const planets = [
            { name: 'Marte', color: '#ff5733', info: 'El Planeta Rojo. Hogar del Monte Olimpo.' },
            { name: 'Júpiter', color: '#e3a857', info: 'Gigante gaseoso. Su Gran Mancha Roja es inconfundible.' },
            { name: 'Saturno', color: '#f4d03f', info: 'Señor de los anillos.' }
        ];

        planets.forEach(p => {
            this.#bodies.push({
                type: 'planet',
                name: p.name,
                description: p.info,
                x: Math.random() * w,
                y: Math.random() * h,
                size: 4 + Math.random() * 5,
                color: p.color
            });
        });
    }

    #checkHover() {
        if (this.#mouse.x === 0 && this.#mouse.y === 0) return;

        let found = null;
        const threshold = 40;
        const thresholdSq = threshold * threshold; // Optimización: evitamos Math.sqrt

        const checkCollision = (obj) => {
            const ox = obj.x - this.#parallax.x;
            const oy = obj.y - this.#parallax.y;
            const dx = this.#mouse.x - ox;
            const dy = this.#mouse.y - oy;
            
            // Distancia al cuadrado
            if ((dx * dx + dy * dy) < (obj.size * obj.size) + thresholdSq) {
                found = obj;
            }
        };

        this.#bodies.forEach(checkCollision);
        if (!found) this.#stars.forEach(checkCollision);

        if (found && found.name) {
            if (this.#hover.target !== found) {
                this.#hover.target = found;
                this.#hover.startTime = performance.now(); // Más preciso que Date.now()
                this.#hideTooltip();
            } else if (!this.#hover.isShowing && performance.now() - this.#hover.startTime > 800) {
                this.#showTooltip(found);
            } else if (this.#hover.isShowing) {
                this.#updateTooltipPos();
            }
        } else {
            this.#hover.target = null;
            this.#hideTooltip();
        }
    }

    #showTooltip(obj) {
        this.#hover.isShowing = true;
        this.#updateTooltipPos();
        this.#tooltip.innerHTML = `<strong style="color: #4facfe;">${obj.name}</strong><br><span style="color: #a0aec0;">${obj.description || 'Estrella distante en la Vía Láctea.'}</span>`;
        this.#tooltip.style.opacity = '1';
    }

    #updateTooltipPos() {
        // Usamos transform para mejor rendimiento en el movimiento del tooltip
        this.#tooltip.style.transform = `translate(${this.#mouse.x + 20}px, ${this.#mouse.y + 20}px)`;
    }

    #hideTooltip() {
        if (this.#hover.isShowing) {
            this.#hover.isShowing = false;
            this.#tooltip.style.opacity = '0';
        }
    }

    #getTheme() {
        const themes = {
            night: {
                background: '#0a0e14', // Fallback para alpha:false
                gradient: ['#0a0e14', '#000000'],
                starColors: ['#ffffff', '#e1e1e1', '#fff9e6', '#a3c2ff'],
                density: 1.0,
                opacity: 0.8
            },
            dawn: {
                background: '#2c3e50',
                gradient: ['#2c3e50', '#ff7e5f'],
                starColors: ['#ffecd2', '#fcb69f'],
                density: 0.4,
                opacity: 0.6
            },
            day: {
                background: '#4facfe',
                gradient: ['#4facfe', '#00f2fe'],
                starColors: ['#ffffff'],
                density: 0.05,
                opacity: 0.3
            },
            sunset: {
                background: '#203a43',
                gradient: ['#203a43', '#f46b45'],
                starColors: ['#ffd89b', '#ffb6b9'],
                density: 0.6,
                opacity: 0.7
            }
        };

        if (this.#config.manualTheme) return { ...themes[this.#config.manualTheme], name: this.#config.manualTheme };

        const hour = new Date().getHours();
        if (hour >= 5 && hour < 8) return { ...themes.dawn, name: 'dawn' };
        if (hour >= 8 && hour < 17) return { ...themes.day, name: 'day' };
        if (hour >= 17 && hour < 20) return { ...themes.sunset, name: 'sunset' };
        return { ...themes.night, name: 'night' };
    }

    #resize() {
        this.#dpr = window.devicePixelRatio || 1;
        
        // Ajuste físico del canvas para resoluciones altas
        this.#canvas.width = window.innerWidth * this.#dpr;
        this.#canvas.height = window.innerHeight * this.#dpr;
        
        // Ajuste lógico via CSS
        this.#canvas.style.width = `${window.innerWidth}px`;
        this.#canvas.style.height = `${window.innerHeight}px`;
        
        // Escalar el contexto para que las coordenadas coincidan con el CSS
        this.#ctx.scale(this.#dpr, this.#dpr);

        this.#createStars();
        this.#createCelestialBodies();
    }

    #createStars() {
        this.#stars = [];
        const theme = this.#getTheme();
        const adjustedCount = Math.floor(this.#config.starCount * theme.density);
        const w = this.#canvas.width / this.#dpr;
        const h = this.#canvas.height / this.#dpr;

        for (let i = 0; i < adjustedCount; i++) {
            this.#stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: (Math.random() * 1.2 + 0.3),
                color: theme.starColors[Math.floor(Math.random() * theme.starColors.length)],
                velocity: (Math.random() * 0.8 + 0.2) * this.#config.baseSpeed,
                opacity: Math.random() * theme.opacity,
                name: i % 25 === 0 ? `Estrella HD-${Math.floor(Math.random()*10000)}` : null
            });
        }
    }

    #draw() {
        const theme = this.#getTheme();
        const w = this.#canvas.width / this.#dpr;
        const h = this.#canvas.height / this.#dpr;
        
        this.#checkHover();
        
        // Suavizado del parallax (Lerp)
        this.#parallax.x += (this.#mouse.tx - this.#parallax.x) * 0.08;
        this.#parallax.y += (this.#mouse.ty - this.#parallax.y) * 0.08;

        // Dibujar fondo degradado
        const grd = this.#ctx.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0, theme.gradient[0]);
        grd.addColorStop(1, theme.gradient[1]);
        this.#ctx.fillStyle = grd;
        this.#ctx.fillRect(0, 0, w, h);

        this.#ctx.save();
        this.#ctx.translate(-this.#parallax.x, -this.#parallax.y);

        // Renderizado de estrellas (optimizado)
        this.#stars.forEach(star => {
            this.#ctx.globalAlpha = star.opacity;
            this.#ctx.fillStyle = star.color;
            this.#ctx.beginPath();
            this.#ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.#ctx.fill();

            star.y += star.velocity;
            if (star.y > h + 10) star.y = -10;
        });

        this.#ctx.globalAlpha = 1.0;

        // Renderizado de cuerpos celestes
        this.#bodies.forEach(body => {
            if (body.type === 'moon') this.#drawMoon(body);
            else if (body.type === 'blackhole') this.#drawBlackHole(body);
            else this.#drawPlanet(body);
        });

        this.#ctx.restore();
    }

    #drawMoon(moon) {
        const { x, y, size: r } = moon;
        
        this.#ctx.save();
        this.#ctx.shadowBlur = 30;
        this.#ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        
        // Base de la luna
        this.#ctx.beginPath();
        this.#ctx.arc(x, y, r, 0, Math.PI * 2);
        this.#ctx.fillStyle = '#e2e8f0';
        this.#ctx.fill();
        
        // Sombra de la fase
        this.#ctx.shadowBlur = 0;
        this.#ctx.globalCompositeOperation = 'source-atop';
        this.#ctx.beginPath();
        const offset = (moon.phase * 2 - 1) * r * 2;
        this.#ctx.arc(x + offset, y, r * 1.05, 0, Math.PI * 2);
        this.#ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Sombra más realista
        this.#ctx.fill();
        
        this.#ctx.restore();
    }

    #drawPlanet(p) {
        this.#ctx.save();
        this.#ctx.beginPath();
        this.#ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.#ctx.fillStyle = p.color;
        this.#ctx.shadowBlur = 10;
        this.#ctx.shadowColor = p.color;
        this.#ctx.fill();
        
        // Anillos de Saturno mejorados
        if (p.name === 'Saturno') {
            this.#ctx.shadowBlur = 0;
            this.#ctx.beginPath();
            this.#ctx.ellipse(p.x, p.y, p.size * 2.4, p.size * 0.7, Math.PI / 6, 0, Math.PI * 2);
            this.#ctx.strokeStyle = 'rgba(244, 208, 63, 0.4)';
            this.#ctx.lineWidth = p.size * 0.4;
            this.#ctx.stroke();
            
            // Segundo anillo interno
            this.#ctx.beginPath();
            this.#ctx.ellipse(p.x, p.y, p.size * 1.8, p.size * 0.5, Math.PI / 6, 0, Math.PI * 2);
            this.#ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.#ctx.lineWidth = 1;
            this.#ctx.stroke();
        }
        this.#ctx.restore();
    }

    #drawBlackHole(bh) {
        this.#ctx.save();
        // Disco de acreción brillante
        this.#ctx.beginPath();
        this.#ctx.ellipse(bh.x, bh.y, bh.size * 3.5, bh.size * 1.2, -Math.PI / 8, 0, Math.PI * 2);
        const gradient = this.#ctx.createRadialGradient(bh.x, bh.y, bh.size, bh.x, bh.y, bh.size * 3.5);
        gradient.addColorStop(0, 'rgba(255, 150, 50, 0)');
        gradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 100, 20, 0)');
        this.#ctx.fillStyle = gradient;
        this.#ctx.fill();

        // Horizonte de sucesos (Negro absoluto)
        this.#ctx.beginPath();
        this.#ctx.arc(bh.x, bh.y, bh.size, 0, Math.PI * 2);
        this.#ctx.fillStyle = '#000000';
        this.#ctx.shadowBlur = 15;
        this.#ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        this.#ctx.fill();
        this.#ctx.restore();
    }

    #animate() {
        this.#draw();
        this.#animationId = requestAnimationFrame(() => this.#animate());
    }

    destroy() {
        cancelAnimationFrame(this.#animationId);
        window.removeEventListener('resize', this.#boundResize);
        window.removeEventListener('mousemove', this.#boundMouseMove);
        this.#canvas.remove();
        this.#tooltip.remove();
    }
}

// Exportación modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StarBackground;
} else if (typeof define === 'function' && define.amd) {
    define([], () => StarBackground);
} else {
    window.StarBackground = StarBackground;
}