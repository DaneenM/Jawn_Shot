console.log("Game.js loaded successfully!");
// Game state variables
let gameState = 'menu';
let gameMode = 'solo';
let score = 0;
let player2Score = 0;
let timeLeft = 180;
let streak = 0;
let isJawnMode = false;
let gameTimer = null;

// Shooting mechanics
let isAiming = false;
let aimStartX = 0;
let aimStartY = 0;
let aimCurrentX = 0;
let aimCurrentY = 0;
let powerMeter = 0;
let isPowerCharging = false;

// Game objects
let canvas, ctx;
let ball = null;
let hoop = { 
    x: 0, y: 0, width: 140, height: 25, 
    speed: 2, direction: 1, 
    pattern: 'horizontal', patternTimer: 0,
    baseY: 0, amplitude: 0
};
let particles = [];
let stars = [];
let coins = [];
let powerUps = [];
let multiplier = 1;
let multiplierTimer = 0;

// Enhanced game features
let screenShake = 0;
let slowMotion = false;
let slowMotionTimer = 0;
let comboMultiplier = 1;
let totalShots = 0;
let made = 0;

// Special effects
let hoopGlow = 0;
let perfectShotBonus = false;

// Performance optimization variables
let lastFrameTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

// Mobile optimization variables
let isMobile = false;
let mobileScale = 1;

// Philly sounds and memes
const phillySounds = [
    "YERRR!", "JAWN!", "Go Birds!", "WOODER!", "That's Fire!", 
    "SAUCE!", "Let's Go!", "FACTS!", "No Cap!", "SHEESH!",
    "PHILLY PHILLY!", "Trust the Process!", "BROTHERLY LOVE!"
];

const phillyMemes = [
    "You built like a cheesesteak! 🥪",
    "Allen Iverson approves! 👑", 
    "That's more Philly than Rocky! 🥊",
    "Wawa would be proud! ☕",
    "Liberty Bell is RINGING! 🔔",
    "You're colder than a Tastykake! 🧊",
    "Ben Franklin just shed a tear! 😢",
    "That shot was FIRE! 🔥",
    "You're the Process! 💪",
    "City of Brotherly Buckets! 🏀",
    "Smoother than a water ice! 🧊",
    "That's some Eagles energy! 🦅",
    "Sixers would draft you! 🏀",
    "More accurate than Septa! 🚇"
];

const perfectShotMemes = [
    "SWISH CITY! 💫",
    "NOTHING BUT NET! 🎯",
    "KOBE WOULD BE PROUD! 🐍",
    "PHILADELPHIA PERFECTION! ✨",
    "THAT'S SOME PROCESS! 🔥"
];

const missSounds = ["Bruh...", "Oof", "Yikes", "Nah fam", "Try again!", "Close jawn!", "Almost!"];

// Coin class for rewards
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = Math.random() * -8 - 2;
        this.rotation = 0;
        this.rotationSpeed = 0.2;
        this.life = 60;
        this.collected = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3;
        this.rotation += this.rotationSpeed;
        this.life--;
        this.vx *= 0.98;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Simplified coin rendering for performance
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10; // Reduced blur
        
        // Coin body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin detail
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Dollar sign
        ctx.shadowBlur = 0; // Remove shadow for text
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('$', 0, 4);
        
        ctx.restore();
    }
}

// Power-up class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'slowmo', 'multiball', 'bigshot', 'magnet'
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = Math.random() * -6 - 2;
        this.rotation = 0;
        this.life = 120;
        this.pulse = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.rotation += 0.1;
        this.pulse += 0.15;
        this.life--;
        this.vx *= 0.99;
    }

    draw() {
        const scale = 1 + Math.sin(this.pulse) * 0.2;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(scale, scale);
        
        // Reduced shadow blur for performance
        ctx.shadowBlur = 15;
        
        switch(this.type) {
            case 'slowmo':
                ctx.shadowColor = '#00FFFF';
                ctx.fillStyle = '#00FFFF';
                break;
            case 'multiball':
                ctx.shadowColor = '#FF00FF';
                ctx.fillStyle = '#FF00FF';
                break;
            case 'bigshot':
                ctx.shadowColor = '#FF6B35';
                ctx.fillStyle = '#FF6B35';
                break;
            case 'magnet':
                ctx.shadowColor = '#FFD700';
                ctx.fillStyle = '#FFD700';
                break;
        }
        
        // Power-up shape
        ctx.beginPath();
        ctx.roundRect(-15, -15, 30, 30, 8);
        ctx.fill();
        
        // Icon
        ctx.shadowBlur = 0; // Remove shadow for text
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        switch(this.type) {
            case 'slowmo': ctx.fillText('⏰', 0, 6); break;
            case 'multiball': ctx.fillText('⚡', 0, 6); break;
            case 'bigshot': ctx.fillText('💥', 0, 6); break;
            case 'magnet': ctx.fillText('🧲', 0, 6); break;
        }
        
        ctx.restore();
    }
}

// Enhanced Ball class with performance optimizations
class Ball {
    constructor(x, y, targetX, targetY, power, isJawnBall) {
        this.x = x;
        this.y = y;
        this.radius = isJawnBall ? 22 : 18;
        this.isJawn = isJawnBall;
        this.trail = [];
        this.hasScored = false;
        this.isPerfectShot = false;
        
        // FIXED: Much better trajectory calculation for proper arc shots
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Enhanced power system - more responsive
        const powerMultiplier = Math.max(1.2, Math.min(3.0, power / 120));
        
        // Calculate proper basketball trajectory
        const angle = Math.atan2(dy, dx);
        const launchSpeed = 12 + (powerMultiplier * 8); // Much faster base speed
        
        // Add upward arc for basketball shot
        const arcBoost = Math.min(distance * 0.015, 8); // More arc for longer shots
        
        this.vx = Math.cos(angle) * launchSpeed;
        this.vy = Math.sin(angle) * launchSpeed - arcBoost; // Subtract for upward boost
        
        this.gravity = 0.4; // Reduced gravity for better flight
        this.spin = (Math.random() - 0.5) * 0.3;
        this.bounces = 0;
    }

