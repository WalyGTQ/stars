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
    #nebulae = [];
    #shootingStars = [];
    #animationId = null;
    #config;
    #mouse = { x: 0, y: 0, tx: 0, ty: 0, lastX: 0, lastY: 0, velocity: 0 };
    #parallax = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0 };
    #hover = { target: null, startTime: 0, isShowing: false };
    #tooltip;
    #dpr = 1;

    #boundResize;
    #boundMouseMove;

    constructor(options = {}) {
        this.#config = {
            container: options.container || document.body,
            starCount: options.starCount || 300,
            baseSpeed: options.baseSpeed || 0.05,
            enableTimeAwareness: options.enableTimeAwareness !== false,
            manualTheme: options.manualTheme || null,
            interactive: options.interactive !== false,
            parallaxFactor: options.parallaxFactor || 0.05,
            nebulaDensity: options.nebulaDensity || 3,
            distortion: options.distortion || 0.15, // Gravitational lensing strength
            ...options
        };

        this.#boundResize = this.#resize.bind(this);
        this.#boundMouseMove = this.#handleMouseMove.bind(this);

        this.#init();
    }

    #init() {
        this.#canvas = document.createElement('canvas');
        this.#ctx = this.#canvas.getContext('2d', { alpha: false });
        
        this.#canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            pointer-events: auto;
            will-change: transform;
            cursor: crosshair;
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
            padding: 15px 25px;
            background: rgba(5, 8, 15, 0.9);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 15px rgba(79, 172, 254, 0.2);
            color: #ffffff;
            border-radius: 15px;
            font-family: 'Outfit', sans-serif;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            z-index: 1000;
            font-size: 14px;
            line-height: 1.5;
        `;
        document.body.appendChild(this.#tooltip);
    }

    #handleMouseMove(e) {
        const dx = e.clientX - this.#mouse.x;
        const dy = e.clientY - this.#mouse.y;
        this.#mouse.velocity = Math.sqrt(dx*dx + dy*dy);
        
        this.#mouse.x = e.clientX;
        this.#mouse.y = e.clientY;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        this.#mouse.tx = (e.clientX - centerX) * this.#config.parallaxFactor;
        this.#mouse.ty = (e.clientY - centerY) * this.#config.parallaxFactor;
        
        // Perspective Rotation
        this.#parallax.rotX = (e.clientY - centerY) * 0.0001; 
        this.#parallax.rotY = (e.clientX - centerX) * 0.0001;

        // Opportunity for shooting stars on fast movement
        if (this.#mouse.velocity > 50 && Math.random() < 0.05) {
            this.#spawnShootingStar(e.clientX, e.clientY);
        }
    }

    #spawnShootingStar(x, y) {
        this.#shootingStars.push({
            x: x + (Math.random() - 0.5) * 200,
            y: y + (Math.random() - 0.5) * 200,
            vx: (Math.random() - 0.5) * 20 + 10,
            vy: (Math.random() - 0.5) * 20 + 10,
            len: 10 + Math.random() * 40,
            life: 1.0,
            color: '#fff'
        });
    }

    #createCelestialBodies() {
        this.#bodies = [];
        const theme = this.#getTheme();
        if (theme.name === 'day') return;

        const w = this.#canvas.width / this.#dpr;
        const h = this.#canvas.height / this.#dpr;

        // Moon
        const date = new Date();
        const lp = 2551443; 
        const new_moon = new Date(1970, 0, 7, 20, 35, 0);
        const phasePercentage = (((date.getTime() - new_moon.getTime()) / 1000) % lp) / lp;

        this.#bodies.push({
            type: 'moon',
            name: 'Portal Lunar',
            description: `Fase: ${Math.floor(phasePercentage * 100)}%<br>Reflejando la luz de un sol lejano.`,
            x: w * 0.85,
            y: h * 0.15,
            size: 40,
            phase: phasePercentage
        });

        // TON 618 Black Hole
        this.#bodies.push({
            type: 'blackhole',
            name: 'Singularidad TON 618',
            description: 'El abismo más profundo del cosmos conocido. La luz no puede escapar de aquí.',
            x: w * 0.25,
            y: h * 0.75,
            size: 15,
            color: '#000000'
        });

        const planets = [
            { name: 'Arrakis', color: '#e67e22', info: 'Un mundo de arena y especias eternas.' },
            { name: 'Cybertron', color: '#3498db', info: 'Estructuras metálicas que brillan en el vacío.' },
            { name: 'Elysium', color: '#2ecc71', info: 'Un oasis de vida bioluminiscente.' }
        ];

        planets.forEach((p, i) => {
            this.#bodies.push({
                type: 'planet',
                name: p.name,
                description: p.info,
                x: Math.random() * w,
                y: Math.random() * h,
                size: 6 + Math.random() * 8,
                color: p.color
            });
        });
    }

    #createNebulae() {
        this.#nebulae = [];
        const theme = this.#getTheme();
        const colors = theme.name === 'night' ? ['#4834d4', '#686de0', '#be2edd'] : 
                      theme.name === 'sunset' ? ['#f0932b', '#eb4d4b', '#ff7979'] : ['#7ed6df', '#e056fd'];

        const w = this.#canvas.width / this.#dpr;
        const h = this.#canvas.height / this.#dpr;

        for (let i = 0; i < this.#config.nebulaDensity; i++) {
            this.#nebulae.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 300 + Math.random() * 500,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 0.03 + Math.random() * 0.05,
                pulse: Math.random() * Math.PI,
                speed: 0.001 + Math.random() * 0.002
            });
        }
    }

    #checkHover() {
        if (this.#mouse.x === 0 && this.#mouse.y === 0) return;

        let found = null;
        const threshold = 50;

        const checkCollision = (obj) => {
            const ox = obj.x - this.#parallax.x;
            const oy = obj.y - this.#parallax.y;
            const dx = this.#mouse.x - ox;
            const dy = this.#mouse.y - oy;
            if ((dx * dx + dy * dy) < (obj.size * obj.size) + (threshold * threshold)) found = obj;
        };

        this.#bodies.forEach(checkCollision);

        if (found && found.name) {
            if (this.#hover.target !== found) {
                this.#hover.target = found;
                this.#hover.startTime = performance.now();
                this.#hideTooltip();
            } else if (!this.#hover.isShowing && performance.now() - this.#hover.startTime > 600) {
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
        this.#tooltip.innerHTML = `<span style="color: #4facfe; font-weight: 800; letter-spacing: 1px;">${obj.name.toUpperCase()}</span><br><div style="height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;"></div><span style="color: #d1d8e0; font-size: 13px;">${obj.description}</span>`;
        this.#tooltip.style.opacity = '1';
    }

    #updateTooltipPos() {
        this.#tooltip.style.transform = `translate(${this.#mouse.x + 25}px, ${this.#mouse.y + 25}px)`;
    }

    #hideTooltip() {
        if (this.#hover.isShowing) {
            this.#hover.isShowing = false;
            this.#tooltip.style.opacity = '0';
        }
    }

    #getTheme() {
        const h = new Date().getHours();
        const themes = {
            night: { name: 'night', gradient: ['#05080f', '#000000'], stars: ['#ffffff', '#a3c2ff', '#f1c40f'], opacity: 0.8 },
            dawn: { name: 'dawn', gradient: ['#1e272e', '#ff5e57'], stars: ['#ffd32a', '#fffa65'], opacity: 0.5 },
            day: { name: 'day', gradient: ['#0fbcf9', '#34e7e4'], stars: ['#ffffff'], opacity: 0.2 },
            sunset: { name: 'sunset', gradient: ['#2c3e50', '#ff3f34'], stars: ['#ffdd59', '#ff9f1a'], opacity: 0.7 }
        };

        if (this.#config.manualTheme) return themes[this.#config.manualTheme];
        if (h >= 5 && h < 8) return themes.dawn;
        if (h >= 8 && h < 17) return themes.day;
        if (h >= 17 && h < 20) return themes.sunset;
        return themes.night;
    }

    #resize() {
        this.#dpr = window.devicePixelRatio || 1;
        this.#canvas.width = window.innerWidth * this.#dpr;
        this.#canvas.height = window.innerHeight * this.#dpr;
        this.#ctx.scale(this.#dpr, this.#dpr);
        this.#createStars();
        this.#createCelestialBodies();
        this.#createNebulae();
    }

    #createStars() {
        this.#stars = [];
        const theme = this.#getTheme();
        const w = this.#canvas.width / this.#dpr;
        const h = this.#canvas.height / this.#dpr;
        const count = this.#config.starCount * (theme.name === 'day' ? 0.1 : 1);

        for (let i = 0; i < count; i++) {
            this.#stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                z: Math.random() * 2, // Depth layer
                size: Math.random() * 1.5 + 0.2,
                color: theme.stars[Math.floor(Math.random() * theme.stars.length)],
                opacity: Math.random() * theme.opacity,
                twinkle: Math.random() * Math.PI
            });
        }
    }

    #draw() {
        const theme = this.#getTheme();
        const w = this.#canvas.width / this.#dpr;
        const h = this.#canvas.height / this.#dpr;
        
        this.#checkHover();
        
        // Advanced Parallax & Perspective
        this.#parallax.x += (this.#mouse.tx - this.#parallax.x) * 0.05;
        this.#parallax.y += (this.#mouse.ty - this.#parallax.y) * 0.05;

        // Draw Background
        const grd = this.#ctx.createLinearGradient(0, 0, w, h);
        grd.addColorStop(0, theme.gradient[0]);
        grd.addColorStop(1, theme.gradient[1]);
        this.#ctx.fillStyle = grd;
        this.#ctx.fillRect(0, 0, w, h);

        // Render Nebulae (Procedural Space Dust)
        this.#ctx.save();
        this.#ctx.globalCompositeOperation = 'screen';
        this.#nebulae.forEach(n => {
            n.pulse += n.speed;
            const pulseSize = n.size + Math.sin(n.pulse) * 30;
            const g = this.#ctx.createRadialGradient(n.x - this.#parallax.x*0.5, n.y - this.#parallax.y*0.5, 0, n.x - this.#parallax.x*0.5, n.y - this.#parallax.y*0.5, pulseSize);
            g.addColorStop(0, n.color);
            g.addColorStop(1, 'transparent');
            this.#ctx.fillStyle = g;
            this.#ctx.globalAlpha = n.opacity;
            this.#ctx.fillRect(0, 0, w, h);
        });
        this.#ctx.restore();

        this.#ctx.save();
        this.#ctx.translate(w / 2, h / 2);
        // Apply perspective tilt
        this.#ctx.transform(1, this.#parallax.rotY, this.#parallax.rotX, 1, 0, 0); 
        this.#ctx.translate(-w / 2, -h / 2);
        this.#ctx.translate(-this.#parallax.x, -this.#parallax.y);

        // Render Stars with Gravitational Lensing effect
        this.#stars.forEach(s => {
            s.twinkle += 0.05;
            let sx = s.x;
            let sy = s.y;

            // Distortion logic (Gravitational Lensing) around mouse
            if (this.#config.interactive) {
                const dx = s.x - (this.#mouse.x + this.#parallax.x);
                const dy = s.y - (this.#mouse.y + this.#parallax.y);
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 200) {
                    const force = (200 - dist) * this.#config.distortion;
                    sx += (dx / dist) * force;
                    sy += (dy / dist) * force;
                }
            }

            this.#ctx.globalAlpha = s.opacity * (0.7 + Math.sin(s.twinkle) * 0.3);
            this.#ctx.fillStyle = s.color;
            this.#ctx.beginPath();
            this.#ctx.arc(sx, sy, s.size * (1 + s.z), 0, Math.PI * 2);
            this.#ctx.fill();
            
            s.y += (this.#config.baseSpeed * (1 + s.z)) * 0.5;
            if (s.y > h + 20) s.y = -20;
        });

        // Shooting Stars
        this.#shootingStars.forEach((ss, i) => {
            this.#ctx.globalAlpha = ss.life;
            this.#ctx.strokeStyle = ss.color;
            this.#ctx.lineWidth = 2;
            this.#ctx.beginPath();
            this.#ctx.moveTo(ss.x, ss.y);
            this.#ctx.lineTo(ss.x - ss.vx, ss.y - ss.vy);
            this.#ctx.stroke();
            ss.x += ss.vx;
            ss.y += ss.vy;
            ss.life -= 0.02;
            if (ss.life <= 0) this.#shootingStars.splice(i, 1);
        });

        this.#ctx.globalAlpha = 1.0;
        this.#bodies.forEach(b => {
            if (b.type === 'moon') this.#drawMoon(b);
            else if (b.type === 'blackhole') this.#drawBlackHole(b);
            else this.#drawPlanet(b);
        });

        this.#ctx.restore();
    }

    #drawMoon(m) {
        this.#ctx.save();
        this.#ctx.shadowBlur = 50;
        this.#ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        this.#ctx.beginPath();
        this.#ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        this.#ctx.fillStyle = '#f5f6fa';
        this.#ctx.fill();
        this.#ctx.shadowBlur = 0;
        this.#ctx.globalCompositeOperation = 'source-atop';
        const offset = (m.phase * 2 - 1) * m.size * 2;
        this.#ctx.beginPath();
        this.#ctx.arc(m.x + offset, m.y, m.size * 1.1, 0, Math.PI * 2);
        this.#ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
        this.#ctx.fill();
        this.#ctx.restore();
    }

    #drawPlanet(p) {
        this.#ctx.save();
        this.#ctx.beginPath();
        this.#ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.#ctx.fillStyle = p.color;
        this.#ctx.shadowBlur = 20;
        this.#ctx.shadowColor = p.color;
        this.#ctx.fill();
        
        // Atmosphere Glow
        const g = this.#ctx.createRadialGradient(p.x, p.y, p.size*0.8, p.x, p.y, p.size*1.2);
        g.addColorStop(0, 'transparent');
        g.addColorStop(1, p.color);
        this.#ctx.globalAlpha = 0.3;
        this.#ctx.fillStyle = g;
        this.#ctx.fillRect(p.x - p.size*2, p.y - p.size*2, p.size*4, p.size*4);
        this.#ctx.restore();
    }

    #drawBlackHole(bh) {
        this.#ctx.save();
        // Accretion Disk (Distorted)
        const rot = Date.now() * 0.001;
        this.#ctx.translate(bh.x, bh.y);
        this.#ctx.rotate(rot);
        this.#ctx.beginPath();
        this.#ctx.ellipse(0, 0, bh.size * 5, bh.size * 1.5, 0, 0, Math.PI * 2);
        const g = this.#ctx.createRadialGradient(0, 0, bh.size, 0, 0, bh.size * 5);
        g.addColorStop(0, 'rgba(255, 100, 0, 1)');
        g.addColorStop(0.5, 'rgba(255, 200, 50, 0.5)');
        g.addColorStop(1, 'transparent');
        this.#ctx.fillStyle = g;
        this.#ctx.fill();
        this.#ctx.restore();

        // Event Horizon
        this.#ctx.beginPath();
        this.#ctx.arc(bh.x, bh.y, bh.size, 0, Math.PI * 2);
        this.#ctx.fillStyle = '#000000';
        this.#ctx.shadowBlur = 10;
        this.#ctx.shadowColor = '#fff';
        this.#ctx.fill();
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StarBackground;
} else if (typeof define === 'function' && define.amd) {
    define([], () => StarBackground);
} else {
    window.StarBackground = StarBackground;
}


// Exportación modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StarBackground;
} else if (typeof define === 'function' && define.amd) {
    define([], () => StarBackground);
} else {
    window.StarBackground = StarBackground;
}