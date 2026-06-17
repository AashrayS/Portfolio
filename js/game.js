/**
 * 🧠 Braincell Collector — A Platformer Game on the Portfolio
 * 
 * Self-contained game engine. Zero dependency on main.js.
 * The wizard bounces across real DOM elements (used as platforms),
 * collecting braincells. Collect all to win!
 */

(function () {
  'use strict';

  // ========== CONSTANTS ==========
  const GRAVITY = 0.45;
  const JUMP_FORCE = -15;
  const MOVE_SPEED = 8;
  const TERMINAL_VELOCITY = 15;
  const FRICTION = 0.85;
  const PLAYER_W = 40;
  const PLAYER_H = 48;
  const BRAINCELL_SIZE = 40;
  const BRAINCELL_GLOW = 50;
  const PX = 4; // pixel size for pixel art rendering

  // Platform selectors — these DOM elements become solid ground
  // NOTE: .marquee-section removed — it blocks vertical movement
  const PLATFORM_SELECTORS = [
    '.hero-card',
    '.about-image-frame',
    '.skill-tag',
    '.tree-node',
    '.quest-card',
    '.footer',
    '.contact-container',
    '.about-badge',
    '.hero-label',
    '.btn-primary',
    '.nav-cta'
  ];

  // ========== PIXEL ART HELPERS ==========
  // Draw a pixel art bot character
  function drawPixelBot(ctx, x, y, w, h, facingRight, grounded, time) {
    const p = PX; // pixel size
    const cols = Math.floor(w / p);
    const rows = Math.floor(h / p);
    
    // Animation: bob when walking
    const bobY = grounded ? Math.abs(Math.sin(time * 10)) * 2 : 0;
    const drawY = y - bobY;

    ctx.save();
    if (!facingRight) {
      ctx.translate(x + w, drawY);
      ctx.scale(-1, 1);
      x = 0; 
    } else {
      ctx.translate(x, drawY);
      x = 0;
    }

    // Pixel art bot sprite (10x12 grid)
    // Colors
    const G = '#CCFF00'; // neon green (body)
    const D = '#1B1464'; // dark indigo (outline/details)
    const W = '#FFFFFF'; // white (eyes)
    const O = '#FF6B35'; // orange (accents)
    const _ = null;      // transparent

    const sprite = [
      [_,_,_,D,D,D,D,_,_,_],
      [_,_,D,G,G,G,G,D,_,_],
      [_,D,G,G,G,G,G,G,D,_],
      [_,D,W,D,G,G,W,D,D,_],
      [_,D,G,G,G,G,G,G,D,_],
      [_,_,D,G,D,D,G,D,_,_],
      [_,_,_,D,D,D,D,_,_,_],
      [_,D,D,O,O,O,O,D,D,_],
      [D,G,D,O,O,O,O,D,G,D],
      [D,G,D,O,O,O,O,D,G,D],
      [_,_,D,D,_,_,D,D,_,_],
      [_,D,D,_,_,_,_,D,D,_],
    ];

    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        if (sprite[r][c]) {
          ctx.fillStyle = sprite[r][c];
          ctx.fillRect(x + c * p, r * p, p, p);
        }
      }
    }

    if (ctx.globalAlpha < 0.1) ctx.globalAlpha = 1; // reset alpha if overridden by blink

    ctx.restore();
  }

  // Draw powerup pixel art
  function drawPixelPowerup(ctx, cx, cy, type, time) {
    const p = PX;
    const size = 30;
    const half = Math.floor(size / 2);
    const x = cx - half;
    const y = cy - half + Math.sin(time * 4) * 6;

    ctx.save();
    if (type === 'jump') ctx.fillStyle = '#00E5FF'; // cyan
    else if (type === 'speed') ctx.fillStyle = '#FF6B35'; // orange
    else ctx.fillStyle = '#FFFFFF'; // shield

    // simple diamond shape
    ctx.beginPath();
    ctx.moveTo(x + half, y);
    ctx.lineTo(x + size, y + half);
    ctx.lineTo(x + half, y + size);
    ctx.lineTo(x, y + half);
    ctx.fill();

    // inner white
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x + half, y + p * 2);
    ctx.lineTo(x + size - p * 2, y + half);
    ctx.lineTo(x + half, y + size - p * 2);
    ctx.lineTo(x + p * 2, y + half);
    ctx.fill();
    ctx.restore();
  }

  // Draw obstacle pixel art
  function drawPixelObstacle(ctx, x, y, w, h, type, time) {
    const p = PX;
    ctx.save();
    if (type === 'spike') {
      ctx.fillStyle = '#FF3366'; // red/pink spike
      ctx.beginPath();
      for (let i = 0; i < w; i += 20) {
        ctx.moveTo(x + i, y + h);
        ctx.lineTo(x + i + 10, y);
        ctx.lineTo(x + i + 20, y + h);
      }
      ctx.fill();
    } else {
      // Enemy Bot (red variant of player)
      const drawY = y - Math.abs(Math.sin(time * 8)) * 3;
      ctx.translate(x, drawY);
      const R = '#FF3366'; // red body
      const D = '#1B1464';
      const W = '#CCFF00'; // green eyes
      const _ = null;
      const sprite = [
        [_,_,_,D,D,D,D,_,_,_],
        [_,_,D,R,R,R,R,D,_,_],
        [_,D,R,R,R,R,R,R,D,_],
        [_,D,W,D,R,R,W,D,D,_],
        [_,D,R,R,R,R,R,R,D,_],
        [_,_,D,R,D,D,R,D,_,_],
        [_,_,_,D,D,D,D,_,_,_],
        [_,D,D,R,R,R,R,D,D,_],
        [D,R,D,R,R,R,R,D,R,D],
        [D,R,D,R,R,R,R,D,R,D],
        [_,_,D,D,_,_,D,D,_,_],
        [_,D,D,_,_,_,_,D,D,_]
      ];
      for (let r = 0; r < sprite.length; r++) {
        for (let c = 0; c < sprite[r].length; c++) {
          if (sprite[r][c]) {
            ctx.fillStyle = sprite[r][c];
            ctx.fillRect(c * p, r * p, p, p);
          }
        }
      }
    }
    ctx.restore();
  }

  // Draw a pixel art braincell collectible
  function drawPixelBraincell(ctx, cx, cy, size, time) {
    const p = PX;
    const half = Math.floor(size / 2);
    const x = cx - half;
    const y = cy - half;

    // Pulsing glow
    const pulse = 0.6 + Math.sin(time * 4) * 0.4;
    const glowR = size * 1.3;
    const grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, glowR);
    grd.addColorStop(0, `rgba(255, 215, 0, ${0.5 * pulse})`);
    grd.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Pixel art brain (10x10 grid)
    const P = '#FF69B4'; // pink brain
    const R = '#FF1493'; // deep pink folds
    const Y = '#FFD700'; // gold sparkle
    const _ = null;

    const sprite = [
      [_,_,_,P,P,P,P,_,_,_],
      [_,_,P,R,P,P,R,P,_,_],
      [_,P,R,P,P,R,P,R,P,_],
      [P,R,P,R,R,P,R,P,R,P],
      [P,P,R,P,P,R,P,R,P,P],
      [P,R,P,R,R,P,R,P,R,P],
      [P,P,R,P,P,R,P,R,P,P],
      [_,P,P,R,R,R,R,P,P,_],
      [_,_,P,P,P,P,P,P,_,_],
      [_,_,_,P,P,P,P,_,_,_],
    ];

    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        if (sprite[r][c]) {
          ctx.fillStyle = sprite[r][c];
          ctx.fillRect(x + c * p, y + r * p, p, p);
        }
      }
    }

    // Sparkle accent
    if (Math.sin(time * 6) > 0.5) {
      ctx.fillStyle = Y;
      ctx.fillRect(x + 2 * p, y + 1 * p, p, p);
      ctx.fillRect(x + 7 * p, y + 3 * p, p, p);
    }
  }

  // ========== INPUT HANDLER ==========
  class InputHandler {
    constructor() {
      this.keys = {};
      this._onKeyDown = (e) => {
        const key = e.key.toLowerCase();
        const gameKeys = [
          'arrowleft', 'arrowright', 'arrowup', 'arrowdown',
          'a', 's', 'd', 'w', 'space', ' '
        ];
        if (gameKeys.includes(key) || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.key)) {
          e.preventDefault();
          this.keys[e.key] = true;
          this.keys[e.key.toLowerCase()] = true;
          this.keys[e.key.toUpperCase()] = true;
        }
      };
      this._onKeyUp = (e) => {
        this.keys[e.key] = false;
        this.keys[e.key.toLowerCase()] = false;
        this.keys[e.key.toUpperCase()] = false;
      };
    }

    bind() {
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
    }

    unbind() {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
    }

    get left() { return this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']; }
    get right() { return this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']; }
    get jump() { return this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'] || this.keys[' '] || this.keys['Space']; }
    get down() { return this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']; }
  }

  // ========== PLATFORM ==========
  class Platform {
    constructor(el) {
      this.el = el;
      this.update();
    }

    update() {
      const rect = this.el.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      // Shrink AABB for rotated cards to prevent floating in mid-air
      let shrinkX = 0;
      let shrinkY = 0;
      if (this.el.classList.contains('hero-card')) {
         shrinkX = 16;
         shrinkY = 16;
      }

      this.x = rect.left + scrollX + shrinkX;
      this.y = rect.top + scrollY + shrinkY;
      this.w = rect.width - shrinkX * 2;
      this.h = rect.height - shrinkY * 2;
    }
  }

  // ========== BRAINCELL ==========
  class Braincell {
    constructor(x, y, id) {
      this.x = x;
      this.y = y;
      this.id = id;
      this.collected = false;
      this.bobOffset = Math.random() * Math.PI * 2;
      this.sparkle = 0;
    }

    getDrawY(time) {
      return this.y + Math.sin(time * 3 + this.bobOffset) * 6;
    }
  }

  // ========== PLAYER ==========
  class Player {
    constructor(x, y, sprite) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.w = PLAYER_W;
      this.h = PLAYER_H;
      this.grounded = false;
      this.sprite = sprite;
      this.facingRight = true;
      this.jumpHeld = false;
      this.trail = []; // afterimage trail
      this.invincible = 0;
      this.powerupJump = 0;
      this.powerupSpeed = 0;
      this.powerupShield = 0;
    }

    update(input, platforms, game) {
      if (this.invincible > 0) this.invincible--;
      if (this.powerupJump > 0) this.powerupJump--;
      if (this.powerupSpeed > 0) this.powerupSpeed--;
      if (this.powerupShield > 0) this.powerupShield--;

      // Horizontal movement
      let currentSpeed = MOVE_SPEED;
      if (this.powerupSpeed > 0) currentSpeed = MOVE_SPEED * 1.5;

      if (input.left) {
        this.vx -= currentSpeed * 0.3;
        this.facingRight = false;
      }
      if (input.right) {
        this.vx += currentSpeed * 0.3;
        this.facingRight = true;
      }

      // Clamp horizontal speed
      if (this.vx > currentSpeed) this.vx = currentSpeed;
      if (this.vx < -currentSpeed) this.vx = -currentSpeed;

      // Friction
      this.vx *= FRICTION;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;

      // Jump (only when grounded, and only once per key press)
      if (input.jump && this.grounded && !this.jumpHeld) {
        this.vy = (this.powerupJump > 0) ? JUMP_FORCE * 1.3 : JUMP_FORCE;
        this.grounded = false;
        this.jumpHeld = true;
        if (window.sfx && window.sfx.jump) window.sfx.jump();
      }
      if (!input.jump) {
        this.jumpHeld = false;
      }

      // Gravity
      this.vy += GRAVITY;

      // Clamp fall speed
      if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

      // Move X, then resolve collisions
      this.x += this.vx;
      // Removed horizontal collision entirely — platforms are one-way jump-through!
      
      // Move Y, then resolve collisions
      this.y += this.vy;
      
      // Ceiling collision (don't jump above the top of the page)
      if (this.y < 0) {
         this.y = 0;
         if (this.vy < 0) this.vy = 0;
      }
      
      this.grounded = false;
      this.resolveCollisionsY(platforms, input, game);
    }

    resolveCollisionsX(platforms) {
      // Disabled for jump-through mechanics.
    }

    resolveCollisionsY(platforms, input, game) {
      for (const p of platforms) {
        if (this.overlaps(p)) {
          // Only collide if falling down AND not holding DOWN
          if (this.vy > 0 && !input.down) {
            // Check if we were completely above the platform in the previous frame
            const prevY = this.y - this.vy;
            if (prevY + this.h <= p.y + 12) {
              this.y = p.y - this.h;
              this.vy = 0;
              this.grounded = true;

              // Landing discovery popup
              if (game && p.el && !p.hasBeenDiscovered) {
                p.hasBeenDiscovered = true;
                let txt = "+50 XP";
                if (p.el.classList.contains('skill-tag')) {
                  txt = `Skill: ${p.el.textContent.trim().substring(0, 12)}... +50 XP`;
                } else if (p.el.classList.contains('quest-card')) {
                  txt = `Quest Info +100 XP`;
                } else if (p.el.classList.contains('tree-node')) {
                  txt = `Ability: ${p.el.getAttribute('data-title') || ''} +50 XP`;
                } else if (p.el.classList.contains('hero-card')) {
                  txt = `Hero Discovery +50 XP`;
                }
                game.spawnFloatingText(p.x + p.w / 2, p.y - 10, txt);
              }
            }
          }
        }
      }
    }

    overlaps(platform) {
      return (
        this.x < platform.x + platform.w &&
        this.x + this.w > platform.x &&
        this.y < platform.y + platform.h &&
        this.y + this.h > platform.y
      );
    }

    collectCheck(braincell) {
      if (braincell.collected) return false;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      const bx = braincell.x + BRAINCELL_SIZE / 2;
      const by = braincell.y + BRAINCELL_SIZE / 2;
      const dist = Math.hypot(cx - bx, cy - by);
      return dist < (this.w / 2 + BRAINCELL_SIZE / 2);
    }
  }

  // ========== CAMERA ==========
  class Camera {
    constructor() {
      this.y = 0;
      this.targetY = 0;
    }

    follow(player, input, game) {
      const viewportH = window.innerHeight;
      this.targetY = player.y - viewportH * 0.35;
      const maxScroll = document.documentElement.scrollHeight - viewportH;
      this.targetY = Math.max(0, Math.min(this.targetY, maxScroll));
      
      const now = Date.now();

      // If playing with keyboard, reset scroll delay to follow immediately
      if (input && (input.left || input.right || input.jump || input.down)) {
        game.lastUserScrollTime = 0;
      }

      const timeSinceUserScroll = now - game.lastUserScrollTime;

      // Determine if the bot is active (keys pressed or moving in mid-air)
      const isKeysPressed = input && (input.left || input.right || input.jump || input.down);
      const isMoving = Math.abs(player.vx) > 0.5 || (!player.grounded && Math.abs(player.vy) > 0.5);
      const isBotActive = isKeysPressed || isMoving;

      // Auto-scroll to follow bot if the bot is active and user hasn't scrolled manually in 1.2 seconds
      if (isBotActive && timeSinceUserScroll > 1200) {
        const currentScroll = window.scrollY;
        const botScreenY = player.y - currentScroll;
        // Auto-scroll only if bot goes near viewport margins
        if (botScreenY < viewportH * 0.25 || botScreenY > viewportH * 0.75) {
          game.isProgrammaticScroll = true;
          window.scrollTo(0, currentScroll + (this.targetY - currentScroll) * 0.1);
        }
      }
      
      // Camera Y rigidly locks to window scroll for exact 1:1 overlay rendering
      this.y = window.scrollY;
    }
  }

  // ========== GAME ==========
  class Game {
    constructor() {
      this.state = 'IDLE'; // IDLE | PLAYING | WIN | LOSE
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.input = new InputHandler();
      this.camera = new Camera();
      this.lastUserScrollTime = 0;
      this.isProgrammaticScroll = false;

      window.addEventListener('scroll', () => {
        if (this.isProgrammaticScroll) {
          this.isProgrammaticScroll = false;
        } else {
          this.lastUserScrollTime = Date.now();
        }
      });

      this.floatingTexts = [];
      this.currentSectionIndex = -1;
      this.splashMessage = "";
      this.splashTimer = 0;
      this.splashWorldY = 0;
      this.energyGates = [];

      this.player = null;
      this.platforms = [];
      this.braincells = [];
      this.powerups = [];
      this.obstacles = [];
      this.collected = 0;
      this.totalBraincells = 0;
      this.time = 0;
      this.checkpointY = 0;
      this.checkpointX = 0;
      this.lives = 3;
      this.particles = [];

      // HUD elements
      this.hudCount = document.getElementById('hud-braincell-count');
      this.hudSection = document.getElementById('hud-section-name');
      this.hudLives = document.getElementById('hud-lives');
      this.overlay = document.getElementById('game-overlay');
      this.overlayTitle = document.getElementById('game-overlay-title');
      this.overlayMsg = document.getElementById('game-overlay-msg');
      this.overlayBtn = document.getElementById('game-overlay-btn');

      // Toggle button
      this.toggleBtn = document.getElementById('game-toggle');
      this.toggleBtn.addEventListener('click', () => this.toggle());

      // HUD exit button
      this.hudExitBtn = document.getElementById('hud-exit-btn');
      if (this.hudExitBtn) {
        this.hudExitBtn.addEventListener('click', () => this.stop());
      }

      // Overlay button
      this.overlayBtn.addEventListener('click', () => {
        if (this.state === 'WIN') {
          this.stop();
        } else {
          this.restart();
        }
      });

      this._boundLoop = this.loop.bind(this);
      this._onResize = () => this.resizeCanvas();
      window.addEventListener('resize', this._onResize);

      // Auto-start on load
      window.addEventListener('DOMContentLoaded', () => {
         setTimeout(() => {
            if (this.state === 'IDLE') this.start();
         }, 800); // slight delay to let DOM stabilize
      });
    }

    toggle() {
      if (this.state === 'IDLE') {
        this.start();
      } else {
        this.stop();
      }
    }

    start() {
      this.state = 'PLAYING';
      this.collected = 0;
      this.lives = 3;
      this.time = 0;
      this.particles = [];
      this.hasShownHackingTutorial = false;
      this.tutorialTimer = 0;

      document.body.classList.add('game-active');
      this.canvas.style.display = 'block';
      document.getElementById('game-hud').style.display = 'flex';
      this.toggleBtn.innerHTML = '<span>✕</span> Exit Game';
      this.toggleBtn.classList.add('active');
      this.overlay.classList.remove('active');

      this.resizeCanvas();
      this.scanPlatforms();
      this.spawnEntities();
      this.spawnPlayer();
      this.input.bind();

      this.updateHUD();
      requestAnimationFrame(this._boundLoop);
    }

    stop() {
      this.state = 'IDLE';
      document.body.classList.remove('game-active');
      this.canvas.style.display = 'none';
      document.getElementById('game-hud').style.display = 'none';
      this.toggleBtn.innerHTML = '<span>🎮</span> Play Mode';
      this.toggleBtn.classList.remove('active');
      this.overlay.classList.remove('active');
      this.input.unbind();
    }

    restart() {
      this.overlay.classList.remove('active');
      this.collected = 0;
      this.lives = 3;
      this.braincells.forEach(b => b.collected = false);
      this.spawnPlayer();
      this.state = 'PLAYING';
      this.updateHUD();
      requestAnimationFrame(this._boundLoop);
    }

    resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    scanPlatforms() {
      this.platforms = [];
      PLATFORM_SELECTORS.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          const p = new Platform(el);
          // Only include platforms that have meaningful size
          if (p.w > 10 && p.h > 5) {
            this.platforms.push(p);
          }
        });
      });
      // Sort top to bottom for checkpoint logic
      this.platforms.sort((a, b) => a.y - b.y);

      // Generate random mid-air platforms in gaps (more sparse now)
      const maxDocHeight = document.documentElement.scrollHeight;
      for (let y = 600; y < maxDocHeight - 1000; y += 650) {
         if (Math.random() > 0.5) {
            this.platforms.push({
               x: Math.random() * (window.innerWidth - 160) + 40,
               y: y + Math.random() * 150,
               w: 120 + Math.random() * 100,
               h: 24,
               isMidAir: true,
               update: function() {} // dummy update since it's fixed relative to page
            });
         }
      }
      this.platforms.sort((a, b) => a.y - b.y);
    }

    spawnEntities() {
      this.braincells = [];
      this.powerups = [];
      this.obstacles = [];
      let braincellId = 0;
      let powerupId = 0;

      // Strategy: place braincells above/around platform clusters
      // Group platforms by page section (y ranges)
      const sections = [
        { name: 'Hero', minY: 0, maxY: 800 },
        { name: 'About', minY: 800, maxY: 2000 },
        { name: 'Skills', minY: 2000, maxY: 3200 },
        { name: 'Quests', minY: 3200, maxY: 5000 },
        { name: 'Journey', minY: 5000, maxY: 7000 },
        { name: 'Contact', minY: 7000, maxY: 9000 }
      ];

      sections.forEach(section => {
        const sectionPlatforms = this.platforms.filter(
          p => p.y >= section.minY && p.y < section.maxY
        );

        if (sectionPlatforms.length === 0) return;

        // Place items on/above these platforms
        sectionPlatforms.forEach(plat => {
            const rand = Math.random();
            // Braincell spawn chance (50%) — multiple on wide platforms
            if (rand < 0.50) {
               const numBraincells = plat.w > 200 ? (Math.random() < 0.4 ? 2 : 1) : 1;
               for (let bi = 0; bi < numBraincells; bi++) {
                 const offsetX = (Math.random() - 0.5) * plat.w * 0.8;
                 const bx = plat.x + plat.w / 2 + offsetX - BRAINCELL_SIZE / 2;
                 const by = plat.y - 60 - Math.random() * 80;
                 this.braincells.push(new Braincell(bx, by, braincellId++));
               }
            } 
            // Powerup spawn chance (5%)
            else if (rand < 0.55) {
               const offsetX = (Math.random() - 0.5) * plat.w * 0.8;
               const px = plat.x + plat.w / 2 + offsetX;
               const py = plat.y - 50;
               const types = ['jump', 'speed', 'shield'];
               const type = types[Math.floor(Math.random() * types.length)];
               this.powerups.push({ x: px, y: py, type: type, id: powerupId++, collected: false });
            }
            // Obstacle spawn chance (5% and only on wide platforms)
            else if (rand < 0.60 && plat.w > 120) {
               const types = ['spike', 'bot'];
               const type = types[Math.floor(Math.random() * types.length)];
               const ow = type === 'spike' ? Math.min(plat.w * 0.3, 50) : 40;
               const oh = type === 'spike' ? 20 : 48;
               const ox = plat.x + plat.w / 2 - ow / 2;
               const oy = plat.y - oh;
               this.obstacles.push({ x: ox, y: oy, w: ow, h: oh, type: type, startX: ox, vx: Math.random() > 0.5 ? 2 : -2 });
            }
        });
      });

      this.totalBraincells = this.braincells.length;

      // Spawn Energy Gates on journey node platforms
      this.energyGates = [];
      const journeyNodes = document.querySelectorAll('.journey-node .node-content');
      journeyNodes.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const worldY = rect.top + window.scrollY;
        this.energyGates.push({
          x: rect.left,
          y: worldY,
          w: rect.width,
          h: rect.height,
          label: el.querySelector('h3') ? el.querySelector('h3').textContent.trim() : `Node ${idx + 1}`,
          hackProgress: 0,
          hacked: false,
          playerOnGate: false
        });
      });
    }

    spawnPlayer() {
      // Spawn floating in the hero section so the player can see them drop in
      const spawnX = window.innerWidth / 2 - PLAYER_W / 2;
      const spawnY = 100;
      this.player = new Player(spawnX, spawnY, this.spriteImg);
      this.checkpointX = this.player.x;
      this.checkpointY = this.player.y;
    }

    updateHUD() {
      this.hudCount.textContent = `${this.collected} / ${this.totalBraincells}`;
      this.hudLives.textContent = '❤️'.repeat(Math.max(0, this.lives));
      
      // Determine current section
      const py = this.player ? this.player.y : 0;
      const sectionNames = ['Hero', 'About', 'Skills', 'Quests', 'Journey', 'Contact'];
      const thresholds = [0, 800, 2000, 3200, 5000, 7000];
      let sectionName = sectionNames[0];
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (py >= thresholds[i]) {
          sectionName = sectionNames[i];
          break;
        }
      }
      this.hudSection.textContent = sectionName;
    }

    spawnCollectParticles(x, y) {
      for (let i = 0; i < 12; i++) {
        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 3,
          life: 1,
          size: Math.random() * 5 + 2,
          color: Math.random() > 0.5 ? '#CCFF00' : '#FFD700'
        });
      }
    }

    spawnFloatingText(x, y, text) {
      this.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        vy: -1.2,
        life: 1.0,
        decay: 0.018
      });
    }

    showOverlay(title, msg, btnText) {
      this.overlayTitle.textContent = title;
      this.overlayMsg.textContent = msg;
      this.overlayBtn.textContent = btnText;
      this.overlay.classList.add('active');
    }

    // ===== GAME LOOP =====
    loop() {
      if (this.state !== 'PLAYING') return;

      this.time += 0.016;

      // Re-scan platform positions (handles scroll offset changes)
      this.platforms.forEach(p => { if(p.update) p.update(); });

      // Update obstacles
      this.obstacles.forEach(obs => {
         if (obs.type === 'bot') {
            obs.x += obs.vx;
            if (Math.abs(obs.x - obs.startX) > 80) obs.vx *= -1;
         }
      });

      // Tutorial Pause Freeze Logic
      if (this.tutorialTimer > 0) {
        this.tutorialTimer--;
        this.render();
        
        // Draw the tutorial overlay on top
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(27, 20, 100, 0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#CCFF00';
        ctx.font = 'bold 24px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[ NEW MECHANIC DISCOVERED ]', this.canvas.width / 2, this.canvas.height / 2 - 40);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillText('Energy Gates detected below!', this.canvas.width / 2, this.canvas.height / 2 + 10);
        ctx.fillText('Land on the glowing platforms and wait to hack them for +1 HP.', this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        requestAnimationFrame(this._boundLoop);
        return;
      }

      // Update player
      this.player.update(this.input, this.platforms, this);

      // Camera follows player (with input and game instance)
      this.camera.follow(this.player, this.input, this);

      // Update checkpoint and section transitions
      const thresholds = [0, 800, 2000, 3200, 5000, 7000];
      const sectionTitles = ['STAGE 1: THE BUILDER', 'STAGE 2: THE ORIGIN', 'STAGE 3: THE ARSENAL', 'STAGE 4: ACTIVE QUESTS', 'STAGE 5: JOURNEY MAP', 'BOSS FIGHT: GATEKEEPER'];
      let sectionIndex = 0;
      
      for (const t of thresholds) {
        if (this.player.y > t) {
          this.checkpointY = Math.min(t + 100, this.player.y);
          this.checkpointX = this.player.x;
        }
      }

      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (this.player.y >= thresholds[i]) {
          sectionIndex = i;
          break;
        }
      }

      if (sectionIndex !== this.currentSectionIndex) {
        if (this.currentSectionIndex !== -1) {
          this.splashMessage = sectionTitles[sectionIndex];
          this.splashTimer = 120; // 2s at 60fps
          this.splashWorldY = thresholds[sectionIndex] + 200; // placed in-world near section start
          if (window.sfx && window.sfx.levelUp) window.sfx.levelUp();
        }
        this.currentSectionIndex = sectionIndex;
      }

      // Check for Tutorial trigger
      if (!this.hasShownHackingTutorial) {
        for (const gate of this.energyGates) {
          const dy = gate.y - this.player.y;
          // Trigger when player is within 350px vertically above any gate and relatively close horizontally
          if (dy > 0 && dy < 350 && Math.abs((gate.x + gate.w/2) - (this.player.x + this.player.w/2)) < window.innerWidth / 2) {
            this.hasShownHackingTutorial = true;
            this.tutorialTimer = 180; // 3 seconds freeze
            if (window.sfx && window.sfx.secret) window.sfx.secret();
            break;
          }
        }
      }

      // Energy Gate logic (Journey Map checkpoints)
      for (const gate of this.energyGates) {
        if (gate.hacked) continue;
        
        const px = this.player.x + this.player.w / 2;
        const py = this.player.y + this.player.h;
        
        gate.playerOnGate = (px > gate.x - 30 && px < gate.x + gate.w + 30 && py > gate.y - 20 && py < gate.y + gate.h + 20);
        
        if (gate.playerOnGate && this.player.grounded) {
          gate.hackProgress = Math.min(gate.hackProgress + 0.008, 1); // ~2 seconds to fill
          // Lock movement while hacking
          this.player.vx *= 0.3;
          
          // Ticking sound while hacking
          if (window.sfx && window.sfx.click && Math.random() < 0.2) window.sfx.click();

          if (gate.hackProgress >= 1) {
            gate.hacked = true;
            this.lives = Math.min(this.lives + 1, 5); // Max 5 lives
            this.updateHUD();
            
            this.spawnFloatingText(gate.x + gate.w / 2, gate.y - 20, `HACKED: +1 HP!`);
            this.spawnCollectParticles(gate.x + gate.w / 2, gate.y);
            if (window.sfx && window.sfx.achievement) window.sfx.achievement();
          }
        } else {
          gate.hackProgress = Math.max(gate.hackProgress - 0.005, 0); // slow decay
        }
      }

      // Update floating texts
      this.floatingTexts = this.floatingTexts.filter(ft => {
        ft.y += ft.vy;
        ft.life -= ft.decay;
        return ft.life > 0;
      });

      // Check braincell collection
      for (let i = this.braincells.length - 1; i >= 0; i--) {
        const bc = this.braincells[i];
        if (this.player.collectCheck(bc)) {
          this.collected++;
          this.braincells.splice(i, 1);
          if (window.sfx) window.sfx.collect();
          
          if (this.collected === 1 && window.checkAchievement) {
            window.checkAchievement('first_blood');
          }
          this.spawnCollectParticles(bc.x + BRAINCELL_SIZE / 2, bc.y + BRAINCELL_SIZE / 2);
          this.updateHUD();

          // Win check
          if (this.collected >= this.totalBraincells) {
            this.state = 'WIN';
            this.showOverlay(
              '🧠 ALL BRAINCELLS COLLECTED!',
              `You explored the entire portfolio! Aashray's brain is now fully powered.`,
              'Back to Portfolio'
            );
            return;
          }
        }
      }

      // Check Obstacles Collision
      if (this.player.invincible <= 0) {
         for (const obs of this.obstacles) {
            // AABB collision
            if (this.player.x < obs.x + obs.w &&
                this.player.x + this.player.w > obs.x &&
                this.player.y < obs.y + obs.h &&
                this.player.y + this.player.h > obs.y) {
               
               if (this.player.powerupShield > 0) {
                  // Shield absorbs hit
                  this.player.powerupShield = 0;
                  this.player.invincible = 120; // 2 seconds i-frames
               } else {
                  // Lose life
                  this.lives--;
                  if (window.sfx && window.sfx.error) window.sfx.error();
                  if (this.lives <= 0) {
                     this.state = 'LOSE';
                     this.showOverlay('GAME OVER', 'You got zapped. Play again?', 'Restart');
                  } else {
                     // Respawn at checkpoint
                     this.player.x = this.checkpointX;
                     this.player.y = this.checkpointY - 50;
                     this.player.vx = 0;
                     this.player.vy = 0;
                     this.player.invincible = 180; // 3 seconds blinking i-frames
                     this.camera.targetY = this.player.y - window.innerHeight * 0.35;
                     this.camera.y = this.camera.targetY;
                     window.scrollTo(0, this.camera.y);
                  }
               }
               break;
            }
         }
      }

      // Check Powerup Collision
      for (const p of this.powerups) {
         if (!p.collected) {
            const cx = this.player.x + this.player.w / 2;
            const cy = this.player.y + this.player.h / 2;
            const dist = Math.hypot(cx - p.x, cy - p.y);
            if (dist < (this.player.w / 2 + 15)) {
               p.collected = true;
               if (p.type === 'jump') this.player.powerupJump = 600; // 10s
               if (p.type === 'speed') this.player.powerupSpeed = 600; // 10s
               if (p.type === 'shield') this.player.powerupShield = 9999; // until hit
               this.spawnCollectParticles(p.x, p.y);
               // play tone if available
               if (window.sfx && window.sfx.levelUp) window.sfx.levelUp();
            }
         }
      }

      // Fall death check — die if falling off the visible screen, but only if the camera is close to the player (meaning the player is playing, not the user manually scrolling away)
      const viewportBottom = this.camera.y + window.innerHeight;
      const cameraCenteringY = this.player.y - window.innerHeight * 0.35;
      const cameraDist = Math.abs(window.scrollY - cameraCenteringY);

      if (this.player.y > viewportBottom + 100 && cameraDist < window.innerHeight * 0.6) {
        this.lives--;
        if (window.sfx && window.sfx.error) window.sfx.error();
        if (this.lives <= 0) {
          this.state = 'LOSE';
          this.showOverlay(
            '💀 GAME OVER',
            `You collected ${this.collected}/${this.totalBraincells} braincells. Try again!`,
            'Restart'
          );
          return;
        }
        // Respawn at checkpoint
        this.player.x = this.checkpointX;
        this.player.y = this.checkpointY;
        this.player.vx = 0;
        this.player.vy = 0;
        this.updateHUD();
      }

      // Prevent going off left/right edges
      if (this.player.x < 0) { this.player.x = 0; this.player.vx = 0; }
      const maxX = this.canvas.width - this.player.w;
      if (this.player.x > maxX) { this.player.x = maxX; this.player.vx = 0; }

      // Update particles
      this.particles = this.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= 0.03;
        return p.life > 0;
      });

      // Render
      this.render();

      requestAnimationFrame(this._boundLoop);
    }

    // ===== RENDERER =====
    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.save();
      // Translate by camera scroll position
      ctx.translate(0, -this.camera.y);

      // Draw platforms (visual game tiles over DOM)
      for (const p of this.platforms) {
        if (p.isMidAir) {
           // Mid-air floating tile — filled dark blue with glowing cyan border
           ctx.fillStyle = '#1B1464';
           ctx.fillRect(p.x, p.y, p.w, p.h);
           ctx.strokeStyle = '#00E5FF'; // neon cyan
           ctx.lineWidth = 1.5;
           ctx.strokeRect(p.x, p.y, p.w, p.h);
           // Grid pattern on tile
           ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
           for(let i=0; i<p.w; i+=10) {
             ctx.beginPath(); ctx.moveTo(p.x+i, p.y); ctx.lineTo(p.x+i, p.y+p.h); ctx.stroke();
           }
        } else {
           // Draw a beautiful thin deep blue line on the top (high contrast on neon yellow bg)
           ctx.fillStyle = '#1B1464';
           ctx.fillRect(p.x, p.y, p.w, 2);
           
           // A beautiful subtle gradient shadow below the top line
           const glowGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 15);
           glowGrad.addColorStop(0, 'rgba(27, 20, 100, 0.2)');
           glowGrad.addColorStop(1, 'rgba(27, 20, 100, 0)');
           ctx.fillStyle = glowGrad;
           ctx.fillRect(p.x, p.y + 2, p.w, 15);
        }
      }

      // Draw Obstacles
      for (const obs of this.obstacles) {
         drawPixelObstacle(ctx, obs.x, obs.y, obs.w, obs.h, obs.type, this.time);
      }

      // Draw Powerups
      for (const p of this.powerups) {
         if (!p.collected) drawPixelPowerup(ctx, p.x, p.y, p.type, this.time);
      }

      // Draw braincells
      for (const b of this.braincells) {
        if (b.collected) continue;
        const drawY = b.getDrawY(this.time);
        drawPixelBraincell(ctx, b.x + BRAINCELL_SIZE / 2, drawY + BRAINCELL_SIZE / 2, BRAINCELL_SIZE, this.time);
      }

      // Draw particles
      for (const p of this.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw floating texts
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 11px "Space Mono", monospace';
      for (const ft of this.floatingTexts) {
        const textW = ctx.measureText(ft.text).width;
        ctx.fillStyle = `rgba(255, 255, 255, ${ft.life * 0.95})`;
        ctx.beginPath();
        ctx.roundRect(ft.x - textW / 2 - 6, ft.y - 10, textW + 12, 20, 4);
        ctx.fill();
        ctx.strokeStyle = `rgba(27, 20, 100, ${ft.life * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = `rgba(27, 20, 100, ${ft.life})`;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.restore();

      // Draw player (pixel art bot)
      const px = this.player.x;
      const py = this.player.y;
      
      // Blinking effect if invincible
      let drawPlayer = true;
      if (this.player.invincible > 0 && Math.floor(this.time * 20) % 2 === 0) {
         drawPlayer = false;
      }
      
      if (drawPlayer) {
         if (this.player.powerupShield > 0) {
            // Draw shield aura
            ctx.beginPath();
            ctx.arc(px + this.player.w/2, py + this.player.h/2, 30, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
         }
         drawPixelBot(ctx, px, py, this.player.w, this.player.h, this.player.facingRight, this.player.grounded, this.time);
      }

      // Shadow below player
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(px + PLAYER_W / 2, py + PLAYER_H + 4, PLAYER_W / 2.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();


      // Arrow keys hint (first 4 seconds) — positioned relative to viewport
      if (this.time < 4) {
        const hintY = this.camera.y + 120;
        ctx.globalAlpha = Math.max(0, 1 - this.time / 4);
        ctx.fillStyle = '#1B1464';
        ctx.font = 'bold 18px "Space Mono", monospace';
        ctx.textAlign = 'center';
        // Background pill
        const text = '← → to move  |  SPACE to jump';
        const textW = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.roundRect(this.canvas.width / 2 - textW / 2 - 20, hintY - 15, textW + 40, 36, 18);
        ctx.fill();
        ctx.fillStyle = '#1B1464';
        ctx.fillText(text, this.canvas.width / 2, hintY);
        ctx.globalAlpha = 1;
      }
      
      // Draw Energy Gates (in world space)
      for (const gate of this.energyGates) {
        if (gate.hacked) continue;
        const gateDrawY = gate.y;
        // Gate outline
        ctx.strokeStyle = gate.playerOnGate ? '#CCFF00' : '#FF6B35';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(gate.x - 5, gateDrawY - 5, gate.w + 10, gate.h + 10);
        ctx.setLineDash([]);
        
        // Progress bar background
        const barW = Math.min(gate.w, 160);
        const barX = gate.x + (gate.w - barW) / 2;
        const barY = gateDrawY - 22;
        ctx.fillStyle = 'rgba(27, 20, 100, 0.7)';
        ctx.fillRect(barX, barY, barW, 12);
        // Progress bar fill
        ctx.fillStyle = gate.hackProgress > 0.7 ? '#CCFF00' : '#FF6B35';
        ctx.fillRect(barX, barY, barW * gate.hackProgress, 12);
        // Progress bar border
        ctx.strokeStyle = '#CCFF00';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, 12);
        
        // Label / Discoverability Prompt
        ctx.fillStyle = '#CCFF00';
        ctx.font = 'bold 11px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        if (gate.playerOnGate) {
          ctx.fillText('HACKING...', gate.x + gate.w / 2, barY - 4);
        } else {
          // Floating discoverability text
          const bounceOffset = Math.sin(Date.now() / 150) * 4;
          ctx.fillText('[ HACK FOR +1 HP ]', gate.x + gate.w / 2, barY - 10 + bounceOffset);
        }
      }

      // Draw Stage Splash Banner (world-positioned, scrolls with content)
      if (this.splashTimer > 0) {
        const splashY = this.splashWorldY;
        const alpha = Math.min(1, this.splashTimer / 30); // fade out in last 0.5s
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(27, 20, 100, 0.9)';
        ctx.fillRect(0, splashY - 45, this.canvas.width, 90);
        
        ctx.strokeStyle = '#CCFF00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, splashY - 45);
        ctx.lineTo(this.canvas.width, splashY - 45);
        ctx.moveTo(0, splashY + 45);
        ctx.lineTo(this.canvas.width, splashY + 45);
        ctx.stroke();

        ctx.fillStyle = '#CCFF00';
        ctx.font = 'bold 22px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.splashMessage, this.canvas.width / 2, splashY);
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    }
  }

  // ========== BOOTSTRAP ==========
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for the toggle button to exist in the DOM
    const checkReady = setInterval(() => {
      if (document.getElementById('game-toggle')) {
        clearInterval(checkReady);
        window.__braincellGame = new Game();
      }
    }, 100);
  });

})();