    update() {
        // Reduced trail length for performance
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > 8) this.trail.shift(); // Reduced from 15 to 8
        
        this.trail.forEach((point, i) => {
            point.alpha = (i + 1) / this.trail.length * 0.8; // Slightly reduced alpha
        });

        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        // Air resistance
        this.vx *= 0.998;
        this.vy *= 0.998;

        // Rim bouncing
        if (!this.hasScored && this.bounces < 2) {
            // Left rim
            if (this.x <= hoop.x + 25 && this.x >= hoop.x + 15 && 
                this.y >= hoop.y - 10 && this.y <= hoop.y + 10) {
                this.vx = Math.abs(this.vx) * 0.7;
                this.vy *= 0.8;
                this.bounces++;
            }
            // Right rim
            if (this.x >= hoop.x + hoop.width - 25 && this.x <= hoop.x + hoop.width - 15 && 
                this.y >= hoop.y - 10 && this.y <= hoop.y + 10) {
                this.vx = -Math.abs(this.vx) * 0.7;
                this.vy *= 0.8;
                this.bounces++;
            }
        }
    }

    draw() {
        // Optimized trail rendering - skip every other trail point for performance
        for (let i = 0; i < this.trail.length; i += 1) { // Draw every trail point but simplified
            const pos = this.trail[i];
            ctx.globalAlpha = pos.alpha * 0.6; // Reduced opacity for performance
            
            // Simplified trail without gradients for better performance
            ctx.fillStyle = this.isJawn ? '#00ff88' : '#ff6b35';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;

        // Reduced Jawn mode glow for performance
        if (this.isJawn) {
            ctx.shadowColor = 'rgba(0, 255, 136, 0.6)';
            ctx.shadowBlur = 15; // Reduced from 20
            ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Simplified ball gradient for performance
        ctx.fillStyle = this.isJawn ? '#00ff88' : '#ff8c5a';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ball details - simplified
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 2; // Reduced from 3
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Simplified basketball seams
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x, this.y + this.radius);
        ctx.stroke();
    }

    checkCollision() {
        // Enhanced collision detection - ball can go through hoop cleanly
        const hoopCenterX = hoop.x + hoop.width / 2;
        const hoopCenterY = hoop.y;
        const hoopLeft = hoop.x + 20;
        const hoopRight = hoop.x + hoop.width - 20;
        
        if (!this.hasScored && this.vy > 0) {
            // Check if ball goes through hoop cleanly (from above)
            if (this.y >= hoopCenterY - 25 && this.y <= hoopCenterY + 15 &&
                this.x >= hoopLeft && this.x <= hoopRight &&
                this.y - this.radius <= hoopCenterY) {
                
                this.hasScored = true;
                
                // Check for perfect shot (center of hoop)
                const distanceFromCenter = Math.abs(this.x - hoopCenterX);
                if (distanceFromCenter < 25) {
                    this.isPerfectShot = true;
                    perfectShotBonus = true;
                }
                
                return true;
            }
            
            // Also check traditional rim bouncing scoring zone
            if (this.y >= hoopCenterY - 15 && this.y <= hoopCenterY + 45 &&
                this.x >= hoopLeft && this.x <= hoopRight) {
                
                this.hasScored = true;
                
                // Check for perfect shot (center of hoop)
                const distanceFromCenter = Math.abs(this.x - hoopCenterX);
                if (distanceFromCenter < 30) {
                    this.isPerfectShot = true;
                    perfectShotBonus = true;
                }
                
                return true;
            }
        }
        return false;
    }
}

// Optimized Particle system
class Particle {
    constructor(x, y, color, type = 'normal', size = null) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 16;
        this.vy = Math.random() * -16 - 3;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.02; // Faster decay for performance
        this.color = color;
        this.size = size || (Math.random() * 8 + 3); // Smaller particles
        this.type = type;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3; // Reduced rotation speed
        this.gravity = type === 'confetti' ? 0.2 : 0.4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
        this.vx *= 0.97;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Simplified particle rendering for performance
        ctx.fillStyle = this.color;
        if (this.type === 'star') {
            // Simplified star shape
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size * 0.3, -this.size * 0.3);
            ctx.lineTo(this.size, 0);
            ctx.lineTo(this.size * 0.3, this.size * 0.3);
            ctx.lineTo(0, this.size);
            ctx.lineTo(-this.size * 0.3, this.size * 0.3);
            ctx.lineTo(-this.size, 0);
            ctx.lineTo(-this.size * 0.3, -this.size * 0.3);
            ctx.closePath();
            ctx.fill();
        } else {
            // Regular circle or square
            ctx.beginPath();
            if (this.type === 'confetti') {
                ctx.rect(-this.size/2, -this.size/2, this.size, this.size);
            } else {
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            }
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Detect mobile device
function detectMobile() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    mobileScale = isMobile ? Math.min(window.innerWidth / 375, 1) : 1;
}

// Initialize game
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Detect mobile first
    detectMobile();
    
    // Mobile-friendly canvas setup
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';
    canvas.style.webkitUserSelect = 'none';
    canvas.style.msUserSelect = 'none';
    
    resizeCanvas();
    setupEventListeners();
    gameLoop();
}

