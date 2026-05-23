/* ==========================================================================
   BIRTHDAY FANTASY NIGHT SKY - MAIN APP APPLICATION LOGIC
   Orchestrates 2D backdrop particles, state machine transitions, GSAP timelines,
   and interactive recipe game loop handlers.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. GLOBAL STATE DEFINITIONS
    // ----------------------------------------------------------------------
    const STATE = {
        currentScreen: 'welcome-screen',
        password: '1212', // default customizable key
        selectedIngredients: new Set(),
        activeRecipeProgress: 0,
        activeBakingStep: 'A', // A=Stir, B=Knead, C=Shape, D=Decorate
        isMuted: true
    };

    // Ingredient database with details and customized inline SVGs
    const INGREDIENTS = [
        { id: 'flour', name: 'Flour', desc: 'Sponge foundation', svg: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>` },
        { id: 'sugar', name: 'Sugar', desc: 'Cosmic sweetness', svg: `<path d="M12 2L2 22h20L12 2zm0 3.99L19.53 19H4.47L12 5.99zM13 16h-2v2h2v-2zm0-6h-2v4h2V10z"/>` },
        { id: 'eggs', name: 'Eggs', desc: 'Starlight binding', svg: `<path d="M12 2C8.69 2 6 6.03 6 11c0 5.52 2.69 9 6 9s6-3.48 6-9c0-4.97-2.69-9-6-9zm0 16c-2.21 0-4-2.79-4-7 0-3.89 1.79-7 4-7s4 3.11 4 7c0 4.21-1.79 7-4 7z"/>` },
        { id: 'milk', name: 'Milk', desc: 'Milky Way splash', svg: `<path d="M8 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H8zm0 4h8v3H8V6zm0 5h8v2H8v-2zm0 4h8v5H8v-5z"/>` },
        { id: 'butter', name: 'Butter', desc: 'Soft cloud melting', svg: `<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7V7h10v6z"/>` },
        { id: 'vanilla', name: 'Vanilla', desc: 'Ethereal aroma', svg: `<path d="M12 3l8 8-1.41 1.41L12 5.83 5.41 12.41 4 11l8-8zm0 15.17l6.59-6.59L20 13l-8 8-8-8 1.41-1.41L12 18.17z"/>` },
        { id: 'chocolate', name: 'Chocolate', desc: 'Nebula chunk', svg: `<path d="M22 2H2v20h20V2zM7 17H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V7h2v2zm4 8H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>` },
        { id: 'strawberry', name: 'Strawberry', desc: 'Ruby comet core', svg: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 17c-1.74-2.02-5-6.23-5-9 0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.77-3.26 6.98-5 9z"/>` },
        { id: 'cream', name: 'Cream', desc: 'Velvet space foam', svg: `<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>` },
        { id: 'candy', name: 'Candy', desc: 'Sugar crystal blast', svg: `<path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z"/>` },
        { id: 'cherry', name: 'Cherry', desc: 'Solar eclipse berry', svg: `<path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 10H11V7h2v5z"/>` },
        { id: 'blueberry', name: 'Blueberry', desc: 'Star cluster berry', svg: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>` },
        { id: 'matcha', name: 'Matcha', desc: 'Aurora powder', svg: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>` },
        { id: 'honey', name: 'Honey', desc: 'Golden starlight nectar', svg: `<path d="M12 3l8 8-1.41 1.41L12 5.83 5.41 12.41 4 11l8-8zm0 15.17l6.59-6.59L20 13l-8 8-8-8 1.41-1.41L12 18.17z"/>` },
        { id: 'sprinkles', name: 'Sprinkles', desc: 'Tiny supernovas', svg: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z"/>` }
    ];

    // Prepopulate Floating memory cards path links
    const MEMORIES = [
        { caption: "Sweet Moments 💖", icon: "fa-heart", color: "#ff007f" },
        { caption: "Laughter & Joy 😄", icon: "fa-face-laugh-beam", color: "#ffd700" },
        { caption: "Starry Dreams 🌌", icon: "fa-moon", color: "#00f2fe" },
        { caption: "Magic Wishes ✨", icon: "fa-wand-magic-sparkles", color: "#e0b0ff" }
    ];

    // ----------------------------------------------------------------------
    // 2. BACKGROUND 2D STARFIELD & NEBULA CANVAS
    // ----------------------------------------------------------------------
    const starCanvas = document.getElementById('starfield-canvas');
    const sCtx = starCanvas.getContext('2d');
    const nebulaCanvas = document.getElementById('nebula-canvas');
    const nCtx = nebulaCanvas.getContext('2d');
    const sparkleCanvas = document.getElementById('sparkle-canvas');
    const spCtx = sparkleCanvas.getContext('2d');

    let w, h;
    function resizeBackdrops() {
        w = window.innerWidth;
        h = window.innerHeight;
        starCanvas.width = w;
        starCanvas.height = h;
        nebulaCanvas.width = w;
        nebulaCanvas.height = h;
        sparkleCanvas.width = w;
        sparkleCanvas.height = h;
    }
    resizeBackdrops();
    window.addEventListener('resize', resizeBackdrops);

    // Star database
    const stars = [];
    const starCount = 180;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size: 0.5 + Math.random() * 1.5,
            twinkleSpeed: 0.01 + Math.random() * 0.03,
            phase: Math.random() * Math.PI * 2,
            depth: 0.1 + Math.random() * 0.9
        });
    }

    // Shooting star database
    const shootingStars = [];
    function spawnShootingStar() {
        shootingStars.push({
            x: Math.random() * w,
            y: Math.random() * h * 0.5,
            length: 40 + Math.random() * 80,
            speed: 8 + Math.random() * 12,
            angle: Math.PI / 6 + Math.random() * (Math.PI / 12), // slant down
            alpha: 1.0,
            decay: 0.015 + Math.random() * 0.02
        });
    }

    // Interactive sparkle sparks
    const sparkles = [];
    function spawnSparkle(x, y, color = '#ffffff') {
        const count = 12 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.0 + Math.random() * 4.0;
            sparkles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1.5 + Math.random() * 2.0,
                alpha: 1.0,
                decay: 0.01 + Math.random() * 0.02,
                color: color
            });
        }
    }

    // Mouse Parallax coordinates
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    window.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX - w / 2) * 0.03;
        targetMouseY = (e.clientY - h / 2) * 0.03;
    });

    // Nebula cloud coordinates
    let nebulaTime = 0;

    // Render loop
    function drawBackgrounds() {
        requestAnimationFrame(drawBackgrounds);
        
        // Easing parallax
        mouseX += (targetMouseX - mouseX) * 0.08;
        mouseY += (targetMouseY - mouseY) * 0.08;

        // A. Draw Nebula Canvas (breathing gas clouds)
        nebulaTime += 0.001;
        nCtx.fillStyle = STATE.currentScreen === 'welcome-screen' ? '#020215' : '#08031a';
        nCtx.fillRect(0, 0, w, h);

        nCtx.save();
        nCtx.globalCompositeOperation = 'screen';
        
        // Nebula layer 1: Space Deep Purple
        let g1 = nCtx.createRadialGradient(
            w * 0.3 + Math.cos(nebulaTime) * 100 - mouseX * 0.5,
            h * 0.4 + Math.sin(nebulaTime * 0.8) * 100 - mouseY * 0.5,
            10,
            w * 0.3 - mouseX * 0.5,
            h * 0.4 - mouseY * 0.5,
            Math.min(w, h) * 0.7
        );
        g1.addColorStop(0, 'rgba(75, 28, 122, 0.4)');
        g1.addColorStop(0.5, 'rgba(30, 10, 60, 0.15)');
        g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        nCtx.fillStyle = g1;
        nCtx.fillRect(0, 0, w, h);

        // Nebula layer 2: Cyan Galaxy Edge
        let g2 = nCtx.createRadialGradient(
            w * 0.7 - Math.cos(nebulaTime * 0.7) * 80 + mouseX * 0.3,
            h * 0.6 - Math.sin(nebulaTime * 0.5) * 80 + mouseY * 0.3,
            10,
            w * 0.7 + mouseX * 0.3,
            h * 0.6 + mouseY * 0.3,
            Math.min(w, h) * 0.6
        );
        g2.addColorStop(0, 'rgba(0, 242, 254, 0.12)');
        g2.addColorStop(0.6, 'rgba(0, 100, 150, 0.04)');
        g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        nCtx.fillStyle = g2;
        nCtx.fillRect(0, 0, w, h);

        nCtx.restore();

        // B. Draw Twinkling Starfield Canvas
        sCtx.clearRect(0, 0, w, h);
        
        stars.forEach(star => {
            star.phase += star.twinkleSpeed;
            const alpha = 0.3 + Math.abs(Math.sin(star.phase)) * 0.7;
            
            // Apply parallax scroll offset based on star depth
            const px = star.x - mouseX * star.depth;
            const py = star.y - mouseY * star.depth;

            sCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            sCtx.beginPath();
            sCtx.arc(px, py, star.size, 0, Math.PI * 2);
            sCtx.fill();
        });

        // Handle random shooting star spawning
        if (Math.random() < 0.005) {
            spawnShootingStar();
        }

        // Draw and update shooting stars
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const ss = shootingStars[i];
            ss.x += Math.cos(ss.angle) * ss.speed;
            ss.y += Math.sin(ss.angle) * ss.speed;
            ss.alpha -= ss.decay;

            if (ss.alpha <= 0 || ss.x > w || ss.y > h) {
                shootingStars.splice(i, 1);
                continue;
            }

            sCtx.strokeStyle = `rgba(255, 240, 150, ${ss.alpha})`;
            sCtx.lineWidth = 1.5;
            sCtx.beginPath();
            sCtx.moveTo(ss.x, ss.y);
            sCtx.lineTo(ss.x - Math.cos(ss.angle) * ss.length, ss.y - Math.sin(ss.angle) * ss.length);
            sCtx.stroke();
        }

        // C. Draw Floating Sparkle Canvas (Overlays UI elements)
        spCtx.clearRect(0, 0, w, h);
        spCtx.globalCompositeOperation = 'screen';

        for (let i = sparkles.length - 1; i >= 0; i--) {
            const sp = sparkles[i];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.vy += 0.05; // soft gravity fall
            sp.alpha -= sp.decay;

            if (sp.alpha <= 0) {
                sparkles.splice(i, 1);
                continue;
            }

            spCtx.fillStyle = sp.color;
            spCtx.globalAlpha = sp.alpha;
            spCtx.beginPath();
            spCtx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            spCtx.fill();
        }
        spCtx.globalAlpha = 1.0;
    }
    drawBackgrounds();

    // ----------------------------------------------------------------------
    // 3. CINEMATIC STATE TRANSITIONS (GSAP)
    // ----------------------------------------------------------------------
    function showScreen(screenId) {
        if (screenId === STATE.currentScreen) return;

        const prevElement = document.getElementById(STATE.currentScreen);
        const nextElement = document.getElementById(screenId);

        if (!nextElement) return;

        // Global sound effect on transition click
        SoundEngine.playClick();

        STATE.currentScreen = screenId;

        // Clean up previous 3D canvas resources
        if (ThreeCakeManager.cleanup) {
            ThreeCakeManager.cleanup();
        }

        // Trigger GSAP transition sequence
        const tl = gsap.timeline();

        // 1. Zoom and blur camera effect
        tl.to(prevElement, {
            opacity: 0,
            scale: 0.94,
            filter: 'blur(10px)',
            duration: 0.5,
            ease: 'power2.in',
            onComplete: () => {
                prevElement.classList.add('hide');
                prevElement.classList.remove('active-screen');
                
                nextElement.classList.remove('hide');
                nextElement.classList.add('active-screen');
                
                // Initialize next screen mechanics
                initScreenController(screenId);
            }
        });

        // 2. Slide in next screen beautifully
        tl.fromTo(nextElement, {
            opacity: 0,
            scale: 1.06,
            filter: 'blur(10px)'
        }, {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.7,
            ease: 'power2.out'
        });
    }

    function initScreenController(screenId) {
        if (screenId === 'password-screen') {
            document.getElementById('secret-password').focus();
            
        } else if (screenId === 'baking-screen') {
            renderIngredientsDashboard();
            
        } else if (screenId === 'interaction-screen') {
            STATE.activeBakingStep = 'A';
            updateInteractiveBakingFlow();
            
        } else if (screenId === 'cake-completion-screen') {
            ThreeCakeManager.initFinal('final-cake-canvas-container');
        }
    }

    // ----------------------------------------------------------------------
    // 4. UI INTERACTIVE CONTROLLERS
    // ----------------------------------------------------------------------

    // Button sound click effects
    const soundToggle = document.getElementById('sound-toggle');
    soundToggle.addEventListener('click', () => {
        const isMuted = SoundEngine.toggleMute();
        STATE.isMuted = isMuted;

        const icon = soundToggle.querySelector('i');
        if (isMuted) {
            icon.className = 'fa-solid fa-volume-xmark';
            soundToggle.classList.remove('glow');
        } else {
            icon.className = 'fa-solid fa-volume-high';
            soundToggle.classList.add('glow');
        }
    });

    // Welcome Screen: Start button click
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', (e) => {
        // Trigger star particles explosion
        const rect = startBtn.getBoundingClientRect();
        spawnSparkle(rect.left + rect.width / 2, rect.top + rect.height / 2, '#ffd700');

        // Unmute and start celestial music pad
        if (STATE.isMuted) {
            soundToggle.click(); // auto toggle mute off on start!
        }
        SoundEngine.startMusic();

        showScreen('password-screen');
    });

    startBtn.addEventListener('mouseenter', () => SoundEngine.playHover());

    // Password validation click
    const unlockBtn = document.getElementById('unlock-btn');
    const passwordInput = document.getElementById('secret-password');

    function checkPassword() {
        const inputVal = passwordInput.value.trim();
        const container = passwordInput.parentElement.parentElement;

        if (inputVal === STATE.password) {
            // Correct password: Sparkle explosion!
            const rect = unlockBtn.getBoundingClientRect();
            spawnSparkle(rect.left + rect.width / 2, rect.top + rect.height / 2, '#00f2fe');
            SoundEngine.playSuccess();

            // Unlock and zoom smoothly
            showScreen('baking-screen');
        } else {
            // Incorrect password feedback
            SoundEngine.playHover(); // short reject buzz
            passwordInput.classList.add('shake-error');
            
            // particle burst red
            const rect = passwordInput.getBoundingClientRect();
            spawnSparkle(rect.left + rect.width / 2, rect.top + rect.height / 2, '#ff007f');

            setTimeout(() => {
                passwordInput.classList.remove('shake-error');
                passwordInput.value = '';
            }, 600);
        }
    }

    unlockBtn.addEventListener('click', checkPassword);
    unlockBtn.addEventListener('mouseenter', () => SoundEngine.playHover());
    
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkPassword();
    });

    // ----------------------------------------------------------------------
    // 5. PHASE 3 — INGREDIENT DASHBOARD
    // ----------------------------------------------------------------------
    function renderIngredientsDashboard() {
        const container = document.getElementById('ingredients-container');
        const checklist = document.getElementById('checklist-container');
        
        container.innerHTML = '';
        checklist.innerHTML = '';

        STATE.selectedIngredients.clear();
        updateBakingProgressBar();

        INGREDIENTS.forEach((item, index) => {
            // Render selection card
            const card = document.createElement('div');
            card.className = 'ingredient-card';
            card.setAttribute('data-id', item.id);
            card.innerHTML = `
                <div class="ingredient-icon-container">
                    <svg viewBox="0 0 24 24">${item.svg}</svg>
                </div>
                <span class="ingredient-name">${item.name}</span>
            `;
            container.appendChild(card);

            // Render right side recipe list row
            const checkRow = document.createElement('div');
            checkRow.className = 'checklist-item';
            checkRow.setAttribute('id', `check-${item.id}`);
            checkRow.innerHTML = `
                <div class="check-box">
                    <i class="fa-solid fa-check"></i>
                </div>
                <span class="checklist-item-text">${item.name} — <small>${item.desc}</small></span>
            `;
            checklist.appendChild(checkRow);

            // Click listener
            card.addEventListener('mouseenter', () => SoundEngine.playHover());
            card.addEventListener('click', (e) => {
                toggleIngredient(item.id, index, e);
            });
        });
    }

    function toggleIngredient(id, index, event) {
        const card = document.querySelector(`.ingredient-card[data-id="${id}"]`);
        const checkRow = document.getElementById(`check-${id}`);
        if (!card || !checkRow) return;

        // Sparkle click burst
        spawnSparkle(event.clientX, event.clientY, '#00f2fe');

        if (STATE.selectedIngredients.has(id)) {
            // Uncheck
            STATE.selectedIngredients.delete(id);
            card.classList.remove('checked');
            checkRow.classList.remove('checked');
            SoundEngine.playHover();
        } else {
            // Check
            STATE.selectedIngredients.add(id);
            card.classList.add('checked');
            checkRow.classList.add('checked');
            SoundEngine.playSelect(index);

            // Fly element effect to checklist (pure GSAP animation)
            const flier = document.createElement('div');
            flier.className = 'ingredient-icon-container';
            flier.style.position = 'fixed';
            flier.style.zIndex = '999';
            flier.style.left = `${event.clientX - 32}px`;
            flier.style.top = `${event.clientY - 32}px`;
            flier.innerHTML = `<svg viewBox="0 0 24 24" style="fill:#ffe875; width:32px; height:32px;">${INGREDIENTS.find(i=>i.id===id).svg}</svg>`;
            document.body.appendChild(flier);

            const checkRect = checkRow.querySelector('.check-box').getBoundingClientRect();
            
            gsap.to(flier, {
                x: checkRect.left - event.clientX + 16,
                y: checkRect.top - event.clientY + 16,
                scale: 0.2,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out',
                onComplete: () => flier.remove()
            });
        }

        updateBakingProgressBar();
    }

    function updateBakingProgressBar() {
        const total = INGREDIENTS.length;
        const current = STATE.selectedIngredients.size;
        const percentage = Math.round((current / total) * 100);

        const bar = document.getElementById('progress-bar-fill');
        const text = document.getElementById('progress-percentage');
        const bakeBtn = document.getElementById('bake-btn');

        bar.style.width = `${percentage}%`;
        text.innerText = `${percentage}%`;

        if (percentage >= 100) {
            bakeBtn.removeAttribute('disabled');
            bakeBtn.classList.remove('inactive');
            bakeBtn.classList.add('gold-glow');
            
            // Trigger once finished
            if (bakeBtn.disabled === undefined && !bakeBtn.dataset.activated) {
                bakeBtn.dataset.activated = "true";
                SoundEngine.playSuccess();
            }
        } else {
            bakeBtn.setAttribute('disabled', 'true');
            bakeBtn.classList.add('inactive');
            bakeBtn.classList.remove('gold-glow');
            delete bakeBtn.dataset.activated;
        }
    }

    // Move from Baking Game to Interactive Steps
    const bakeBtn = document.getElementById('bake-btn');
    bakeBtn.addEventListener('click', () => {
        showScreen('interaction-screen');
    });

    bakeBtn.addEventListener('mouseenter', () => SoundEngine.playHover());

    // ----------------------------------------------------------------------
    // 6. PHASE 4 — INTERACTIVE BAKING STEPS
    // ----------------------------------------------------------------------
    function updateInteractiveBakingFlow() {
        // Toggle Step containers
        document.querySelectorAll('.step-content').forEach(c => c.classList.add('hide'));
        document.querySelectorAll('.step-indicator').forEach(i => i.classList.remove('active'));

        const currentIndicator = document.querySelector(`.step-indicator[data-step="${STATE.activeBakingStep}"]`);
        if (currentIndicator) currentIndicator.classList.add('active');

        if (STATE.activeBakingStep === 'A') {
            // STEP A: Stirring
            document.getElementById('step-A-content').classList.remove('hide');
            const fill = document.getElementById('stir-progress-fill');
            fill.style.width = '0%';
            
            ThreeCakeManager.initStir('stir-canvas-container', (progress) => {
                fill.style.width = `${progress}%`;
                if (progress >= 100) {
                    currentIndicator.classList.add('completed');
                    currentIndicator.classList.remove('active');
                    SoundEngine.playSuccess();
                    
                    // Trigger step transition after delay
                    setTimeout(() => {
                        STATE.activeBakingStep = 'B';
                        updateInteractiveBakingFlow();
                    }, 1000);
                }
            });

        } else if (STATE.activeBakingStep === 'B') {
            // STEP B: Kneading
            document.getElementById('step-B-content').classList.remove('hide');
            const fill = document.getElementById('knead-progress-fill');
            fill.style.width = '0%';

            // set previous line completed
            document.querySelector('.step-indicator[data-step="A"]').classList.add('completed');

            ThreeCakeManager.initKnead('knead-canvas-container', (progress) => {
                fill.style.width = `${progress}%`;
                if (progress >= 100) {
                    currentIndicator.classList.add('completed');
                    currentIndicator.classList.remove('active');
                    SoundEngine.playSuccess();

                    setTimeout(() => {
                        STATE.activeBakingStep = 'C';
                        updateInteractiveBakingFlow();
                    }, 1000);
                }
            });

        } else if (STATE.activeBakingStep === 'C') {
            // STEP C: Shaping Base
            document.getElementById('step-C-content').classList.remove('hide');
            document.querySelector('.step-indicator[data-step="B"]').classList.add('completed');
            
            ThreeCakeManager.initShape('shape-canvas-container', 'circle');

            // Setup Shape Option selectors
            const shapeOptions = document.querySelectorAll('.shape-option');
            shapeOptions.forEach(opt => {
                opt.addEventListener('click', () => {
                    shapeOptions.forEach(o => o.classList.remove('active-shape'));
                    opt.classList.add('active-shape');
                    const selectedShape = opt.getAttribute('data-shape');
                    
                    // Trigger Three.js shape morphs
                    ThreeCakeManager.changeShape(selectedShape);
                });
            });

            // Confirm Shape Button
            const confirmShapeBtn = document.getElementById('confirm-shape-btn');
            confirmShapeBtn.onclick = () => {
                currentIndicator.classList.add('completed');
                currentIndicator.classList.remove('active');
                SoundEngine.playSuccess();

                setTimeout(() => {
                    STATE.activeBakingStep = 'D';
                    updateInteractiveBakingFlow();
                }, 600);
            };

        } else if (STATE.activeBakingStep === 'D') {
            // STEP D: Decorating topping dropping
            document.getElementById('step-D-content').classList.remove('hide');
            document.querySelector('.step-indicator[data-step="C"]').classList.add('completed');

            ThreeCakeManager.initDecorate('decorate-canvas-container');

            // Decorate options click
            const toppingBtns = document.querySelectorAll('.topping-item-btn');
            toppingBtns.forEach(btn => {
                btn.onclick = () => {
                    const toppingType = btn.getAttribute('data-topping');
                    
                    // Trigger dynamic topping fall
                    ThreeCakeManager.addTopping(toppingType);
                };
            });

            // Finish decoration and reveal final screen
            const finishDecorBtn = document.getElementById('finish-decor-btn');
            finishDecorBtn.onclick = () => {
                currentIndicator.classList.add('completed');
                currentIndicator.classList.remove('active');
                SoundEngine.playSuccess();

                showScreen('cake-completion-screen');
            };
        }
    }

    // ----------------------------------------------------------------------
    // 7. PHASE 5 & 6 — CAKE SLICING & ORBITING WISHES
    // ----------------------------------------------------------------------
    const cutBtn = document.getElementById('cut-cake-btn');
    cutBtn.addEventListener('click', () => {
        ThreeCakeManager.sliceCake(() => {
            // Slicing complete reveal wishes overlay
            revealBirthdayWishes();
        });
    });

    function revealBirthdayWishes() {
        const overlay = document.getElementById('wishes-overlay');
        overlay.classList.remove('hide');

        // Cinematic zoom titles transition
        document.getElementById('final-title').innerText = "Wishes Under The Starry Night Sky";
        document.getElementById('final-desc').innerText = "Hover over memories and float within celestial stardust.";
        cutBtn.classList.add('hide');

        // Reveal Replay button in corner
        document.getElementById('restart-btn').classList.remove('hide');

        // A. Setup Orbiting Wishes Text labels in HTML (wrapping the 3D model)
        const wishes = ["Happy Birthday", "Wish You Happiness", "Stay Awesome", "Best Wishes", "Have a Wonderful Year"];
        wishes.forEach((wish, idx) => {
            const element = document.createElement('div');
            element.className = 'orbit-wish-text';
            element.innerText = wish;
            overlay.appendChild(element);

            // Orbit path formula coordinates
            const radiusX = w * 0.28 + idx * 10;
            const radiusY = h * 0.12;
            const centerOffsetX = w / 2;
            const centerOffsetY = h * 0.4;
            
            let angle = (idx / wishes.length) * Math.PI * 2;

            function updateOrbitPosition() {
                angle += 0.004; // slow continuous drift
                const x = centerOffsetX + Math.cos(angle) * radiusX;
                const y = centerOffsetY + Math.sin(angle) * radiusY;

                element.style.left = `${x - element.offsetWidth / 2}px`;
                element.style.top = `${y - element.offsetHeight / 2}px`;

                // Parallax depth sorting (sizes & layers)
                const depthScale = 0.7 + (Math.sin(angle) + 1.0) * 0.25; // 0.7 to 1.2
                element.style.transform = `scale(${depthScale})`;
                element.style.zIndex = Math.sin(angle) > 0 ? "50" : "5"; // front/back layering
                element.style.opacity = 0.5 + (Math.sin(angle) + 1.0) * 0.25; // front fades brighter

                requestAnimationFrame(updateOrbitPosition);
            }
            element.style.opacity = 1.0;
            updateOrbitPosition();
        });

        // B. Setup Floating Memory Polaroid Cards
        const polaroidContainer = document.getElementById('polaroids-container');
        polaroidContainer.innerHTML = '';

        MEMORIES.forEach((memo, index) => {
            const card = document.createElement('div');
            card.className = 'polaroid-card';
            
            // Random initial placement in the left and right quadrants of outer screen
            const isLeft = index % 2 === 0;
            const rx = isLeft ? (w * 0.1 + Math.random() * w * 0.12) : (w * 0.75 + Math.random() * w * 0.12);
            const ry = h * 0.15 + (index * h * 0.2);
            const rotation = -15 + Math.random() * 30; // random tilt

            card.style.left = `${rx}px`;
            card.style.top = `${ry}px`;
            card.style.transform = `rotate(${rotation}px) scale(0.01)`; // start tiny

            card.innerHTML = `
                <div class="polaroid-photo-placeholder" style="border: 1px solid ${memo.color}">
                    <i class="fa-solid ${memo.icon}" style="color:${memo.color}; filter: drop-shadow(0 0 5px ${memo.color});"></i>
                </div>
                <div class="polaroid-caption">${memo.caption}</div>
            `;
            polaroidContainer.appendChild(card);

            // Rise up GSAP transition
            gsap.to(card, {
                x: 0,
                y: 0,
                scale: 1,
                rotation: rotation,
                duration: 1.0,
                delay: index * 0.25,
                ease: 'back.out(1.7)'
            });

            // Hover interactions
            card.addEventListener('mouseenter', () => SoundEngine.playHover());
            card.addEventListener('click', (e) => {
                SoundEngine.playSelect(index + 3);
                spawnSparkle(e.clientX, e.clientY, memo.color);
            });
        });
    }

    // Global restart replay action
    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', () => {
        // Hide polaroids and elements
        const overlay = document.getElementById('wishes-overlay');
        overlay.classList.add('hide');
        overlay.innerHTML = `<div class="polaroid-carousel" id="polaroids-container"></div>`;

        restartBtn.classList.add('hide');
        cutBtn.classList.remove('hide');
        
        document.getElementById('final-title').innerText = "Your Magical Cake is Ready!";
        document.getElementById('final-desc').innerText = "Rotate, zoom, and admire your custom-made 3D birthday cake.";

        // transition back
        showScreen('welcome-screen');
    });
});
