document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const depthDisplay = document.getElementById('depth-display');
    const healthDisplay = document.getElementById('health-display');
    const finalDepth = document.getElementById('final-depth');
    const finalMoney = document.getElementById('final-money');
    const submarineSprite = document.getElementById('submarine-sprite');
    const moneyDisplay = document.getElementById('money-display');

    const cannonSprite = new Image();
    cannonSprite.src = 'imagens/canhao.png';


    const interiorCanvas = document.getElementById('interior-canvas');
    let interiorCtx = null;

    if (interiorCanvas) {
        interiorCanvas.width = canvas.width;
        interiorCanvas.height = canvas.height;
        interiorCtx = interiorCanvas.getContext('2d');
    }

    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
    if (interiorCtx) {
        interiorCtx.imageSmoothingEnabled = false;
    }

    let currentInteriorIndex = 0;
    /*
    const interiorSprites = [
        'imagens/interior_submarino.png',
        'imagens/interior_submarino2.png',
        'imagens/interior_submarino3.png'
    ];
    */
    let interiorButtons = [];

    let explosionActive = false;
    let explosionStartTime = 0;
    const explosionDuration = 800;

    let particles = [];

    function createBlueParticles(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                size: 2 + Math.random() * 4,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`,
                life: 30 + Math.random() * 30,
                opacity: 1
            });
        }
    }

    function createRedParticles(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                size: 3 + Math.random() * 4,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: `hsl(${Math.random() * 60}, 70%, 60%)`,
                life: 30 + Math.random() * 30,
                opacity: 1
            });
        }
    }

    function createGoldParticles(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                size: 2 + Math.random() * 3,
                speedX: (Math.random() - 0.5) * 3,
                speedY: (Math.random() - 0.5) * 3,
                color: `hsl(${40 + Math.random() * 20}, 100%, 50%)`,
                life: 40 + Math.random() * 20,
                opacity: 1
            });
        }
    }

    function createBossParticles(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                size: 5 + Math.random() * 4,
                speedX: (Math.random() - 0.5) * 3,
                speedY: (Math.random() - 0.5) * 3,
                color: `hsl(${40 + Math.random() * 20}, 100%, 50%)`,
                life: 300 + Math.random() * 100,
                opacity: 1
            });
        }
    }

    function createBubbleParticles(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                size: 4 + Math.random() * 4,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`,
                life: 60 + Math.random() * 30,
                opacity: 1
            });
        }
    }

    function createGreenParticles(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                size: 3 + Math.random() * 4,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: `hsl(${Math.random() * 20 + 110}, 70%, 60%)`,
                life: 30 + Math.random() * 30,
                opacity: 1
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            p.x += p.speedX;
            p.y += p.speedY;
            p.life--;
            p.opacity = p.life / 60;
            
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles() {
        ctx.save();
        
        for (const p of particles) {
            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;
            
            if (screenX + p.size < 0 || screenX > canvas.width || 
                screenY + p.size < 0 || screenY > canvas.height) {
                continue;
            }
            
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    const audioManager = {
        currentMusic: null,
        masterVolume: 0.7,
        audioContext: null,

        menuMusic: new Audio(),
        shallowMusic: new Audio(),
        mediumMusic: new Audio(),
        deepMusic: new Audio(),
        abyssalMusic: new Audio(),
        bossMusic: new Audio(),
        victoryMusic: new Audio(),

        init: function () {
            this.menuMusic.src = 'musicas/menu1.mp3';
            this.shallowMusic.src = 'musicas/parte1.mp3';
            this.mediumMusic.src = 'musicas/parte2.mp3';
            this.deepMusic.src = 'musicas/parte3.mp3';
            this.abyssalMusic.src = 'musicas/parte4.mp3';
            this.bossMusic.src = 'musicas/boss.mp3';
            this.victoryMusic.src = 'musicas/vitoria.mp3';

            [this.menuMusic, this.shallowMusic, this.mediumMusic, this.deepMusic, this.abyssalMusic, this.bossMusic, this.victoryMusic].forEach(audio => {
                audio.loop = true;
                audio.preload = 'auto';
                audio.volume = this.masterVolume;
            });
        },

        playMusic: function (music) {
            if (this.currentMusic === music && !music.paused) return;

            if (this.currentMusic && this.currentMusic !== music) {
                try {
                    this.currentMusic.pause();
                    this.currentMusic.currentTime = 0;
                } catch (e) {
                    console.log('Erro ao pausar música:', e);
                }
            }

            this.currentMusic = music;
            if (this.currentMusic) {
                this.currentMusic.currentTime = 0;
                this.currentMusic.volume = this.masterVolume;

                const playAudio = () => {
                    this.currentMusic.play().catch(error => {
                        if (error.name !== 'AbortError') {
                            setTimeout(() => {
                                this.currentMusic.play().catch(e => {
                                    console.log('Segunda tentativa falhou:', e);
                                });
                            }, 100);
                        }
                    });
                };

                setTimeout(playAudio, 50);
            }
        },

        updateMusicByDepth: function (depth) {
            if (!gameRunning) return;

            let targetMusic;

            if (bossActive) {
                targetMusic = this.bossMusic;
            } else if (depth < 1000) {
                targetMusic = this.menuMusic;
            } else if (depth < 2000) {
                targetMusic = this.shallowMusic;
            } else if (depth < 3000) {
                targetMusic = this.mediumMusic;
            } else if (depth < 4000) {
                targetMusic = this.deepMusic;
            } else {
                targetMusic = this.abyssalMusic;
            }

            if (this.currentMusic !== targetMusic) {
                this.playMusic(targetMusic);
            }
        },

        stopAll: function () {
            if (this.currentMusic) {
                this.currentMusic.pause();
                this.currentMusic.currentTime = 0;
                this.currentMusic = null;
            }
        },

        setVolume: function (volume) {
            this.masterVolume = Math.max(0, Math.min(1, volume));

            [this.menuMusic, this.shallowMusic, this.mediumMusic, this.deepMusic, this.abyssalMusic, this.bossMusic, this.victoryMusic].forEach(audio => {
                if (audio) {
                    audio.volume = this.masterVolume;
                }
            });
        }
    };
    audioManager.init();

    // efeitos sonoros
    const soundEffects = {
        rockHit1: new Audio(),
        rockHit2: new Audio(),
        rockHit3: new Audio(),
        fishHit: new Audio(),
        explosion: new Audio(),
        shoot: new Audio(),          
        fishDeath: new Audio(),     
        boost: new Audio(),         
        heal: new Audio(),          
        coinCollect: new Audio(),     

        baseVolume: 0.6,
        currentVolume: 0.6,

        rockCooldown: 0,
        fishCooldown: 0,
        explosionCooldown: 0,
        shootCooldown: 0,
        fishDeathCooldown: 0,
        boostCooldown: 0,
        healCooldown: 0,
        coinCooldown: 0,

        init: function () {
            this.rockHit1.src = 'musicas/sompedra1.mp3';
            this.rockHit2.src = 'musicas/sompedra2.mp3';
            this.rockHit3.src = 'musicas/sompedra3.mp3';
            this.fishHit.src = 'musicas/sompeixebatendo.mp3';
            this.explosion.src = 'musicas/explosao.mp3';
            this.shoot.src = 'musicas/tirocanhao.mp3';          
            this.fishDeath.src = 'musicas/peixemorrendo.mp3'; 
            this.boost.src = 'musicas/dash.mp3';       
            this.heal.src = 'musicas/recuperarvida.mp3';           
            this.coinCollect.src = 'musicas/coin.mp3';    

            Object.values(this).forEach(sound => {
                if (sound instanceof Audio) {
                    sound.preload = 'auto';
                }
            });

            this.setEffectsVolume(this.currentVolume);
        },

        playRockHit: function () {
            if (this.rockCooldown > 0) return;
            const sounds = [this.rockHit1, this.rockHit2, this.rockHit3];
            const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
            this.playSound(randomSound);
            this.rockCooldown = 30;
        },

        playFishHit: function () {
            if (this.fishCooldown > 0) return;
            this.playSound(this.fishHit);
            this.fishCooldown = 60;
        },

        playExplosion: function () {
            if (this.explosionCooldown > 0) return;
            this.playSound(this.explosion);
            this.explosionCooldown = 180;
        },

        playShoot: function () {
            if (this.shootCooldown > 0) return;
            this.playSound(this.shoot);
            this.shootCooldown = 5; 
        },

        playFishDeath: function () {
            if (this.fishDeathCooldown > 0) return;
            this.playSound(this.fishDeath);
            this.fishDeathCooldown = 10;
        },

        playBoost: function () {
            if (this.boostCooldown > 0) return;
            this.playSound(this.boost);
            this.boostCooldown = 30;
        },

        playHeal: function () {
            if (this.healCooldown > 0) return;
            this.playSound(this.heal);
            this.healCooldown = 60;
        },

        playCoinCollect: function () {
            if (this.coinCooldown > 0) return;
            this.playSound(this.coinCollect);
            this.coinCooldown = 5;
        },

        playSound: function (sound) {
            if (sound) {
                const newSound = sound.cloneNode();
                newSound.volume = this.currentVolume;
                newSound.play().catch(e => {
                    console.log('Erro ao reproduzir efeito sonoro:', e);
                });
            }
        },

        setEffectsVolume: function (volume) {
            this.currentVolume = Math.max(0, Math.min(1, volume)) * this.baseVolume;

            Object.values(this).forEach(sound => {
                if (sound instanceof Audio) {
                    sound.volume = this.currentVolume;
                }
            });
        },

        updateCooldowns: function () {
            if (this.rockCooldown > 0) this.rockCooldown--;
            if (this.fishCooldown > 0) this.fishCooldown--;
            if (this.explosionCooldown > 0) this.explosionCooldown--;
            if (this.shootCooldown > 0) this.shootCooldown--;
            if (this.fishDeathCooldown > 0) this.fishDeathCooldown--;
            if (this.boostCooldown > 0) this.boostCooldown--;
            if (this.healCooldown > 0) this.healCooldown--;
            if (this.coinCooldown > 0) this.coinCooldown--;
        }
    };

    soundEffects.init();

    const volumeSlider = document.getElementById('volume-slider');

    if (volumeSlider) {
        volumeSlider.addEventListener('input', function () {
            const volume = this.value / 100;
            audioManager.setVolume(volume);
            soundEffects.setEffectsVolume(volume);
        });

        const initialVolume = volumeSlider.value / 100;
        audioManager.setVolume(initialVolume);
        soundEffects.setEffectsVolume(initialVolume);
    }

    // Carregar sprites ao iniciar
    const enemySprites = [
        document.createElement('img'),
        document.createElement('img'),
        document.createElement('img')
    ];

    const FISH_TYPES = [
        {
            // peixe vago
            name: 'Peixe Vago',
            minDepth: 0,
            maxDepth: 1000,
            health: 2,
            speed: 1.8,
            damage: 5,
            size: 45,
            sprite: 'imagens/peixe1.png'
        },
        {
            // peixe arqui-lula
            name: 'Arqui-Lula',
            minDepth: 100,
            maxDepth: 1400,
            health: 2,
            speed: 1.8,
            damage: 6,
            size: 45,
            sprite: 'imagens/peixe3.png'
        },
        {
            // peixe devorador
            name: 'Devorador',
            minDepth: 300,
            maxDepth: 2500,
            health: 3,
            speed: 1.8,
            damage: 6,
            size: 55,
            sprite: 'imagens/peixe2.png'
        },
        {
            // peixe chama
            name: 'Peixe Chama',
            minDepth: 500,
            maxDepth: 2000,
            health: 3,
            speed: 1.8,
            damage: 6,
            size: 50,
            sprite: 'imagens/peixe7.png'
        },
        {
            // peixe alga
            name: 'Peixe Alga',
            minDepth: 400,
            maxDepth: 2500,
            health: 4,
            speed: 1.8,
            damage: 7,
            size: 70,
            sprite: 'imagens/peixe8.png'
        },
        {
            // peixe púrpura
            name: 'Púrpura',
            minDepth: 700,
            maxDepth: 1500,
            health: 4,
            speed: 1.8,
            damage: 7,
            size: 60,
            sprite: 'imagens/peixe10.png'
        },
        {
            // peixe serpente
            name: 'Peixe Serpente',
            minDepth: 1000,
            maxDepth: 2700,
            health: 4,
            speed: 1.8,
            damage: 8,
            size: 70,
            sprite: 'imagens/peixe11.png'
        },
        {
            // peixe serra-de-barro
            name: 'Serra-de-Barro',
            minDepth: 1400,
            maxDepth: 2500,
            health: 4,
            speed: 1.8,
            damage: 8,
            size: 60,
            sprite: 'imagens/peixe12.png'
        },
        {
            // peixe zumbi
            name: 'Peixe Zumbi',
            minDepth: 1600,
            maxDepth: 2800,
            health: 4,
            speed: 1.8,
            damage: 8,
            size: 60,
            sprite: 'imagens/peixe4.png'
        },
        {
            // peixe sapo
            name: 'Peixe Sapo',
            minDepth: 1800,
            maxDepth: 3000,
            health: 5,
            speed: 1.8,
            damage: 9,
            size: 60,
            sprite: 'imagens/peixe15.png'
        },
        {
            // peixe grande arqui-lula
            name: 'Grande Arqui-Lula',
            minDepth: 2200,
            maxDepth: 3000,
            health: 5,
            speed: 1.8,
            damage: 9,
            size: 65,
            sprite: 'imagens/peixe5.png'
        },
        {
            // peixe lamu-enguia
            name: 'Lamu-Enguia',
            minDepth: 2600,
            maxDepth: 3200,
            health: 6,
            speed: 1.8,
            damage: 9,
            size: 70,
            sprite: 'imagens/peixe14.png'
        },
        {
            // peixe bruxa
            name: 'Peixe Bruxa',
            minDepth: 2700,
            maxDepth: 3300,
            health: 6,
            speed: 1.8,
            damage: 9,
            size: 65,
            sprite: 'imagens/peixe19.png'
        },
        {
            // peixe peixolhão
            name: 'Peixolhão',
            minDepth: 3000,
            maxDepth: 3500,
            health: 7,
            speed: 1.8,
            damage: 9,
            size: 80,
            sprite: 'imagens/peixe20.png'
        },
        {
            // peixe espinha
            name: 'Peixe Espinha',
            minDepth: 3200,
            maxDepth: 3800,
            health: 7,
            speed: 1.8,
            damage: 9,
            size: 65,
            sprite: 'imagens/peixe13.png'
        },
        {
            // peixe fóssil
            name: 'Peixe Fóssil',
            minDepth: 3500,
            maxDepth: 4000,
            health: 7,
            speed: 1.8,
            damage: 9,
            size: 70,
            sprite: 'imagens/peixe16.png'
        },
        {
            // peixe osso
            name: 'Peixe Osso',
            minDepth: 3700,
            maxDepth: 4100,
            health: 7,
            speed: 1.8,
            damage: 10,
            size: 75,
            sprite: 'imagens/peixe6.png'
        },
        {
            // peixe osséo-abissal
            name: 'Osséo-Abissal',
            minDepth: 4000,
            maxDepth: 4400,
            health: 8,
            speed: 1.85,
            damage: 11,
            size: 80,
            sprite: 'imagens/peixe18.png'
        },
        {
            // peixe abissal
            name: 'Peixe Abissal',
            minDepth: 4200,
            maxDepth: 4700,
            health: 8,
            speed: 1.9,
            damage: 15,
            size: 85,
            sprite: 'imagens/peixe9.png'
        },
        {
            // peixe devorador abissal
            name: 'Devorador Abissal',
            minDepth: 4500,
            maxDepth: 5000,
            health: 8,
            speed: 1.9,
            damage: 20,
            size: 90,
            sprite: 'imagens/peixe17.png'
        },
        {
            // peixe lorde-abissal
            name: 'Lorde-Abissal',
            minDepth: 5000,
            maxDepth: 5000,
            health: 100,
            speed: 2,
            damage: 20,
            size: 200,
            sprite: 'imagens/peixeChefe.png'
        }
    ];

    // chefe final
    let bossActive = false;
    let boss = null;
    const BOSS_TYPE_INDEX = FISH_TYPES.length - 1;

    const bossSprite = new Image();
    bossSprite.src = 'imagens/peixeChefe.png';

    const fishSprites = FISH_TYPES.map(fishType => {
        const img = new Image();
        img.src = fishType.sprite;
        return img;
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let gameRunning = false;
    let depth = 0;
    let maxDepth = 0;
    let health = 100;
    let animationId;
    let inSubmarine = false;
    const WORLD_WIDTH = 10000;
    const WORLD_HEIGHT = 250000; // 5k metros de profundidade

    const camera = {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
    };
    const submarine = {
        x: WORLD_WIDTH / 2,
        y: 0,
        width: 80,
        height: 40,
        speed: 5,
        rotation: 0,
        flip: false
    };

    //criar objeto canhao
    const cannon = {
        x: 0,
        y: 0,
        width: 30,
        height: 20,
        direction: 'right'
    };

    let bullets = [];

    let lastShotTime = 0;
    const SHOT_DELAY = 300; // em ms (0.3s entre disparos)

    let money = 0;
    let moneyTotal = 0;

    let coins = [];
    const COIN_TYPES = [
        { value: 2, minDepth: 0, maxDepth: 1500, color: '#FFD700', name: 'Ferro' },
        { value: 14, minDepth: 500, maxDepth: 2000, color: '#C0C0C0', name: 'Ouro' },
        { value: 34, minDepth: 1500, maxDepth: 3000, color: '#FFA500', name: 'Diamante' },
        { value: 81, minDepth: 2000, maxDepth: 3500, color: '#00FF00', name: 'Esmeralda' },
        { value: 141, minDepth: 3000, maxDepth: 4000, color: '#FF00FF', name: 'Rubi' },
        { value: 225, minDepth: 3500, maxDepth: 4999, color: '#4169E1', name: 'Safira' }
    ];
    coinSprites = [
        document.getElementById('coin1-sprite'),
        document.getElementById('coin2-sprite'),
        document.getElementById('coin3-sprite'),
        document.getElementById('coin5-sprite'),
        document.getElementById('coin6-sprite'),
        document.getElementById('coin4-sprite')
    ];

    let rocks = [];
    let enemyFishes = [];
    const keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        KeyW: false,
        KeyA: false,
        KeyS: false,
        KeyD: false
    };

    let boost = false;
    let lockMovements = false;

    document.addEventListener('keydown', (e) => {
        if (e.code in keys) keys[e.code] = true;

        if (e.code === 'KeyF' && gameRunning) {
            boost = true;
        }
        if (e.code === 'KeyE' && gameRunning && !lockMovements) {
            startCure();
        }
        /*
        if (e.code === 'KeyE' && gameRunning) {
            toggleSubmarineInterior();
        }
        */
        if (e.code === 'ArrowUp' && !lockMovements) {
            cannon.direction = 'up';
            shoot();
        }
        if (e.code === 'ArrowDown' && !lockMovements) {
            cannon.direction = 'down';
            shoot();
        }
        if (e.code === 'ArrowLeft' && !lockMovements) {
            cannon.direction = 'left';
            shoot();
        }
        if (e.code === 'ArrowRight' && !lockMovements) {
            cannon.direction = 'right';
            shoot();
        }

    });

    document.addEventListener('keyup', (e) => {
        if (e.code in keys) keys[e.code] = false;

        if (e.code === 'KeyF') {
            boost = false;
        }
    });

    startButton.addEventListener('click', function () {
        if (!audioManager.currentMusic || audioManager.currentMusic.paused) {
            audioManager.playMusic(audioManager.menuMusic);
        }
        startGame();
    });

    restartButton.addEventListener('click', function () {
        if (!audioManager.currentMusic || audioManager.currentMusic.paused) {
            audioManager.playMusic(audioManager.menuMusic);
        }
        startGame();
    });

    let collisionState = {
        wasInRock: false,
        wasInFish: false,
        currentRockCollisions: 0,
        currentFishCollisions: 0
    };

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms)); // valeu, internet!

    async function startCure() {
        lockMovements = true;
        let moneyCost = 0;
        if (maxDepth < 100) moneyCost = 10;
        else if (maxDepth < 200) moneyCost = 12;
        else if (maxDepth < 300) moneyCost = 15;
        else if (maxDepth < 500) moneyCost = 18;
        else if (maxDepth < 700) moneyCost = 21;
        else if (maxDepth < 1000) moneyCost = 25;
        else if (maxDepth < 1500) moneyCost = 30;
        else if (maxDepth < 2000) moneyCost = 35;
        else if (maxDepth < 2500) moneyCost = 50;
        else if (maxDepth < 3000) moneyCost = 75;
        else if (maxDepth < 3500) moneyCost = 100;
        else if (maxDepth < 4000) moneyCost = 150;
        else if (maxDepth < 4500) moneyCost = 200;
        else if (maxDepth < 4500) moneyCost = 200;
        else if (maxDepth < 5000) moneyCost = 250;
        else moneyCost = 999;

        console.log(`Money: ${money} MoneyCost: ${moneyCost}`);

        if (money >= moneyCost) {
            money -= moneyCost;
            createGreenParticles(submarine.x + submarine.width / 2, submarine.y + submarine.height / 2, 20);
            soundEffects.playHeal();
            await delay(266);
            createGreenParticles(submarine.x + submarine.width / 2, submarine.y + submarine.height / 2, 20);
            await delay(266);
            createGreenParticles(submarine.x + submarine.width / 2, submarine.y + submarine.height / 2, 20);
            await delay(367);
            createGreenParticles(submarine.x + submarine.width / 2, submarine.y + submarine.height / 2, 20);
            await delay(367); // 1,667 segundos antés de continuar o código
            health += 9;
            if (health > 100) health = 100;
        }
        else {
            createRedParticles(submarine.x + submarine.width / 2, submarine.y + submarine.height / 2, 12);
        }
        lockMovements = false;
    }

    function initializeAudio() {
        audioManager.init();

        setTimeout(() => {
            audioManager.playMusic(audioManager.menuMusic);
        }, 500);

        const forceAudio = () => {
            if (audioManager.currentMusic && audioManager.currentMusic.paused) {
                audioManager.currentMusic.play().catch(e => {
                    console.log('Forçando áudio na interação...');
                });
            }
        };

        document.addEventListener('click', forceAudio, { once: true });
        document.addEventListener('mousedown', forceAudio, { once: true });
        document.addEventListener('touchstart', forceAudio, { once: true });
        document.addEventListener('keydown', forceAudio, { once: true });
    }

    window.addEventListener('load', initializeAudio);

    function startGame() {
        if (audioManager.currentMusic && audioManager.currentMusic.paused) {
            audioManager.currentMusic.play().catch(e => {
                console.log('Forçando no start:', e);
            });
        }

        gameRunning = true;
        depth = 0;
        maxDepth = 0;
        health = 100;
        money = 0;
        moneyTotal = 0;
        rocks = [];
        coins = [];
        enemyFishes = [];
        inSubmarine = false;
        bossActive = false;
        boss = null;

        collisionState = {
            wasInRock: false,
            wasInFish: false,
            currentRockCollisions: 0,
            currentFishCollisions: 0
        };

        submarine.x = WORLD_WIDTH / 2;
        submarine.y = 0;
        submarine.rotation = 0;
        submarine.flip = false;

        camera.x = submarine.x - camera.width / 2;
        camera.y = submarine.y - camera.height / 2;

        generateRocks();
        generateEnemyFishes();
        generateCoins();

        startScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
        victoryScreen.style.display = 'none';

        if (canvas) canvas.style.display = 'block';
        if (interiorCanvas) interiorCanvas.style.display = 'none';

        audioManager.playMusic(audioManager.menuMusic);

        updateDisplays();
        gameLoop();
    }

    function generateRocks() {
        rocks = [];

        const fixedRockCount = 10000;
        const movingRockCount = 1500;

        // esquerda
        for (let y = 0; y < WORLD_HEIGHT; y += 80) {
            const width = 100 + Math.random() * 50;
            const height = 85 + Math.random() * 60;

            const rockDetails = generateRockDetails(width, height);

            rocks.push({
                x: -width + 50,
                y: y,
                width: width,
                height: height,
                speedX: 0,
                speedY: 0,
                isMoving: false,
                details: rockDetails,
                isWall: true
            });
        }

        // direita
        for (let y = 0; y < WORLD_HEIGHT; y += 80) {
            const width = 100 + Math.random() * 50;
            const height = 85 + Math.random() * 60;

            const rockDetails = generateRockDetails(width, height);

            rocks.push({
                x: WORLD_WIDTH - 50,
                y: y,
                width: width,
                height: height,
                speedX: 0,
                speedY: 0,
                isMoving: false,
                details: rockDetails,
                isWall: true
            });
        }

        // baixo
        for (let x = 0; x < WORLD_WIDTH; x += 95) {
            const width = 100 + Math.random() * 60;
            const height = 85 + Math.random() * 50;

            const rockDetails = generateRockDetails(width, height);

            rocks.push({
                x: x,
                y: WORLD_HEIGHT - 50,
                width: width,
                height: height,
                speedX: 0,
                speedY: 0,
                isMoving: false,
                details: rockDetails,
                isWall: true
            });
        }

        // cenário
        for (let i = 0; i < fixedRockCount; i++) {
            const x = Math.random() * WORLD_WIDTH;
            const y = 100 + Math.random() * (WORLD_HEIGHT - 100);
            const width = 40 + Math.random() * 100;
            const height = 30 + Math.random() * 90;

            const rockDetails = generateRockDetails(width, height);

            rocks.push({
                x: x,
                y: y,
                width: width,
                height: height,
                speedX: 0,
                speedY: 0,
                isMoving: false,
                details: rockDetails
            });
        }

        // cenário movendo
        for (let i = 0; i < movingRockCount; i++) {
            const x = Math.random() * WORLD_WIDTH;
            const y = 100 + Math.random() * (WORLD_HEIGHT - 100);
            const width = 40 + Math.random() * 80;
            const height = 30 + Math.random() * 70;

            const speedX = (Math.random() * 1.5 + 0.5) * (Math.random() < 0.5 ? 1 : -1);
            const speedY = (Math.random() * 1.5 + 0.5) * (Math.random() < 0.5 ? 1 : -1);

            const rockDetails = generateRockDetails(width, height);

            rocks.push({
                x: x,
                y: y,
                width: width,
                height: height,
                speedX: speedX,
                speedY: speedY,
                isMoving: true,
                details: rockDetails
            });
        }
    }

    function generateEnemyFishes() {
        enemyFishes = [];
        const totalFishes = 2000;
        const maxAttemptsPerFish = 5;

        for (let i = 0; i < totalFishes; i++) {
            const availableTypes = FISH_TYPES.filter(fishType => {
                const depth = Math.random() * WORLD_HEIGHT;
                return depth >= fishType.minDepth * 50 && depth <= fishType.maxDepth * 50;
            });

            if (availableTypes.length === 0) continue;

            const fishType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            const fishIndex = FISH_TYPES.indexOf(fishType);

            const minY = fishType.minDepth * 50;
            const maxY = fishType.maxDepth * 50;

            let fishPlaced = false;
            let attemptsForThisFish = 0;

            while (!fishPlaced && attemptsForThisFish < maxAttemptsPerFish) {
                const y = minY + Math.random() * (maxY - minY);
                const x = Math.random() * WORLD_WIDTH;

                enemyFishes.push({
                    x: x,
                    y: y,
                    width: fishType.size,
                    height: fishType.size,
                    health: fishType.health,
                    maxHealth: fishType.health,
                    speed: fishType.speed,
                    damage: fishType.damage,
                    spriteIndex: fishIndex,
                    flip: false,
                    attackCooldown: 0
                });

                fishPlaced = true;
                attemptsForThisFish++;
            }
        }

        console.log(`Gerados ${enemyFishes.length} peixes`);
    }

    function spawnBoss() {
        if (bossActive) return;

        const bossType = FISH_TYPES[BOSS_TYPE_INDEX];

        boss = {
            x: WORLD_WIDTH / 2 - bossType.size / 2,
            y: WORLD_HEIGHT + 100,
            width: bossType.size,
            height: bossType.size,
            health: bossType.health,
            maxHealth: bossType.health,
            speed: bossType.speed,
            damage: bossType.damage,
            spriteIndex: BOSS_TYPE_INDEX,
            flip: false,
            attackCooldown: 0,
            phase: 1,
            lastPhaseChange: 0,
            invulnerable: false,
            invulnerabilityTimer: 0,
            specialAttacks: [],
            lastSpecialAttack: 0
        };

        bossActive = true;

        console.log("Boss ativado!");

        audioManager.playMusic(audioManager.bossMusic);

        for (let i = 0; i < 80; i++) {
            createRedParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 1);
            createBlueParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 1);
        }
    }

    function updateBoss() {
        if (!bossActive || !boss) return;

        const bossType = FISH_TYPES[boss.spriteIndex];

        // MOVIMENTO BÁSICO - Perseguição (Ataque 1)
        const dx = (submarine.x + submarine.width / 2) - (boss.x + boss.width / 2);
        const dy = (submarine.y + submarine.height / 2) - (boss.y + boss.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            boss.x += (dx / distance) * boss.speed;
            boss.y += (dy / distance) * boss.speed;
        }

        boss.flip = submarine.x < boss.x;

        if (boss.y < -boss.height) boss.y = -boss.height;
        if (boss.x < 0) boss.x = 0;
        if (boss.x > WORLD_WIDTH - boss.width) boss.x = WORLD_WIDTH - boss.width;

        if (boss.invulnerable) {
            boss.invulnerabilityTimer--;
            if (boss.invulnerabilityTimer <= 0) {
                boss.invulnerable = false;
            }
        }

        if (boss.attackCooldown > 0) {
            boss.attackCooldown--;
        }

        // SISTEMA DE FASES
        if (boss.health <= 70 && boss.phase === 1) {
            boss.phase = 2;
            boss.speed = 2.5;
            boss.invulnerable = true;
            boss.invulnerabilityTimer = 120;
        }

        if (boss.health <= 30 && boss.phase === 2) {
            boss.phase = 3;
            boss.speed = 3;
            boss.invulnerable = true;
            boss.invulnerabilityTimer = 120;
        }

        // SISTEMA DE ATAQUES ESPECIAIS
        boss.lastSpecialAttack++;

        // Ataque 1.5: Dispado de Bolhas (Fase 1+)
        if (boss.phase >= 1 && boss.lastSpecialAttack > 150 && Math.random() < 0.015) {
            performBubbleShotAttack();
            boss.lastSpecialAttack = 0;
        }

        // Ataque 2: Rajada de Bolhas (Fase 2+)
        if (boss.phase >= 2 && boss.lastSpecialAttack > 180 && Math.random() < 0.02) {
            performBubbleBurstAttack();
            boss.lastSpecialAttack = 0;
        }

        // Ataque 3: Investida Rápida (Fase 2+)
        if (boss.phase >= 2 && boss.lastSpecialAttack > 120 && Math.random() < 0.01 && distance < 400) {
            performChargeAttack();
            boss.lastSpecialAttack = 0;
        }

        /* Ataque 4: Chamado de Aliados (Fase 3)
        if (boss.phase === 3 && boss.lastSpecialAttack > 300 && Math.random() < 0.01) {
            performMinionCallAttack();
            boss.lastSpecialAttack = 0;
        }
        */

        if (boss.attackCooldown === 0 && distance < 200) {
            performBossBasicAttack();
            boss.attackCooldown = 60;
        }

        updateSpecialAttacks();
    }

    function performBossAttack() {
        health -= boss.damage;

        createRedParticles(
            submarine.x + submarine.width / 2,
            submarine.y + submarine.height / 2,
            15
        );

        soundEffects.playFishHit();
    }

    function performBossBasicAttack() {
        if (!boss || !bossActive) return;

        const dx = (submarine.x + submarine.width / 2) - (boss.x + boss.width / 2);
        const dy = (submarine.y + submarine.height / 2) - (boss.y + boss.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
            health -= boss.damage;

            createRedParticles(
                submarine.x + submarine.width / 2,
                submarine.y + submarine.height / 2,
                12
            );

            soundEffects.playFishHit();

            const pushForce = 50;
            const pushAngle = Math.atan2(dy, dx);

            const oppositeAngle = pushAngle + Math.PI;

            submarine.x += Math.cos(oppositeAngle) * pushForce;
            submarine.y += Math.sin(oppositeAngle) * pushForce;

            submarine.x = Math.max(0, Math.min(WORLD_WIDTH - submarine.width, submarine.x));
            submarine.y = Math.max(0, Math.min(WORLD_HEIGHT - submarine.height, submarine.y));
        }
    }

    function performBubbleShotAttack() {
        const bubbleCount = boss.phase === 1 ? 1 : boss.phase === 2 ? 3 : 5;

        const bossCenterX = boss.x + boss.width / 2;
        const bossCenterY = boss.y + boss.height / 2;
        const subCenterX = submarine.x + submarine.width / 2;
        const subCenterY = submarine.y + submarine.height / 2;

        const centerAngle = Math.atan2(subCenterY - bossCenterY, subCenterX - bossCenterX);

        const spreadAngle = boss.phase === 1 ? 0 : boss.phase === 2 ? Math.PI / 12 : Math.PI / 8;

        for (let i = 0; i < bubbleCount; i++) {
            const speed = 4;

            let angle;
            if (bubbleCount === 1) {
                angle = centerAngle;
            } else {
                // 3 bolhas: [-spread/2, 0, +spread/2]
                // 5 bolhas: [-spread, -spread/2, 0, +spread/2, +spread]
                const offset = (i - (bubbleCount - 1) / 2) * (spreadAngle / (bubbleCount - 1));
                angle = centerAngle + offset;
            }

            boss.specialAttacks.push({
                type: 'bubble',
                x: bossCenterX,
                y: bossCenterY,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                radius: 15,
                damage: 8,
                lifetime: 240,
                color: boss.phase === 3 ? '#ff4444' : '#44aaff'
            });
        }

        for (let i = 0; i < 20; i++) {
            createBlueParticles(bossCenterX, bossCenterY, 2);
        }
    }

    function performBubbleBurstAttack() {

        const bubbleCount = boss.phase === 2 ? 8 : 12;
        const angleStep = (Math.PI * 2) / bubbleCount;

        for (let i = 0; i < bubbleCount; i++) {
            const angle = i * angleStep;
            const speed = 4;

            boss.specialAttacks.push({
                type: 'bubble',
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height / 2,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                radius: 15,
                damage: 10,
                lifetime: 150, // 2.5 segundos (150 frames)
                color: boss.phase === 3 ? '#ff4444' : '#44aaff'
            });
        }

        for (let i = 0; i < 20; i++) {
            createBubbleParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 2);
        }
    }

    function performChargeAttack() {
        const dx = (submarine.x + submarine.width / 2) - (boss.x + boss.width / 2);
        const dy = (submarine.y + submarine.height / 2) - (boss.y + boss.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const chargeSpeed = 6;
            let chargeDistance;
            if (distance > 600) {
                chargeDistance = 350;
            } else if (distance > 300) {
                chargeDistance = 250;
            } else {
                chargeDistance = 100;
            }

            boss.specialAttacks.push({
                type: 'charge',
                startX: boss.x,
                startY: boss.y,
                dx: (dx / distance) * chargeSpeed,
                dy: (dy / distance) * chargeSpeed,
                distance: chargeDistance,
                damage: 20,
                traveled: 0,
                damageApplied: false
            });
        }

        for (let i = 0; i < 30; i++) {
            createRedParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 1);
        }
    }

    function performMinionCallAttack() {

        const minionCount = 3 + boss.phase;
        const availableMinions = FISH_TYPES.filter((fish, index) =>
            index !== BOSS_TYPE_INDEX && fish.minDepth <= 5000
        );

        for (let i = 0; i < minionCount; i++) {
            if (availableMinions.length > 0) {
                const minionType = availableMinions[Math.floor(Math.random() * availableMinions.length)];
                const minionIndex = FISH_TYPES.indexOf(minionType);

                const angle = (i / minionCount) * Math.PI * 2;
                const spawnDistance = 150;

                enemyFishes.push({
                    x: boss.x + boss.width / 2 + Math.cos(angle) * spawnDistance - minionType.size / 2,
                    y: boss.y + boss.height / 2 + Math.sin(angle) * spawnDistance - minionType.size / 2,
                    width: minionType.size,
                    height: minionType.size,
                    health: minionType.health,
                    maxHealth: minionType.health,
                    speed: minionType.speed * 1.2,
                    damage: minionType.damage,
                    spriteIndex: minionIndex,
                    flip: false,
                    attackCooldown: 0,
                    isMinion: true
                });
            }
        }

        for (let i = 0; i < 40; i++) {
            createGreenParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 1);
        }
    }

    function updateSpecialAttacks() {
        if (!boss || !bossActive) return;

        for (let i = boss.specialAttacks.length - 1; i >= 0; i--) {
            const attack = boss.specialAttacks[i];

            if (attack.type === 'bubble') {
                attack.x += attack.dx;
                attack.y += attack.dy;
                attack.lifetime--;

                const dx = attack.x - (submarine.x + submarine.width / 2);
                const dy = attack.y - (submarine.y + submarine.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < attack.radius + submarine.width / 2) {
                    health -= attack.damage;
                    createRedParticles(attack.x, attack.y, 8);
                    boss.specialAttacks.splice(i, 1);
                    continue;
                }

                if (attack.lifetime <= 0 ||
                    attack.x < 0 || attack.x > WORLD_WIDTH ||
                    attack.y < 0 || attack.y > WORLD_HEIGHT) {
                    boss.specialAttacks.splice(i, 1);
                }
            }
            else if (attack.type === 'charge') {
                boss.x += attack.dx;
                boss.y += attack.dy;
                attack.traveled += Math.sqrt(attack.dx * attack.dx + attack.dy * attack.dy);

                if (!attack.damageApplied && checkBossSubmarineCollision()) {
                    health -= attack.damage;
                    attack.damageApplied = true;
                    createRedParticles(
                        submarine.x + submarine.width / 2,
                        submarine.y + submarine.height / 2,
                        15
                    );

                    const pushForce = 50;
                    const pushAngle = Math.atan2(attack.dy, attack.dx);

                    const oppositeAngle = pushAngle + Math.PI;

                    submarine.x += Math.cos(oppositeAngle) * pushForce;
                    submarine.y += Math.sin(oppositeAngle) * pushForce;

                    submarine.x = Math.max(0, Math.min(WORLD_WIDTH - submarine.width, submarine.x));
                    submarine.y = Math.max(0, Math.min(WORLD_HEIGHT - submarine.height, submarine.y));
                }

                if (attack.traveled >= attack.distance) {
                    boss.specialAttacks.splice(i, 1);
                }
            }
        }
    }

    function checkBossSubmarineCollision() {
        if (!boss) return false;

        return (
            boss.x < submarine.x + submarine.width &&
            boss.x + boss.width > submarine.x &&
            boss.y < submarine.y + submarine.height &&
            boss.y + boss.height > submarine.y
        );
    }

    function generateRockDetails(width, height) {
        const details = [];
        const detailCount = 3 + Math.floor(Math.random() * 4);

        for (let i = 0; i < detailCount; i++) {
            details.push({
                x: 5 + Math.random() * (width - 10),
                y: 5 + Math.random() * (height - 10),
                size: 5 + Math.random() * 8,
                colorVariation: Math.random() * 0.3 - 0.15
            });
        }

        return details;
    }

    function gameLoop() {
        if (!gameRunning) return;

        soundEffects.updateCooldowns();

        if (!inSubmarine) {
            camera.width = canvas.width;
            camera.height = canvas.height;

            clearCanvas();
            updateSubmarine();
            updateRocks();
            updateEnemyFishes();
            updateBoss();
            updateCamera();
            checkCollisions();
            checkCoinCollisions();
            updateParticles();
            drawParticles();
            drawRocks();
            drawEnemyFishes();
            drawBoss();
            drawSubmarine();
            drawControlHint();
            updateBullets();
            drawBullets();
            checkBulletCollisions();
            drawCoins();
            moreFunctions();

            if (!victoryScreen.style.display || victoryScreen.style.display === 'none') {
                audioManager.updateMusicByDepth(depth);
            }
        } else {
            canvas.style.display = 'none';
            interiorCanvas.style.display = 'block';
            drawSubmarineInterior();
        }

        animationId = requestAnimationFrame(gameLoop);
    }

    function moreFunctions() {
        if (health <= 0) {
            gameOver();
        }

        if (boost) {
            submarine.speed = 10;
            health -= 0.0083;
            createBlueParticles(submarine.x + submarine.width / 2, submarine.y + submarine.height / 2, 4);
            createRedParticles(submarine.x + submarine.width / 2, submarine.y + submarine.height / 2, 2);
            soundEffects.playBoost();
        }
        else {
            submarine.speed = 5;
        }

        if (depth > maxDepth) {
            maxDepth = depth;
        }

        if (depth >= 4995 && !bossActive) {
            spawnBoss();
        }
    }

    function drawControlHint() {
        /*
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 150, canvas.height - 50, 300, 40);

        ctx.fillStyle = '#00bfff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pressione E para entrar no submarino', canvas.width / 2, canvas.height - 25);
        */
    }

    function clearCanvas() {
        const time = Date.now() * 0.0005;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

        const hue1 = (Math.sin(time) * 30 + 200) % 360;
        const hue2 = (Math.sin(time * 0.7) * 30 + 220) % 360;
        const hue3 = (Math.sin(time * 1.3) * 30 + 180) % 360;

        gradient.addColorStop(0, `hsl(${hue1}, 70%, 20%)`);
        gradient.addColorStop(0.5, `hsl(${hue2}, 80%, 15%)`);
        gradient.addColorStop(1, `hsl(${hue3}, 60%, 10%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const depthFactor = Math.min(1, camera.y / WORLD_HEIGHT);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * depthFactor})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (camera.y < 50) {
            ctx.strokeStyle = 'rgba(0, 191, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -camera.y);
            ctx.lineTo(canvas.width, -camera.y);
            ctx.stroke();
        }
    }

    function updateSubmarine() {
        let moveX = 0;
        let moveY = 0;
        if (keys.KeyW && !lockMovements) moveY -= 1;
        if (keys.KeyS && !lockMovements) moveY += 1;
        if (keys.KeyA && !lockMovements) moveX -= 1;
        if (keys.KeyD && !lockMovements) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071; // 1/√2 ≈ 0.7071
            moveY *= 0.7071;
        }

        submarine.x += moveX * submarine.speed;
        submarine.y += moveY * submarine.speed;

        cannon.x = submarine.x + submarine.width;
        cannon.y = submarine.y + submarine.height / 2 - cannon.height / 2;

        if (moveY < 0) {
            submarine.rotation = -0.2;
        } else if (moveY > 0) {
            submarine.rotation = 0.2;
        } else {
            submarine.rotation = 0;
        }

        submarine.flip = moveX < 0;

        depth = Math.round(submarine.y / 50);

        audioManager.updateMusicByDepth(depth);
    }

    function updateRocks() {
        for (const rock of rocks) {
            if (rock.isMoving) {
                rock.x += rock.speedX;
                rock.y += rock.speedY;

                if (rock.x <= 0 || rock.x + rock.width >= WORLD_WIDTH) {
                    rock.speedX *= -1;
                }
                if (rock.y <= 100 || rock.y + rock.height >= WORLD_HEIGHT) {
                    rock.speedY *= -1;
                }
            }
        }
    }

    function updateEnemyFishes() {
        for (const fish of enemyFishes) {
            const fishInCamera =
                fish.x + fish.width > camera.x &&
                fish.x < camera.x + camera.width &&
                fish.y + fish.height > camera.y &&
                fish.y < camera.y + camera.height;

            if (fishInCamera) {
                const dx = submarine.x + submarine.width / 2 - (fish.x + fish.width / 2);
                const dy = submarine.y + submarine.height / 2 - (fish.y + fish.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                const detectionRadius = 800;

                if (distance < detectionRadius && distance > 0) {
                    fish.x += (dx / distance) * fish.speed;
                    fish.y += (dy / distance) * fish.speed;
                }
            } else {
                fish.x += (Math.random() - 0.5) * fish.speed * 0.3;
                fish.y += (Math.random() - 0.5) * fish.speed * 0.3;

                fish.x = Math.max(0, Math.min(WORLD_WIDTH - fish.width, fish.x));
                fish.y = Math.max(100, Math.min(WORLD_HEIGHT - fish.height, fish.y));
            }

            fish.flip = submarine.x < fish.x;

            if (fish.attackCooldown > 0) {
                fish.attackCooldown--;
            }
        }
    }

    function updateCamera() {
        const targetX = submarine.x - camera.width / 2;
        const targetY = submarine.y - camera.height / 2;

        camera.x += (targetX - camera.x) * 0.08;
        camera.y += (targetY - camera.y) * 0.08;

        camera.x = Math.max(0, Math.min(WORLD_WIDTH - camera.width, camera.x));
        camera.y = Math.max(0, Math.min(WORLD_HEIGHT - camera.height, camera.y));
    }

    function drawSubmarine() {

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        const screenX = submarine.x - camera.x;
        const screenY = submarine.y - camera.y;

        ctx.save();
        ctx.translate(screenX + submarine.width / 2, screenY + submarine.height / 2);

        if (submarine.flip) {
            ctx.scale(-1, 1);
        }

        ctx.rotate(submarine.rotation);

        if (submarineSprite.complete && submarineSprite.naturalHeight !== 0) {
            const originalWidth = submarineSprite.naturalWidth;
            const originalHeight = submarineSprite.naturalHeight;
            const aspectRatio = originalWidth / originalHeight;

            let newWidth = submarine.width;
            let newHeight = submarine.height;

            if (aspectRatio > 1) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }

            ctx.drawImage(
                submarineSprite,
                -newWidth / 2,
                -newHeight / 2,
                newWidth,
                newHeight
            );
        } else {
            ctx.fillStyle = '#3a7ebc';
            ctx.fillRect(-submarine.width / 2, -submarine.height / 2, submarine.width, submarine.height);
        }

        


        ctx.restore();
    }

    function drawEnemyFishes() {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        for (const fish of enemyFishes) {
            const screenX = fish.x - camera.x;
            const screenY = fish.y - camera.y;

            if (screenX + fish.width < 0 || screenX > canvas.width ||
                screenY + fish.height < 0 || screenY > canvas.height) {
                continue;
            }

            ctx.save();
            ctx.translate(screenX + fish.width / 2, screenY + fish.height / 2);

            if (fish.flip) {
                ctx.scale(-1, 1);
            }

            const sprite = fishSprites[fish.spriteIndex];
            if (sprite && sprite.complete && sprite.naturalHeight !== 0) {
                const originalWidth = sprite.naturalWidth;
                const originalHeight = sprite.naturalHeight;
                const aspectRatio = originalWidth / originalHeight;

                let newWidth = fish.width;
                let newHeight = fish.height;

                if (aspectRatio > 1) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newWidth = newHeight * aspectRatio;
                }

                ctx.drawImage(
                    sprite,
                    -newWidth / 2,
                    -newHeight / 2,
                    newWidth,
                    newHeight
                );
            }

            ctx.restore();

            // Desenhar barra de vida
            if (fish.health < fish.maxHealth) {
                const barWidth = fish.width;
                const barHeight = 4;
                const barX = screenX;
                const barY = screenY - 8;

                // Fundo da barra
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                // Vida atual
                const healthPercent = fish.health / fish.maxHealth;
                ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' :
                    healthPercent > 0.25 ? '#ffff00' : '#ff0000';
                ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

                // Borda
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);

                const fishType = FISH_TYPES[fish.spriteIndex];
                const fishName = fishType ? fishType.name : 'Peixe Desconhecido';

                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(screenX - 5, screenY - 25, fish.width + 10, 16);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    fishName,
                    screenX + fish.width / 2,
                    screenY - 17
                );
            }
        }

        ctx.restore();
    }

    function drawBoss() {
        if (!bossActive || !boss) return;

        if (typeof boss.x === 'undefined' || typeof boss.y === 'undefined') {
            console.error('Boss object is malformed');
            return;
        }

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        const screenX = boss.x - camera.x;
        const screenY = boss.y - camera.y;

        ctx.save();
        ctx.translate(screenX + boss.width / 2, screenY + boss.height / 2);

        if (boss.flip) {
            ctx.scale(-1, 1);
        }

        const sprite = fishSprites[boss.spriteIndex];
        if (sprite && sprite.complete && sprite.naturalHeight !== 0) {
            const originalWidth = sprite.naturalWidth;
            const originalHeight = sprite.naturalHeight;
            const aspectRatio = originalWidth / originalHeight;

            let newWidth = boss.width;
            let newHeight = boss.height;

            if (aspectRatio > 1) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }

            ctx.drawImage(
                sprite,
                -newWidth / 2,
                -newHeight / 2,
                newWidth,
                newHeight
            );
        }

        ctx.restore();

        drawSpecialAttacks();

        const barWidth = 300;
        const barHeight = 25;
        const barX = canvas.width / 2 - barWidth / 2;
        const barY = 30;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = boss.health / boss.maxHealth;
        let healthColor;
        if (healthPercent > 0.6) healthColor = '#00ff00';
        else if (healthPercent > 0.3) healthColor = '#ffff00';
        else healthColor = '#ff0000';

        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `PEIXE LORDE-ABISSAL: ${Math.floor(boss.health)}/${boss.maxHealth} - Fase ${boss.phase}`,
            canvas.width / 2,
            barY - 10
        );

        if (boss.invulnerable) {
            ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() * 0.02));
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(screenX, screenY, boss.width, boss.height);
        }

        ctx.restore();
    }

    function drawSpecialAttacks() {
        if (!boss) return;

        for (const attack of boss.specialAttacks) {
            if (attack.type === 'bubble') {
                const screenX = attack.x - camera.x;
                const screenY = attack.y - camera.y;

                ctx.fillStyle = attack.color;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(screenX, screenY, attack.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenX, screenY, attack.radius - 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    function drawRocks() {

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        for (const rock of rocks) {
            const screenX = rock.x - camera.x;
            const screenY = rock.y - camera.y;

            if (screenX + rock.width < 0 || screenX > canvas.width ||
                screenY + rock.height < 0 || screenY > canvas.height) {
                continue;
            }

            const baseColor = '#6B4C3A';
            ctx.fillStyle = baseColor;
            ctx.fillRect(screenX, screenY, rock.width, rock.height);

            for (const detail of rock.details) {
                const color = adjustColor(baseColor, detail.colorVariation);
                ctx.fillStyle = color;

                ctx.beginPath();
                ctx.arc(
                    screenX + detail.x,
                    screenY + detail.y,
                    detail.size,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(screenX, screenY + rock.height - 8, rock.width, 8);
            ctx.fillRect(screenX + rock.width - 8, screenY, 8, rock.height);
        }
    }

    function adjustColor(baseColor, variation) {
        let r = parseInt(baseColor.substr(1, 2), 16);
        let g = parseInt(baseColor.substr(3, 2), 16);
        let b = parseInt(baseColor.substr(5, 2), 16);

        r = Math.max(0, Math.min(255, r + Math.round(variation * 100)));
        g = Math.max(0, Math.min(255, g + Math.round(variation * 80)));
        b = Math.max(0, Math.min(255, b + Math.round(variation * 60)));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    function checkCollisions() {
        let inRock = false;
        let inFish = false;

        for (const rock of rocks) {
            if (
                submarine.x < rock.x + rock.width &&
                submarine.x + submarine.width > rock.x &&
                submarine.y < rock.y + rock.height &&
                submarine.y + submarine.height > rock.y
            ) {
                inRock = true;
                health -= 0.5;

                createBlueParticles(
                    submarine.x + submarine.width / 2,
                    submarine.y + submarine.height / 2,
                    2
                );

                if (!collisionState.wasInRock) {
                    soundEffects.playRockHit();
                }

                if (health <= 0) {
                    gameOver();
                    return;
                }

                const dx = (submarine.x + submarine.width / 2) - (rock.x + rock.width / 2);
                const dy = (submarine.y + submarine.height / 2) - (rock.y + rock.height / 2);

                const overlapX = Math.min(
                    submarine.x + submarine.width - rock.x,
                    rock.x + rock.width - submarine.x
                );
                const overlapY = Math.min(
                    submarine.y + submarine.height - rock.y,
                    rock.y + rock.height - submarine.y
                );

                if (overlapX < overlapY) {
                    if (submarine.x < rock.x) {
                        submarine.x = rock.x - submarine.width;
                    } else {
                        submarine.x = rock.x + rock.width;
                    }
                } else {
                    if (submarine.y < rock.y) {
                        submarine.y = rock.y - submarine.height;
                    } else {
                        submarine.y = rock.y + rock.height;
                    }
                }

                break;
            }
        }

        for (const fish of enemyFishes) {
            if (
                submarine.x < fish.x + fish.width &&
                submarine.x + submarine.width > fish.x &&
                submarine.y < fish.y + fish.height &&
                submarine.y + submarine.height > fish.y
            ) {
                if (fish.attackCooldown === 0) {
                    inFish = true;
                    health -= fish.damage;
                    fish.attackCooldown = 60;

                    createBlueParticles(
                        submarine.x + submarine.width / 2,
                        submarine.y + submarine.height / 2,
                        10
                    );

                    if (!collisionState.wasInFish) {
                        soundEffects.playFishHit();
                    }

                    if (health <= 0) {
                        gameOver();
                        return;
                    }
                }
                break;
            }
        }

        if (bossActive &&
            submarine.x < boss.x + boss.width &&
            submarine.x + submarine.width > boss.x &&
            submarine.y < boss.y + boss.height &&
            submarine.y + submarine.height > boss.y) {

            if (boss.attackCooldown === 0) {
                health -= boss.damage * 0.5;
                boss.attackCooldown = 30;

                createRedParticles(
                    submarine.x + submarine.width / 2,
                    submarine.y + submarine.height / 2,
                    10
                );

                soundEffects.playFishHit();

                if (health <= 0) {
                    gameOver();
                    return;
                }
            }
        }

        collisionState.wasInRock = inRock;
        collisionState.wasInFish = inFish;

        updateDisplays();
    }

    function updateDisplays() {
        depthDisplay.textContent = `Profundidade: ${depth}m`;
        healthDisplay.textContent = `Vida: ${Math.floor(health)}%`;
        moneyDisplay.textContent = `Dinheiro: R$${money}`;
    }

    function gameOver() {
        gameRunning = false;

        soundEffects.playExplosion();

        showExplosion();

        setTimeout(() => {
            cancelAnimationFrame(animationId);
            audioManager.stopAll();
            finalDepth.textContent = `Profundidade máxima: ${maxDepth}m`;
            finalMoney.textContent = `Dinheiro: R$${money} | Dinheiro máximo: R$${moneyTotal}`;
            gameOverScreen.style.display = 'flex';
            explosionActive = false;

            bossActive = false;
            boss = null;
        }, explosionDuration);
    }

    function showExplosion() {
        explosionActive = true;
        explosionStartTime = Date.now();

        const explosionGif = document.getElementById('explosion-gif');
        if (explosionGif) {
            const submarineCenterX = submarine.x - camera.x + submarine.width / 2;
            const submarineCenterY = submarine.y - camera.y + submarine.height / 2;

            const explosionWidth = explosionGif.width;
            const explosionHeight = explosionGif.height;

            explosionGif.style.left = (submarineCenterX - explosionWidth / 2) + 'px';
            explosionGif.style.top = (submarineCenterY - explosionHeight / 2) + 'px';
            explosionGif.style.width = explosionWidth + 'px';
            explosionGif.style.height = explosionHeight + 'px';
            explosionGif.style.display = 'block';

            console.log('Explosão posicionada em:', {
                submarineX: submarine.x,
                submarineY: submarine.y,
                cameraX: camera.x,
                cameraY: camera.y,
                screenX: submarineCenterX,
                screenY: submarineCenterY,
                explosionLeft: explosionGif.style.left,
                explosionTop: explosionGif.style.top
            });

            setTimeout(() => {
                explosionGif.style.display = 'none';
            }, explosionDuration);
        }
    }

    function drawSubmarineInterior() {
        if (!interiorCtx || !interiorCanvas) return;

        interiorCtx.save();
        interiorCtx.imageSmoothingEnabled = false;
        interiorCtx.clearRect(0, 0, interiorCanvas.width, interiorCanvas.height);

        const interiorSprite = document.getElementById('submarine-interior');

        function calcCenteredPosition(img, canvas) {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;
            return { x, y, width, height };
        }

        if (interiorSprite && interiorSprite.complete) {
            const { x, y, width, height } = calcCenteredPosition(interiorSprite, interiorCanvas);
            interiorCtx.drawImage(interiorSprite, x, y, width, height);

            interiorButtons = [];
            drawInteriorChangeButton();
        }

        interiorCtx.restore();
    }

    function preloadAllInteriorSprites() {
        interiorSprites.forEach((src, index) => {
            const img = new Image();
            img.src = src;
            img.onload = () => console.log(`Interior ${index + 1} carregado: ${src}`);
            img.onerror = () => console.error(`Erro ao carregar interior ${index + 1}: ${src}`);
        });
    }

    function toggleSubmarineInterior() {
        if (!interiorCanvas) return;

        inSubmarine = !inSubmarine;

        if (inSubmarine) {
            const interiorSprite = document.getElementById('submarine-interior');

            interiorCanvas.width = interiorSprite.naturalWidth;
            interiorCanvas.height = interiorSprite.naturalHeight;

            interiorCanvas.addEventListener('click', handleInteriorClick);

            canvas.style.display = 'none';
            interiorCanvas.style.display = 'block';

            drawSubmarineInterior();
        } else {
            interiorCanvas.removeEventListener('click', handleInteriorClick);
            interiorButtons = [];

            canvas.style.display = 'block';
            interiorCanvas.style.display = 'none';
        }
    }

    function drawInteriorChangeButton() {
        const buttonWidth = 62; // tamanho dos botões
        const buttonHeight = 20;
        const buttonY = interiorCanvas.height - 30; // altura

        const leftButtonX = 55;
        const centerButtonX = (interiorCanvas.width - buttonWidth) / 2; // posicionamento
        const rightButtonX = interiorCanvas.width - buttonWidth - 55;

        drawSingleButton(leftButtonX, buttonY, buttonWidth, buttonHeight, 'Esquerda', 0);

        drawSingleButton(centerButtonX, buttonY, buttonWidth, buttonHeight, 'Centro', 1);

        drawSingleButton(rightButtonX, buttonY, buttonWidth, buttonHeight, 'Direita', 2);

        highlightCurrentButton();
    }

    function drawSingleButton(x, y, width, height, text, spriteIndex) {
        interiorCtx.fillStyle = 'rgba(0, 100, 200, 0.8)';
        interiorCtx.fillRect(x, y, width, height);

        interiorCtx.strokeStyle = '#00bfff';
        interiorCtx.lineWidth = 2;
        interiorCtx.strokeRect(x, y, width, height);

        interiorCtx.fillStyle = '#ffffff';
        interiorCtx.font = '14px Arial';
        interiorCtx.textAlign = 'center';
        interiorCtx.textBaseline = 'middle';
        interiorCtx.fillText(
            text,
            x + width / 2,
            y + height / 2
        );

        interiorButtons.push({
            x: x,
            y: y,
            width: width,
            height: height,
            action: () => changeToSpecificInterior(spriteIndex),
            spriteIndex: spriteIndex
        });
    }

    function changeToSpecificInterior(spriteIndex) {
        if (spriteIndex >= 0 && spriteIndex < interiorSprites.length) {
            currentInteriorIndex = spriteIndex;
            const interiorSprite = document.getElementById('submarine-interior');
            interiorSprite.src = interiorSprites[currentInteriorIndex];

            console.log(`Interior alterado para: ${interiorSprites[currentInteriorIndex]}`);

            // Redesenhar os botões para atualizar o destaque
            interiorButtons = [];
            drawSubmarineInterior();
        }
    }

    function highlightCurrentButton() {
        const currentButton = interiorButtons.find(button => button.spriteIndex === currentInteriorIndex);

        if (currentButton) {
            interiorCtx.strokeStyle = '#ffff00';
            interiorCtx.lineWidth = 3;
            interiorCtx.strokeRect(
                currentButton.x - 2,
                currentButton.y - 2,
                currentButton.width + 4,
                currentButton.height + 4
            );

            interiorCtx.fillStyle = 'rgba(255, 255, 0, 0.2)';
            interiorCtx.fillRect(currentButton.x, currentButton.y, currentButton.width, currentButton.height);
        }
    }

    function handleInteriorClick(event) {
        if (!inSubmarine || !interiorButtons.length) return;

        const rect = interiorCanvas.getBoundingClientRect();
        const scaleX = interiorCanvas.width / rect.width;
        const scaleY = interiorCanvas.height / rect.height;

        const clickX = (event.clientX - rect.left) * scaleX;
        const clickY = (event.clientY - rect.top) * scaleY;

        for (const button of interiorButtons) {
            if (clickX >= button.x &&
                clickX <= button.x + button.width &&
                clickY >= button.y &&
                clickY <= button.y + button.height) {
                button.action();
                break;
            }
        }
    }

    function preloadInteriorSprites() {
        interiorSprites.forEach((src, index) => {
            const img = new Image();
            img.src = src;
            img.onload = () => console.log(`Interior ${index} carregado: ${src}`);
            img.onerror = () => console.error(`Erro ao carregar interior ${index}: ${src}`);
        });
    }

    function generateCoins() {
        coins = [];
        const totalCoins = 5500; // Total de moedas no jogo
        let attempts = 0;
        const maxAttemptsPerCoin = 10;

        for (let i = 0; i < totalCoins; i++) {
            const availableTypes = COIN_TYPES.filter(coinType => {
                const depth = Math.random() * WORLD_HEIGHT;
                return depth >= coinType.minDepth * 50 && depth <= coinType.maxDepth * 50;
            });

            if (availableTypes.length === 0) continue;

            const coinType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            const coinIndex = COIN_TYPES.indexOf(coinType);

            const minY = coinType.minDepth * 50;
            const maxY = coinType.maxDepth * 50;

            let coinPlaced = false;
            let attemptsForThisCoin = 0;

            while (!coinPlaced && attemptsForThisCoin < maxAttemptsPerCoin) {
                const y = minY + Math.random() * (maxY - minY);
                const x = Math.random() * WORLD_WIDTH;

                if (!isCoinCollidingWithRocks(x, y, 25, 25)) {
                    coins.push({
                        x: x,
                        y: y,
                        width: 25,
                        height: 25,
                        type: coinType,
                        spriteIndex: coinIndex,
                        collected: false,
                        rotation: Math.random() * Math.PI * 2,
                        spinSpeed: (Math.random() - 0.5) * 0.1,
                        glow: Math.random(),
                        glowDirection: 1
                    });
                    coinPlaced = true;
                }

                attemptsForThisCoin++;
                attempts++;
            }
        }

        console.log(`Geradas ${coins.length} moedas (${attempts} tentativas totais)`);
    }

    function drawCoins() {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        for (const coin of coins) {
            if (coin.collected) continue;

            const screenX = coin.x - camera.x;
            const screenY = coin.y - camera.y;

            if (screenX + coin.width < 0 || screenX > canvas.width ||
                screenY + coin.height < 0 || screenY > canvas.height) {
                continue;
            }

            ctx.save();
            ctx.translate(screenX + coin.width / 2, screenY + coin.height / 2);

            const sprite = coinSprites[coin.spriteIndex];
            if (sprite && sprite.complete && sprite.naturalHeight !== 0) {
                ctx.drawImage(
                    sprite,
                    -coin.width / 2,
                    -coin.height / 2,
                    coin.width,
                    coin.height
                );
            }

            ctx.restore();

            coin.rotation += coin.spinSpeed;
        }

        ctx.restore();
    }

    function checkCoinCollisions() {
        for (const coin of coins) {
            if (coin.collected) continue;

            if (
                submarine.x < coin.x + coin.width &&
                submarine.x + submarine.width > coin.x &&
                submarine.y < coin.y + coin.height &&
                submarine.y + submarine.height > coin.y
            ) {
                coin.collected = true;
                money += coin.type.value;
                moneyTotal += coin.type.value;

                createGoldParticles(coin.x + coin.width / 2, coin.y + coin.height / 2, 5);
                updateDisplays();
                soundEffects.playCoinCollect();
                //console.log(`Moeda ${coin.type.name} coletada! +$${coin.type.value}`);
            }
        }
    }

    function isCoinCollidingWithRocks(coinX, coinY, coinWidth, coinHeight) {
        for (const rock of rocks) {
            if (
                coinX < rock.x + rock.width &&
                coinX + coinWidth > rock.x &&
                coinY < rock.y + rock.height &&
                coinY + coinHeight > rock.y
            ) {
                return true;
            }
        }
        return false;
    }

    // === SISTEMA DE DESENVOLVEDOR - TECLAS NUMÉRICAS === 
    const devTools = {
        enabled: true,
        init: function () {
            if (!this.enabled) return;

            document.addEventListener('keydown', (e) => {
                if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                    switch (e.key) {
                        case '1':
                            this.teleportToDepth(0);
                            break;
                        case '2':
                            this.teleportToDepth(500);
                            break;
                        case '3':
                            this.teleportToDepth(1500);
                            break;
                        case '4':
                            this.teleportToDepth(2000);
                            break;
                        case '5':
                            this.teleportToDepth(3000);
                            break;
                        case '6':
                            this.teleportToDepth(3500);
                            break;
                        case '7':
                            this.teleportToDepth(4000);
                            break;
                        case '8':
                            this.teleportToDepth(4500);
                            break;
                        case '9':
                            this.teleportToDepth(4998);
                            break;
                        case '0':
                            if (health <= 100)
                                health = 99999999999999999999999999999999999999;
                            else
                                health = 100;
                            break;
                        case 'o':
                            health -= health;
                            break;
                            /*
                        case 'ç':
                            money += 2;
                            break;
                        case 'p': // segurar p/ acelerar
                            if (submarine.speed != 100) submarine.speed = 100;
                            else submarine.speed = 5;
                            break;
                        case 'i':
                            this.killBoss();
                            break;
                            */
                    }
                }
            });

            console.log('🔧 Modo Desenvolvedor Ativado - Teclas: 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, o, b');
        },

        teleportToDepth: function (targetDepth) {
            if (!gameRunning) {
                console.log.error('Jogo não está rodando');
                return;
            }

            const targetY = targetDepth * 50;
            submarine.y = Math.max(0, Math.min(WORLD_HEIGHT - submarine.height, targetY));
            depth = Math.round(submarine.y / 50);

            camera.y = submarine.y - camera.height / 2;
            camera.y = Math.max(0, Math.min(WORLD_HEIGHT - camera.height, camera.y));

            audioManager.updateMusicByDepth(depth);
            updateDisplays();

            this.showMessage(`Teleportado para ${depth}m`);
        },

        killBoss: function () {
            if (!gameRunning) {
                console.error('Jogo não está rodando');
                return;
            }

            if (!bossActive || !boss) {
                this.showMessage('Nenhum boss ativo para matar');
                return;
            }

            console.log('Matando boss via devTools...');

            if (audioManager.currentMusic) {
                audioManager.currentMusic.pause();
            }

            defeatBoss();

            this.showMessage('BOSS ELIMINADO!');
        },

        showMessage: function (message) {
            let msgElement = document.getElementById('dev-message');
            if (!msgElement) {
                msgElement = document.createElement('div');
                msgElement.id = 'dev-message';
                msgElement.style.cssText = `
                position: fixed;
                top: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: #00ff00;
                padding: 12px 25px;
                border: 2px solid #00ff00;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                z-index: 10000;
                pointer-events: none;
                text-align: center;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
                white-space: nowrap;
            `;
                document.body.appendChild(msgElement);
            }

            msgElement.textContent = message;
            msgElement.style.display = 'block';

            setTimeout(() => {
                msgElement.style.display = 'none';
            }, 2000);
        }
    };

    devTools.init();

    function shoot() {
        const now = Date.now();
        if (now - lastShotTime < SHOT_DELAY) return; // aplica delay
        lastShotTime = now;

        const speed = 8;
        let dx = 0, dy = 0;

        if (cannon.direction === 'up') dy = -speed;
        if (cannon.direction === 'down') dy = speed;
        if (cannon.direction === 'left') dx = -speed;
        if (cannon.direction === 'right') dx = speed;

        bullets.push({
            x: submarine.x + submarine.width / 2,
            y: submarine.y + submarine.height / 2,
            dx: dx,
            dy: dy,
            radius: 7,
            lifetime: 60 // frames (~1s)
        });
        soundEffects.playShoot();
    }


    function updateBullets() {
        bullets.forEach((b, i) => {
            b.x += b.dx;
            b.y += b.dy;

            // remover bala fora da tela
            if (b.x < 0 || b.x > WORLD_WIDTH || b.y < 0 || b.y > WORLD_HEIGHT) {
                bullets.splice(i, 1);
            }
        });
    }

    function checkBulletCollisions() {
        bullets.forEach((b, bi) => {
            enemyFishes.forEach((fish, fi) => {
                if (
                    b.x > fish.x &&
                    b.x < fish.x + fish.width &&
                    b.y > fish.y &&
                    b.y < fish.y + fish.height
                ) {
                    fish.health -= 1;

                    bullets.splice(bi, 1);

                    createRedParticles(b.x, b.y, 5);

                    if (fish.health <= 0) {
                        money++;
                        moneyTotal++;

                        createRedParticles(fish.x + fish.width / 2, fish.y + fish.height / 2, 30);

                        enemyFishes.splice(fi, 1);
                        updateDisplays();
                        soundEffects.playFishDeath();
                    }
                }
            });

            if (bossActive && boss && !boss.invulnerable &&
                b.x > boss.x &&
                b.x < boss.x + boss.width &&
                b.y > boss.y &&
                b.y < boss.y + boss.height) {

                boss.health -= 2;
                bullets.splice(bi, 1);

                createRedParticles(b.x, b.y, 8);

                if (boss.health <= 0) {
                    defeatBoss();
                }
            }

            if (bossActive && boss && boss.specialAttacks) {
                for (let i = boss.specialAttacks.length - 1; i >= 0; i--) {
                    const attack = boss.specialAttacks[i];
                    if (attack && attack.type === 'bubble') {
                        const dx = b.x - attack.x;
                        const dy = b.y - attack.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < attack.radius + b.radius) {
                            createBlueParticles(attack.x, attack.y, 5);
                            boss.specialAttacks.splice(i, 1);
                            bullets.splice(bi, 1);
                            break;
                        }
                    }
                }
            }
        });
    }

    function drawBullets() {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.8)'; // cinza
        bullets.forEach(b => {
            const screenX = b.x - camera.x;
            const screenY = b.y - camera.y;
            ctx.beginPath();
            ctx.arc(screenX, screenY, b.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function defeatBoss() {
        if (!bossActive || !boss) return;

        bossActive = false;

        const reward = 5000;
        money += reward;
        moneyTotal += reward;

        for (let i = 0; i < 200; i++) {
            createBossParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 1);
            // if (i % 3 === 0) createRedParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 10);
        }

        enemyFishes = enemyFishes.filter(fish => !fish.isMinion);
        updateDisplays();

        audioManager.playMusic(audioManager.victoryMusic);

        setTimeout(() => {
            showVictoryScreen();
        }, 3500); // 3.5 segundos

        boss = null;
    }

    const victoryScreen = document.getElementById('victory-screen');
    const victoryRestartButton = document.getElementById('victory-restart-button');
    const victoryDepth = document.getElementById('victory-depth');
    const victoryMoney = document.getElementById('victory-money');

    victoryRestartButton.addEventListener('click', function () {
        startGame();
    });

    function showVictoryScreen() {
        if (health <= 0) return;
        gameRunning = false;
        cancelAnimationFrame(animationId);

        victoryDepth.textContent = `Dinheiro: R$${money}`;
        victoryMoney.textContent = `Dinheiro máximo: R$${moneyTotal}`;

        victoryScreen.style.display = 'flex';

        if (audioManager.currentMusic !== audioManager.victoryMusic) {
            audioManager.playMusic(audioManager.victoryMusic);
        }
    }


});