function resizeCanvas() {
    // Update mobile detection on resize
    detectMobile();
    
    // High DPI support for mobile
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    
    ctx.scale(dpr, dpr);
    
    // Mobile-optimized hoop positioning - much more dynamic range
    if (isMobile) {
        // Vertical mobile: hoop can be much lower and vary more dramatically
        hoop.y = window.innerHeight * (0.25 + Math.random() * 0.35); // Between 25% and 60% of screen
        hoop.baseY = hoop.y;
    } else {
        // Desktop: keep original positioning
        hoop.y = window.innerHeight * 0.18;
        hoop.baseY = hoop.y;
    }
    
    if (hoop.x === 0) hoop.x = window.innerWidth / 2 - hoop.width / 2;
    
    createStars();
}

function createStars() {
    stars = [];
    // Reduced star count for performance, especially on mobile
    const starCount = isMobile ? 30 : 50;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 2 + 1, // Smaller stars
            twinkle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02 + 0.01, // Slower twinkling
            alpha: Math.random() * 0.6 + 0.2 // Reduced alpha
        });
    }
}

function setupEventListeners() {
    window.addEventListener('resize', resizeCanvas);
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    canvas.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Touch events with better mobile support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = window.innerWidth / rect.width;
            const scaleY = window.innerHeight / rect.height;
            startAiming(
                (touch.clientX - rect.left) * scaleX, 
                (touch.clientY - rect.top) * scaleY
            );
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = window.innerWidth / rect.width;
            const scaleY = window.innerHeight / rect.height;
            updateAiming(
                (touch.clientX - rect.left) * scaleX, 
                (touch.clientY - rect.top) * scaleY
            );
        }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        shoot();
    }, { passive: false });

    // Mouse events (for desktop)
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = window.innerWidth / rect.width;
        const scaleY = window.innerHeight / rect.height;
        startAiming(
            (e.clientX - rect.left) * scaleX, 
            (e.clientY - rect.top) * scaleY
        );
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = window.innerWidth / rect.width;
        const scaleY = window.innerHeight / rect.height;
        updateAiming(
            (e.clientX - rect.left) * scaleX, 
            (e.clientY - rect.top) * scaleY
        );
    });

    canvas.addEventListener('mouseup', () => {
        shoot();
    });

    // Prevent page scrolling and zooming on mobile
    document.addEventListener('touchmove', (e) => {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('gesturechange', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('gestureend', (e) => {
        e.preventDefault();
    }, { passive: false });
}

function startGame(mode) {
    gameMode = mode;
    gameState = 'playing';
    score = 0;
    player2Score = 0;
    timeLeft = 180;
    streak = 0;
    isJawnMode = false;
    ball = null;
    particles = [];
    coins = [];
    powerUps = [];
    multiplier = 1;
    totalShots = 0;
    made = 0;
    comboMultiplier = 1;
    
    // Random hoop movement pattern from expanded list
    const patterns = ['horizontal', 'vertical', 'figure8', 'random', 'spiral', 'zigzag', 'teleport', 'orbit', 'earthquake', 'wave'];
    hoop.pattern = patterns[Math.floor(Math.random() * patterns.length)];
    hoop.patternTimer = 0;
    hoop.amplitude = 40 + Math.random() * 80; // More variation in movement range
    
    // Mobile: Start with dynamic hoop positioning for power bar purpose
    if (isMobile) {
        hoop.y = window.innerHeight * (0.25 + Math.random() * 0.35); // Random start position
        hoop.baseY = hoop.y;
    }
    
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('shootingGuide').style.display = 'block';
    
    updateUI();
    
    gameTimer = setInterval(() => {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function updateHoopMovement() {
    hoop.patternTimer += 0.03;
    
    switch(hoop.pattern) {
        case 'horizontal':
            // Classic left-right with speed variation and better bounds
            hoop.x += hoop.speed * hoop.direction;
            if (hoop.x <= 80 || hoop.x >= window.innerWidth - hoop.width - 80) {
                hoop.direction *= -1;
                hoop.speed = 2 + Math.random() * 3;
                // Ensure hoop doesn't get stuck in corners
                hoop.x = Math.max(80, Math.min(window.innerWidth - hoop.width - 80, hoop.x));
            }
            break;
            
        case 'vertical':
            // Enhanced vertical movement - much more dramatic on mobile
            const verticalRange = isMobile ? hoop.amplitude * 1.5 : hoop.amplitude;
            hoop.y = hoop.baseY + Math.sin(hoop.patternTimer * 2) * verticalRange;
            hoop.x += hoop.speed * hoop.direction * 0.6;
            if (hoop.x <= 80 || hoop.x >= window.innerWidth - hoop.width - 80) {
                hoop.direction *= -1;
                hoop.x = Math.max(80, Math.min(window.innerWidth - hoop.width - 80, hoop.x));
            }
            break;
            
        case 'figure8':
            // Smooth figure-8 pattern across screen with mobile depth variation
            hoop.x = (window.innerWidth / 2) + Math.sin(hoop.patternTimer) * (window.innerWidth * 0.3);
            const depthVariation = isMobile ? hoop.amplitude * 1.2 : hoop.amplitude * 0.8;
            hoop.y = hoop.baseY + Math.sin(hoop.patternTimer * 2) * depthVariation;
            break;
            
        case 'random':
            // Chaotic movement with mobile depth changes
            if (Math.random() < 0.03) {
                hoop.speed = 2 + Math.random() * 5;
                hoop.direction = Math.random() > 0.5 ? 1 : -1;
            }
            hoop.x += hoop.speed * hoop.direction;
            if (hoop.x <= 80 || hoop.x >= window.innerWidth - hoop.width - 80) {
                hoop.direction *= -1;
                hoop.x = Math.max(80, Math.min(window.innerWidth - hoop.width - 80, hoop.x));
            }
            // Enhanced random vertical movement on mobile
            if (Math.random() < 0.02) {
                const maxDepth = isMobile ? window.innerHeight * 0.4 : hoop.amplitude * 1.5;
                hoop.y = hoop.baseY + (Math.random() - 0.5) * maxDepth;
            }
            break;
            
        case 'spiral':
            // Spiral with mobile depth variation
            const spiralRadius = Math.min(window.innerWidth, window.innerHeight) * 0.25;
            hoop.x = (window.innerWidth / 2) + Math.cos(hoop.patternTimer) * spiralRadius * Math.sin(hoop.patternTimer * 0.3);
            const spiralDepth = isMobile ? spiralRadius * 0.5 : spiralRadius * 0.3;
            hoop.y = hoop.baseY + Math.sin(hoop.patternTimer) * spiralDepth * Math.cos(hoop.patternTimer * 0.2);
            break;
            
        case 'zigzag':
            // Sharp zigzag with mobile depth changes
            const zigzagSpeed = 4;
            const zigzagTime = Math.floor(hoop.patternTimer * 3) % 4;
            const depthMultiplier = isMobile ? 1.5 : 0.5;
            switch(zigzagTime) {
                case 0: hoop.x += zigzagSpeed; hoop.y -= zigzagSpeed * depthMultiplier; break;
                case 1: hoop.x += zigzagSpeed; hoop.y += zigzagSpeed * depthMultiplier; break;
                case 2: hoop.x -= zigzagSpeed; hoop.y += zigzagSpeed * depthMultiplier; break;
                case 3: hoop.x -= zigzagSpeed; hoop.y -= zigzagSpeed * depthMultiplier; break;
            }
            // Enhanced bounds checking to prevent corner freezing
            if (hoop.x <= 80 || hoop.x >= window.innerWidth - hoop.width - 80) {
                hoop.patternTimer += 1; // Force direction change
                hoop.x = Math.max(80, Math.min(window.innerWidth - hoop.width - 80, hoop.x));
            }
            break;
            
        case 'teleport':
            // Teleporting with mobile depth variation
            if (Math.floor(hoop.patternTimer * 2) % 6 === 0 && Math.random() < 0.05) {
                // Teleport to random location with depth on mobile
                hoop.x = 120 + Math.random() * (window.innerWidth - hoop.width - 240);
                if (isMobile) {
                    hoop.y = window.innerHeight * (0.2 + Math.random() * 0.5); // Wide depth range
                } else {
                    hoop.y = hoop.baseY + (Math.random() - 0.5) * hoop.amplitude;
                }
                
                // Visual effect for teleport
                createScoreEffect(hoop.x + hoop.width/2, hoop.y, false);
                showSoundBubble("TELEPORT! 🌀");
            }
            break;
            
        case 'orbit':
            // Orbit with mobile depth variation
            const orbitRadius = Math.min(window.innerWidth, window.innerHeight) * 0.22;
            const centerX = window.innerWidth / 2;
            const centerY = hoop.baseY;
            hoop.x = centerX + Math.cos(hoop.patternTimer * 1.5) * orbitRadius - hoop.width/2;
            const orbitDepth = isMobile ? orbitRadius * 0.8 : orbitRadius * 0.6;
            hoop.y = centerY + Math.sin(hoop.patternTimer * 1.5) * orbitDepth;
            break;
            
        case 'earthquake':
            // Earthquake with mobile depth variation
            const baseX = window.innerWidth / 2 - hoop.width / 2;
            hoop.x = Math.max(80, Math.min(window.innerWidth - hoop.width - 80, baseX + (Math.random() - 0.5) * 80));
            const quakeDepth = isMobile ? 60 : 40;
            hoop.y = hoop.baseY + (Math.random() - 0.5) * quakeDepth;
            // Add screen shake effect
            screenShake = Math.max(screenShake, 3);
            break;
            
        case 'wave':
            // Wave with mobile depth variation
            hoop.x = 80 + (Math.sin(hoop.patternTimer) + 1) * (window.innerWidth - hoop.width - 160) / 2;
            const waveDepth = isMobile ? hoop.amplitude * 0.8 : hoop.amplitude * 0.4;
            hoop.y = hoop.baseY + Math.sin(hoop.patternTimer * 3) * waveDepth;
            break;
    }
    
    // Enhanced mobile bounds checking with wider depth range
    hoop.x = Math.max(80, Math.min(window.innerWidth - hoop.width - 80, hoop.x));
    if (isMobile) {
        // Mobile: Allow hoop much lower and higher for power bar usage
        hoop.y = Math.max(100, Math.min(window.innerHeight * 0.75, hoop.y));
    } else {
        // Desktop: Keep reasonable bounds
        hoop.y = Math.max(80, Math.min(window.innerHeight * 0.5, hoop.y));
    }
}

function endGame() {
    clearInterval(gameTimer);
    gameState = 'gameOver';
    document.getElementById('shootingGuide').style.display = 'none';
    
    const accuracy = totalShots > 0 ? Math.round((made / totalShots) * 100) : 0;
    
    const finalScoreEl = document.getElementById('finalScore');
    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverMessage = document.getElementById('gameOverMessage');
    
    if (gameMode === 'vs') {
        if (score > player2Score) {
            gameOverTitle.textContent = "PLAYER 1 WINS! 🏆";
            finalScoreEl.textContent = `${score} - ${player2Score}`;
        } else if (player2Score > score) {
            gameOverTitle.textContent = "PLAYER 2 WINS! 🏆";
            finalScoreEl.textContent = `${player2Score} - ${score}`;
        } else {
            gameOverTitle.textContent = "IT'S A TIE! 🤝";
            finalScoreEl.textContent = `${score} - ${player2Score}`;
        }
    } else {
        gameOverTitle.textContent = "JAWN COMPLETE!";
        finalScoreEl.textContent = `Score: ${score} | Accuracy: ${accuracy}%`;
        
        if (score >= 100) gameOverMessage.textContent = "LEGENDARY JAWN STATUS! 👑💎";
        else if (score >= 75) gameOverMessage.textContent = "ELITE PHILADELPHIA SHOOTER! 🔥🏀";
        else if (score >= 50) gameOverMessage.textContent = "PROCESS APPROVED! 💪⚡";
        else if (score >= 30) gameOverMessage.textContent = "That's some good jawn! 🎯";
        else if (score >= 15) gameOverMessage.textContent = "Not bad, jawn! 👍";
        else gameOverMessage.textContent = "Keep practicing, jawn! 🏀💪";
    }
    
    document.getElementById('gameOver').style.display = 'block';
}

function showMainMenu() {
    gameState = 'menu';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('streakIndicator').style.display = 'none';
    document.getElementById('shootingGuide').style.display = 'none';
}

function updateUI() {
    const accuracy = totalShots > 0 ? Math.round((made / totalShots) * 100) : 0;
    
    document.getElementById('scoreValue').textContent = gameMode === 'vs' ? 
        `P1: ${score} | P2: ${player2Score}` : 
        `${score} (${accuracy}%)`;
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timerValue').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (streak >= 3) {
        document.getElementById('streakIndicator').style.display = 'block';
        document.getElementById('streakCount').textContent = streak;
    } else {
        document.getElementById('streakIndicator').style.display = 'none';
    }
}

function startAiming(x, y) {
    if (gameState !== 'playing' || ball) return;
    
    isAiming = true;
    isPowerCharging = true;
    aimStartX = x;
    aimStartY = y;
    aimCurrentX = x;
    aimCurrentY = y;
    powerMeter = 0;
}

function updateAiming(x, y) {
    if (!isAiming) return;
    aimCurrentX = x;
    aimCurrentY = y;
    
    // Enhanced power system - increases while aiming, decreases when idle
    if (isPowerCharging) {
        powerMeter = Math.min(300, powerMeter + 6); // Slightly slower increase
    } else {
        powerMeter = Math.max(0, powerMeter - 2); // Decrease when not actively charging
    }
}

function shoot() {
    if (!isAiming || gameState !== 'playing') return;
    
    const shooterX = window.innerWidth / 2;
    const shooterY = window.innerHeight - (isMobile ? 80 : 60); // Lower position on mobile
    
    const aimDistance = Math.sqrt(
        (aimCurrentX - aimStartX) ** 2 + (aimCurrentY - aimStartY) ** 2
    );
    
    const finalPower = Math.max(aimDistance, powerMeter);
    ball = new Ball(shooterX, shooterY, aimCurrentX, aimCurrentY, finalPower, isJawnMode);
    
    totalShots++;
    isAiming = false;
    isPowerCharging = false;
    powerMeter = 0;
    
    // Screen shake for powerful shots
    if (finalPower > 200) {
        screenShake = 8;
    }
}

function showSoundBubble(text) {
    const bubble = document.getElementById('soundBubble');
    if (!bubble) return;
    
    bubble.textContent = text;
    bubble.style.left = Math.random() * (window.innerWidth - 250) + 'px';
    bubble.style.top = Math.random() * (window.innerHeight - 200) + 150 + 'px';
    bubble.style.transform = 'scale(1)';
    
    setTimeout(() => {
        bubble.style.transform = 'scale(0)';
    }, 2000);
}

function showMemeBubble(text) {
    const bubble = document.getElementById('memeBubble');
    if (!bubble) return;
    
    bubble.textContent = text;
    bubble.style.left = '50%';
    bubble.style.top = isMobile ? '25%' : '30%';
    bubble.style.marginLeft = '-175px';
    bubble.style.transform = 'scale(1)';
    
    setTimeout(() => {
        bubble.style.transform = 'scale(0)';
    }, 3500);
}

function createScoreEffect(x, y, isPerfect = false) {
    const colors = isPerfect ? 
        ['#FFD700', '#FFA500', '#FFFF00', '#FF6B35'] :
        isJawnMode ? 
        ['#00ff88', '#ffffff', '#00cc6a'] : 
        ['#ff6b35', '#f7931e', '#ffffff'];
    
    // Reduced particle count for performance, especially on mobile
    const particleCount = isMobile ? 
        (isPerfect ? 15 : 8) : 
        (isPerfect ? 20 : 12);
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(
            x, y, 
            colors[Math.floor(Math.random() * colors.length)],
            Math.random() > 0.5 ? 'star' : 'confetti'
        ));
    }
    
    // Add coins for good shots
    if (isPerfect || isJawnMode) {
        for (let i = 0; i < 3; i++) {
            coins.push(new Coin(x + (Math.random() - 0.5) * 50, y));
        }
    }
    
    // Occasional power-ups
    if (Math.random() < 0.15 && streak >= 2) {
        const powerUpTypes = ['slowmo', 'multiball', 'bigshot', 'magnet'];
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        powerUps.push(new PowerUp(x, y - 30, randomType));
    }
}

function drawBackground() {
    // Apply screen shake
    if (screenShake > 0) {
        ctx.save();
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
        screenShake *= 0.8;
        if (screenShake < 0.1) screenShake = 0;
    }
    
    // Simplified gradient for performance
    const gradient = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
    gradient.addColorStop(0, '#0a1f2e');
    gradient.addColorStop(0.3, '#1a4b3a');
    gradient.addColorStop(0.7, '#2d1b3d');
    gradient.addColorStop(1, '#1e3a5f');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Optimized twinkling stars - only update every few frames
    if (Date.now() % 3 === 0) { // Update every 3rd frame for performance
        stars.forEach(star => {
            star.twinkle += star.speed;
            const alpha = (Math.sin(star.twinkle) + 1) / 2 * star.alpha;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    } else {
        // Just draw stars without updating twinkle
        stars.forEach(star => {
            const alpha = (Math.sin(star.twinkle) + 1) / 2 * star.alpha;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    ctx.globalAlpha = 1;
    
    if (screenShake > 0) {
        ctx.restore();
    }
}

function drawModernHoop() {
    // Hoop glow effect when streak is high
    if (streak >= 3) {
        hoopGlow = Math.min(hoopGlow + 2, 20); // Reduced max glow
    } else {
        hoopGlow = Math.max(hoopGlow - 1, 0);
    }
    
    if (hoopGlow > 0) {
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = hoopGlow;
    }
    
    // Simplified hoop gradient
    ctx.fillStyle = '#ff8c5a';
    
    // Hoop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(hoop.x + 4, hoop.y + 4, hoop.width, hoop.height);
    
    // Main hoop
    ctx.fillStyle = '#d4441a';
    ctx.fillRect(hoop.x, hoop.y, hoop.width, hoop.height);
    
    // Hoop rim
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4; // Reduced from 5
    ctx.beginPath();
    ctx.moveTo(hoop.x, hoop.y);
    ctx.lineTo(hoop.x + hoop.width, hoop.y);
    ctx.stroke();
    
    // Inner rim highlight
    ctx.strokeStyle = '#ffaa7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hoop.x + 5, hoop.y + 2);
    ctx.lineTo(hoop.x + hoop.width - 5, hoop.y + 2);
    ctx.stroke();

    // Simplified net - fewer strands for performance
    const netSway = Math.sin(Date.now() * 0.003) * 2; // Reduced sway
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2; // Reduced from 3
    ctx.lineCap = 'round';
    
    const netStrands = isMobile ? 4 : 6; // Even fewer strands on mobile
    for (let i = 0; i < netStrands; i++) {
        const x = hoop.x + 25 + (i * (hoop.width - 50) / (netStrands - 1));
        const sway = netSway * (i % 2 ? 1 : -1);
        
        ctx.beginPath();
        ctx.moveTo(x, hoop.y);
        ctx.quadraticCurveTo(x + sway, hoop.y + 20, x + sway * 1.5, hoop.y + 35);
        ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
}

function drawAimLine() {
    if (!isAiming) return;
    
    const shooterX = window.innerWidth / 2;
    const shooterY = window.innerHeight - (isMobile ? 80 : 60);
    
    // Power meter visualization
    const powerPercent = powerMeter / 300;
    const powerColor = `hsl(${120 - powerPercent * 120}, 100%, 50%)`;
    
    // Simplified trajectory arc
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.7)';
    ctx.lineWidth = isMobile ? 4 : 3;
    ctx.setLineDash([6, 3]); // Reduced dash size
    
    const steps = isMobile ? 8 : 12; // Fewer steps on mobile
    ctx.beginPath();
    ctx.moveTo(shooterX, shooterY);
    
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = shooterX + (aimCurrentX - shooterX) * t;
        const y = shooterY + (aimCurrentY - shooterY) * t + (t * t * 200);
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Mobile-optimized power meter bar - positioned much higher to avoid instruction overlap
    if (isPowerCharging || powerMeter > 0) {
        const barWidth = Math.min(isMobile ? 180 : 200, window.innerWidth * 0.6);
        const barHeight = isMobile ? 30 : 25;
        const barX = window.innerWidth / 2 - barWidth / 2;
        const barY = window.innerHeight - (isMobile ? 250 : 140); // Much higher on mobile
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);
        
        // Power fill
        ctx.fillStyle = powerColor;
        ctx.fillRect(barX, barY, barWidth * powerPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${isMobile ? 20 : 18}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('POWER', window.innerWidth / 2, barY - (isMobile ? 20 : 15));
    }
    
    // Target indicator - larger for mobile
    const targetSize = isMobile ? 25 + powerPercent * 20 : 20 + powerPercent * 15;
    ctx.strokeStyle = powerColor;
    ctx.lineWidth = isMobile ? 5 : 4;
    ctx.beginPath();
    ctx.arc(aimCurrentX, aimCurrentY, targetSize, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner crosshairs
    ctx.lineWidth = isMobile ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(aimCurrentX - targetSize/2, aimCurrentY);
    ctx.lineTo(aimCurrentX + targetSize/2, aimCurrentY);
    ctx.moveTo(aimCurrentX, aimCurrentY - targetSize/2);
    ctx.lineTo(aimCurrentX, aimCurrentY + targetSize/2);
    ctx.stroke();
}

function drawShooter() {
    const shooterX = window.innerWidth / 2;
    const shooterY = window.innerHeight - (isMobile ? 80 : 60);
    const shooterRadius = isMobile ? 45 : 35; // Slightly larger for enhanced styling
    
    // Enhanced PHI shooter with Eagles/Philly theme
    if (isJawnMode) {
        // Jawn mode: Mega enhanced styling
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 25;
        
        // Multiple gradient rings for depth
        const jawnGradient = ctx.createRadialGradient(
            shooterX - 10, shooterY - 10, 0,
            shooterX, shooterY, shooterRadius + 15
        );
        jawnGradient.addColorStop(0, '#ffffff');
        jawnGradient.addColorStop(0.3, '#00ff88');
        jawnGradient.addColorStop(0.6, '#004C54');
        jawnGradient.addColorStop(1, '#00ff88');
        
        ctx.fillStyle = jawnGradient;
        ctx.beginPath();
        ctx.arc(shooterX, shooterY, shooterRadius + 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Jawn mode rotating energy rings - more dramatic
        const time = Date.now() * 0.005;
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = `rgba(0, 255, 136, ${0.6 - i * 0.2})`;
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 8]);
            ctx.beginPath();
            ctx.arc(shooterX, shooterY, shooterRadius + 15 + i * 15 + Math.sin(time + i) * 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
    } else {
        // Regular mode: Enhanced Eagles-themed styling
        ctx.shadowColor = '#004C54';
        ctx.shadowBlur = 20;
        
        // Eagles color gradient
        const eaglesGradient = ctx.createRadialGradient(
            shooterX - 8, shooterY - 8, 0,
            shooterX, shooterY, shooterRadius + 5
        );
        eaglesGradient.addColorStop(0, '#00ff88');
        eaglesGradient.addColorStop(0.4, '#004C54');
        eaglesGradient.addColorStop(0.7, '#A5ACAF');
        eaglesGradient.addColorStop(1, '#004C54');
        
        ctx.fillStyle = eaglesGradient;
        ctx.beginPath();
        ctx.arc(shooterX, shooterY, shooterRadius + 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Subtle rotating ring for regular mode
        const time = Date.now() * 0.003;
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(shooterX, shooterY, shooterRadius + 12 + Math.sin(time) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Main shooter circle with enhanced border
    const mainGradient = ctx.createRadialGradient(
        shooterX - 6, shooterY - 6, 0,
        shooterX, shooterY, shooterRadius
    );
    
    if (isJawnMode) {
        mainGradient.addColorStop(0, '#ffffff');
        mainGradient.addColorStop(0.5, '#00ff88');
        mainGradient.addColorStop(1, '#004C54');
    } else {
        mainGradient.addColorStop(0, '#00ff88');
        mainGradient.addColorStop(0.6, '#004C54');
        mainGradient.addColorStop(1, '#002d30');
    }
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(shooterX, shooterY, shooterRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Enhanced border with multiple layers
    ctx.shadowBlur = 0;
    
    // Outer border - Eagles silver
    ctx.strokeStyle = '#A5ACAF';
    ctx.lineWidth = isMobile ? 6 : 5;
    ctx.beginPath();
    ctx.arc(shooterX, shooterY, shooterRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner border - White highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = isMobile ? 3 : 2;
    ctx.beginPath();
    ctx.arc(shooterX, shooterY, shooterRadius - 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Philadelphia text with enhanced styling
    ctx.fillStyle = isJawnMode ? '#004C54' : '#ffffff';
    ctx.font = `bold ${isMobile ? 24 : 20}px Arial Black`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = isJawnMode ? '#ffffff' : '#000000';
    ctx.lineWidth = 2;
    
    // Text shadow for better visibility
    if (isJawnMode) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } else {
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
    }
    
    // Draw text with outline
    ctx.strokeText('PHI', shooterX, shooterY + (isMobile ? 8 : 6));
    ctx.fillText('PHI', shooterX, shooterY + (isMobile ? 8 : 6));
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add Eagles emoji for extra flair in Jawn mode
    if (isJawnMode) {
        ctx.font = `${isMobile ? 20 : 16}px Arial`;
        ctx.fillText('🦅', shooterX + shooterRadius - 10, shooterY - shooterRadius + 15);
    }
}

// Optimized game loop with frame rate limiting
function gameLoop(currentTime) {
    // Frame rate limiting for performance
    if (currentTime - lastFrameTime < frameInterval) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastFrameTime = currentTime;

    drawBackground();

    if (gameState === 'playing') {
        // Update timers
        if (multiplierTimer > 0) {
            multiplierTimer--;
            if (multiplierTimer === 0) multiplier = 1;
        }
        
        if (slowMotionTimer > 0) {
            slowMotionTimer--;
            if (slowMotionTimer === 0) slowMotion = false;
        }

        // Update hoop movement
        updateHoopMovement();
        
        drawModernHoop();
        drawShooter();
        drawAimLine();

        // Update and draw ball
        if (ball) {
            ball.update();
            ball.draw();

            // Check scoring
            if (ball.checkCollision()) {
                let points = ball.isJawn ? 8 : 2;
                
                // Perfect shot bonus
                if (ball.isPerfectShot) {
                    points *= 2;
                    showSoundBubble(perfectShotMemes[Math.floor(Math.random() * perfectShotMemes.length)]);
                    createScoreEffect(ball.x, ball.y, true);
                } else {
                    showSoundBubble(phillySounds[Math.floor(Math.random() * phillySounds.length)]);
                    createScoreEffect(ball.x, ball.y, false);
                }
                
                // Apply multipliers
                points *= multiplier;
                points *= comboMultiplier;
                points = Math.floor(points);
                
                if (gameMode === 'vs' && Math.random() > 0.5) {
                    player2Score += points;
                } else {
                    score += points;
                }
                
                made++;
                streak++;
                
                // Increase combo multiplier
                if (streak >= 5) comboMultiplier = Math.min(3, 1 + (streak - 4) * 0.2);
                
                // Streak bonuses
                if (streak === 5) {
                    showMemeBubble(phillyMemes[Math.floor(Math.random() * phillyMemes.length)]);
                }
                
                if (streak >= 3) {
                    isJawnMode = true;
                    if (streak === 3) {
                        showMemeBubble("JAWN MODE ACTIVATED! 💥⚡");
                    }
                }
                
                // Change hoop pattern more frequently and announce it
                if (streak % 5 === 0) {
                    const patterns = ['horizontal', 'vertical', 'figure8', 'random', 'spiral', 'zigzag', 'teleport', 'orbit', 'earthquake', 'wave'];
                    const newPattern = patterns[Math.floor(Math.random() * patterns.length)];
                    hoop.pattern = newPattern;
                    hoop.patternTimer = 0;
                    
                    const patternNames = {
                        'horizontal': 'SIDE HUSTLE! ↔️',
                        'vertical': 'BOUNCY CASTLE! ↕️', 
                        'figure8': 'FIGURE EIGHT! ∞',
                        'random': 'CHAOS MODE! 🌪️',
                        'spiral': 'SPIRAL MADNESS! 🌀',
                        'zigzag': 'ZIG ZAG ATTACK! ⚡',
                        'teleport': 'TELEPORT MODE! 🌀',
                        'orbit': 'ORBIT ACTIVATED! 🪐',
                        'earthquake': 'EARTHQUAKE! 🌋',
                        'wave': 'WAVE RIDER! 🌊'
                    };
                    
                    showMemeBubble(patternNames[newPattern] || "NEW PATTERN!");
                }
                
                ball = null;
                updateUI();
            }

            // Remove ball if off screen
            if (ball && (ball.y > window.innerHeight + 100 || ball.x < -100 || ball.x > window.innerWidth + 100)) {
                if (ball.y > window.innerHeight + 100) {
                    streak = 0;
                    isJawnMode = false;
                    comboMultiplier = 1;
                    showSoundBubble(missSounds[Math.floor(Math.random() * missSounds.length)]);
                }
                ball = null;
                updateUI();
            }
        }

        // Update and draw particles - limit to 30 max on mobile for performance
        const maxParticles = isMobile ? 30 : 50;
        particles = particles.filter(particle => {
            particle.update();
            particle.draw();
            return particle.life > 0;
        });
        if (particles.length > maxParticles) {
            particles = particles.slice(-maxParticles); // Keep only the newest
        }
        
        // Update and draw coins
        coins = coins.filter(coin => {
            coin.update();
            coin.draw();
            
            // Auto-collect coins near shooter - larger radius for mobile
            const shooterX = window.innerWidth / 2;
            const shooterY = window.innerHeight - (isMobile ? 80 : 60);
            const distance = Math.sqrt((coin.x - shooterX) ** 2 + (coin.y - shooterY) ** 2);
            
            if (distance < (isMobile ? 90 : 70) && !coin.collected) {
                coin.collected = true;
                score += 5;
                showSoundBubble("COIN! +5");
                return false;
            }
            
            return coin.life > 0;
        });
        
        // Update and draw power-ups
        powerUps = powerUps.filter(powerUp => {
            powerUp.update();
            powerUp.draw();
            
            // Auto-collect power-ups near shooter - larger radius for mobile
            const shooterX = window.innerWidth / 2;
            const shooterY = window.innerHeight - (isMobile ? 80 : 60);
            const distance = Math.sqrt((powerUp.x - shooterX) ** 2 + (powerUp.y - shooterY) ** 2);
            
            if (distance < (isMobile ? 100 : 80)) {
                // Activate power-up
                switch(powerUp.type) {
                    case 'slowmo':
                        slowMotion = true;
                        slowMotionTimer = 300;
                        showMemeBubble("SLOW MOTION ACTIVATED! ⏰");
                        break;
                    case 'multiball':
                        multiplier = 2;
                        multiplierTimer = 300;
                        showMemeBubble("2X MULTIPLIER! ⚡");
                        break;
                    case 'bigshot':
                        // Next shot is guaranteed jawn mode
                        isJawnMode = true;
                        showMemeBubble("BIG SHOT MODE! 💥");
                        break;
                    case 'magnet':
                        // Make next few shots easier
                        hoop.speed *= 0.3;
                        setTimeout(() => { hoop.speed /= 0.3; }, 5000);
                        showMemeBubble("MAGNETIC HOOP! 🧲");
                        break;
                }
                return false;
            }
            
            return powerUp.life > 0;
        });
        
        // Draw UI overlays - mobile friendly sizes and positions
        const baseY = isMobile ? 220 : 180;
        
        if (multiplier > 1) {
            ctx.fillStyle = 'rgba(255, 107, 53, 0.8)';
            ctx.font = `bold ${isMobile ? 36 : 32}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`${multiplier}X MULTIPLIER!`, window.innerWidth / 2, baseY);
        }
        
        if (slowMotion) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.font = `bold ${isMobile ? 32 : 28}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('SLOW MOTION', window.innerWidth / 2, baseY + (isMobile ? 50 : 40));
        }
        
        if (comboMultiplier > 1) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            ctx.font = `bold ${isMobile ? 28 : 24}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`COMBO ${comboMultiplier.toFixed(1)}X`, window.innerWidth / 2, baseY + (isMobile ? 100 : 80));
        }
    }

    requestAnimationFrame(gameLoop);
}

// Initialize the game when page loads
window.addEventListener('load', () => {
    initGame();
});