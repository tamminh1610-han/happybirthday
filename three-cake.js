/* ==========================================================================
   BIRTHDAY FANTASY NIGHT SKY - THREE.JS 3D GRAPHICS ENGINE
   Procedural 3D bowl, dough, morphing cake, dynamic toppings, cutting & slices.
   ========================================================================== */

const ThreeCakeManager = (() => {
    // Shared materials
    const creamColor = 0xfffcf0;
    const chocolateColor = 0x4a2a18;
    const strawberryColor = 0xff3b5c;
    const goldColor = 0xffd700;
    
    // Global State
    let activeShape = 'circle';
    let addedToppingsList = []; // Keeps track of dropped topping models for cloning/drawing

    // Active scenes
    const scenes = {
        stir: null,
        knead: null,
        shape: null,
        decorate: null,
        final: null
    };

    // Helper: Create standard glossy material
    function createCakeMaterial(color, roughness = 0.5, metalness = 0.1) {
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: roughness,
            metalness: metalness,
            flatShading: false
        });
    }

    // Extrusion settings for Heart/Star/Circle shapes
    const extrudeSettings = {
        steps: 2,
        depth: 2.2,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.15,
        bevelSegments: 4
    };

    // Generate 2D Heart Path
    function createHeartPath() {
        const shape = new THREE.Shape();
        // Scale down to center appropriately around (0,0)
        shape.moveTo(0, -1.5);
        shape.bezierCurveTo(-2.5, 1.5, -5, 3.5, -5, 6);
        shape.bezierCurveTo(-5, 9.5, -2, 12, 1.5, 12);
        shape.bezierCurveTo(4, 12, 5.5, 10, 5.5, 10);
        shape.bezierCurveTo(5.5, 10, 7, 12, 9.5, 12);
        shape.bezierCurveTo(13, 12, 16, 9.5, 16, 6);
        shape.bezierCurveTo(16, 3.5, 13.5, 1.5, 11, -1.5);
        shape.lineTo(5.5, -6.5);
        shape.closePath();

        // Translate shape to center pivot
        const matrix = new THREE.Matrix4().makeTranslation(-5.5, -3, 0);
        shape.applyMatrix4(matrix);
        return shape;
    }

    // Generate 2D Star Path
    function createStarPath() {
        const shape = new THREE.Shape();
        const points = 5;
        const rOuter = 7.5;
        const rInner = 3.8;
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const r = (i % 2 === 0) ? rOuter : rInner;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            
            if (i === 0) {
                shape.moveTo(px, py);
            } else {
                shape.lineTo(px, py);
            }
        }
        shape.closePath();
        return shape;
    }

    // Build standard procedural topping models in 3D
    function createToppingMesh(type) {
        const group = new THREE.Group();
        
        if (type === 'cream') {
            // fluffy double-creamy cloud topping
            const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
            const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), mat);
            const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), mat);
            const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), mat);
            s2.position.set(0.22, 0.1, 0);
            s3.position.set(-0.22, 0.1, 0);
            group.add(s1, s2, s3);
            
        } else if (type === 'candle') {
            // Candle stick with glowing neon fire
            const stickMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, roughness: 0.4 });
            const wickMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
            const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa500 });
            
            const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), stickMat);
            const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8), wickMat);
            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), flameMat);
            
            stick.position.y = 0.45;
            wick.position.y = 0.9 + 0.075;
            flame.position.y = 0.9 + 0.15 + 0.05;
            flame.scale.set(0.8, 1.5, 0.8);
            
            group.add(stick, wick, flame);
            
        } else if (type === 'strawberry') {
            // Delicious cone strawberry
            const bodyMat = createCakeMaterial(strawberryColor, 0.3);
            const leafMat = createCakeMaterial(0x228b22, 0.6);
            
            const strawberry = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.6, 16), bodyMat);
            strawberry.rotation.x = Math.PI;
            strawberry.position.y = 0.3;
            
            // tiny leaves
            const leafGeo = new THREE.BoxGeometry(0.2, 0.03, 0.2);
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.y = 0.6;
            
            group.add(strawberry, leaf);
            
        } else if (type === 'chocolate') {
            // Star chocolate flake
            const chocoMat = createCakeMaterial(chocolateColor, 0.8);
            const flake = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.35), chocoMat);
            flake.rotation.set(Math.random(), Math.random(), Math.random());
            flake.position.y = 0.1;
            group.add(flake);
            
        } else if (type === 'sprinkles') {
            // Colorful sprinkles capsule pill
            const colors = [0xff007f, 0x00f2fe, 0xffd700, 0xadff2f, 0xffa500];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const pillMat = createCakeMaterial(randomColor, 0.2);
            
            const spr = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8), pillMat);
            spr.rotation.z = Math.PI / 2;
            spr.position.y = 0.05;
            group.add(spr);
        }
        
        return group;
    }

    // Build the Main 3D Custom Cake Layer
    function createCakeMesh(shapeName, tierCount = 1) {
        const cakeGroup = new THREE.Group();
        let geom;

        // 1. Core base shape geometry
        if (shapeName === 'circle') {
            geom = new THREE.CylinderGeometry(4.8, 5, 2.5, 32);
        } else if (shapeName === 'heart') {
            geom = new THREE.ExtrudeGeometry(createHeartPath(), { ...extrudeSettings, depth: 2.2 });
            geom.center();
            geom.rotateX(Math.PI / 2); // orient horizontal
        } else if (shapeName === 'star') {
            geom = new THREE.ExtrudeGeometry(createStarPath(), { ...extrudeSettings, depth: 2.2 });
            geom.center();
            geom.rotateX(Math.PI / 2);
        }

        // 2. Base Cake Material (Sleek Space Indigo)
        const baseCakeMat = createCakeMaterial(0x1a0b36, 0.4);
        const baseCake = new THREE.Mesh(geom, baseCakeMat);
        baseCake.position.y = 0;
        baseCake.castShadow = true;
        baseCake.receiveShadow = true;
        cakeGroup.add(baseCake);

        // 3. Cream swirl piping lines
        const creamMat = new THREE.MeshStandardMaterial({ color: creamColor, roughness: 0.2 });
        const ringCount = 16;
        for (let i = 0; i < ringCount; i++) {
            const creamNode = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), creamMat);
            const angle = (i / ringCount) * Math.PI * 2;
            
            if (shapeName === 'circle') {
                creamNode.position.set(Math.cos(angle) * 4.6, 1.25, Math.sin(angle) * 4.6);
            } else if (shapeName === 'heart') {
                // simple scaling approximation for hearts
                const sx = Math.cos(angle) * 4.4;
                const sz = Math.sin(angle) * 4.4 + (sz > 0 ? -0.5 : 0.5);
                creamNode.position.set(sx, 1.1, sz);
            } else {
                creamNode.position.set(Math.cos(angle) * 4.5, 1.1, Math.sin(angle) * 4.5);
            }
            cakeGroup.add(creamNode);
        }

        // 4. Colorful side frosting ribbons
        const frostingMat = createCakeMaterial(0xff007f, 0.3); // pink glow frosting
        let frostingRibbon;
        if (shapeName === 'circle') {
            frostingRibbon = new THREE.Mesh(new THREE.TorusGeometry(4.9, 0.15, 8, 48), frostingMat);
            frostingRibbon.rotation.x = Math.PI / 2;
            frostingRibbon.position.y = 0;
            cakeGroup.add(frostingRibbon);
        }

        // 5. Add inner layered sponge (for slice reveals)
        const innerSpongeMat = createCakeMaterial(0xdcae62, 0.9); // vanilla golden cake
        const innerCreamMat = createCakeMaterial(creamColor, 0.2); // thick cream layers
        
        cakeGroup.userData = {
            baseShape: shapeName,
            spongeMat: innerSpongeMat,
            creamMat: innerCreamMat
        };

        return cakeGroup;
    }

    // Initialize camera, lights and renderers for dynamic canvas
    function setupBaseScene(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x020215, 0.015);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 8, 14);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Clear container and append canvas
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Core Ambient celestial glow
        const ambientLight = new THREE.AmbientLight(0x2c1b4d, 1.8);
        scene.add(ambientLight);

        // Magical gold spotlight
        const spotLight = new THREE.SpotLight(0xffe875, 5, 30, Math.PI / 4, 0.5, 1);
        spotLight.position.set(0, 15, 4);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        scene.add(spotLight);

        // Neon side highlight
        const cyanLight = new THREE.PointLight(0x00f2fe, 3, 15);
        cyanLight.position.set(-6, 3, -4);
        scene.add(cyanLight);

        const pinkLight = new THREE.PointLight(0xff007f, 3, 15);
        pinkLight.position.set(6, 3, 4);
        scene.add(pinkLight);

        return { scene, camera, renderer, container };
    }

    // ==========================================================================
    // 1. STEP A — STIRRING BOWL INTERACTION
    // ==========================================================================
    function initStir(containerId, progressCallback) {
        const base = setupBaseScene(containerId);
        if (!base) return;

        const { scene, camera, renderer, container } = base;
        scenes.stir = base;
        
        camera.position.set(0, 10, 10);
        camera.lookAt(0, 0, 0);

        // 1. Translucent 3D Mixing Bowl
        const bowlMat = new THREE.MeshPhysicalMaterial({
            color: 0x00f2fe,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.9,
            thickness: 0.5,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide
        });
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 3.2, 3, 32, 1, true), bowlMat);
        bowl.position.y = -1;
        scene.add(bowl);

        // 2. Batter Liquid inside bowl
        const batterMat = createCakeMaterial(0xfffbef, 0.3); // cream batter
        const batter = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.0, 0.8, 32), batterMat);
        batter.position.y = -1.2;
        scene.add(batter);

        // 3. Swirling particle elements (stars & sprinkles)
        const particleCount = 120;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const cOption = [new THREE.Color(0xff007f), new THREE.Color(0x00f2fe), new THREE.Color(0xffd700), new THREE.Color(0xffffff)];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.0 + Math.random() * 3.0;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = -1.0 + Math.random() * 0.4;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            const randCol = cOption[Math.floor(Math.random() * cOption.length)];
            colors[i * 3] = randCol.r;
            colors[i * 3 + 1] = randCol.g;
            colors[i * 3 + 2] = randCol.b;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.22,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const swirlParticles = new THREE.Points(particleGeo, particleMat);
        scene.add(swirlParticles);

        // Interactive Tracking Variables
        let isStirring = false;
        let progress = 0;
        let prevAngle = null;

        function getMouseAngle(event) {
            const rect = container.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            
            let clientX, clientY;
            if (event.touches) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }

            return Math.atan2(clientY - cy, clientX - cx);
        }

        function handleDragStart(e) {
            isStirring = true;
            prevAngle = getMouseAngle(e);
        }

        function handleDragMove(e) {
            if (!isStirring || progress >= 100) return;

            const currentAngle = getMouseAngle(e);
            if (prevAngle !== null) {
                let diff = currentAngle - prevAngle;
                // handle trig angle wrap arounds
                if (diff < -Math.PI) diff += Math.PI * 2;
                if (diff > Math.PI) diff -= Math.PI * 2;

                if (Math.abs(diff) > 0.01) {
                    // Update progress based on rotational amount
                    progress += Math.abs(diff) * 1.6;
                    progress = Math.min(100, progress);
                    progressCallback(progress);

                    // Twirl sound effect based on velocity
                    SoundEngine.playStir(Math.min(1.0, Math.abs(diff) * 5));

                    // Animate swirl particles faster
                    const pos = swirlParticles.geometry.attributes.position.array;
                    for (let i = 0; i < particleCount; i++) {
                        const px = pos[i * 3];
                        const pz = pos[i * 3 + 2];
                        const currentDist = Math.sqrt(px * px + pz * pz);
                        const currentAng = Math.atan2(pz, px);
                        
                        // Rotational delta relative to mouse movement direction
                        const newAng = currentAng + diff * (1.5 / currentDist);
                        pos[i * 3] = Math.cos(newAng) * currentDist;
                        pos[i * 3 + 2] = Math.sin(newAng) * currentDist;
                    }
                    swirlParticles.geometry.attributes.position.needsUpdate = true;
                }
            }
            prevAngle = currentAngle;
        }

        function handleDragEnd() {
            isStirring = false;
            prevAngle = null;
        }

        container.addEventListener('mousedown', handleDragStart);
        container.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);

        container.addEventListener('touchstart', handleDragStart, { passive: true });
        container.addEventListener('touchmove', handleDragMove, { passive: true });
        window.addEventListener('touchend', handleDragEnd);

        // Core Render loop
        let animId;
        function animate() {
            animId = requestAnimationFrame(animate);

            // subtle ambient ripple motion
            if (!isStirring) {
                const pos = swirlParticles.geometry.attributes.position.array;
                for (let i = 0; i < particleCount; i++) {
                    const px = pos[i * 3];
                    const pz = pos[i * 3 + 2];
                    const d = Math.sqrt(px * px + pz * pz);
                    const a = Math.atan2(pz, px) + 0.005 * (2.0 / d);
                    pos[i * 3] = Math.cos(a) * d;
                    pos[i * 3 + 2] = Math.sin(a) * d;
                }
                swirlParticles.geometry.attributes.position.needsUpdate = true;
            }

            batter.rotation.y += 0.003;
            renderer.render(scene, camera);
        }
        animate();

        // Save reference to clean up
        scenes.stir.cleanup = () => {
            cancelAnimationFrame(animId);
            container.removeEventListener('mousedown', handleDragStart);
            container.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            container.removeEventListener('touchstart', handleDragStart);
            container.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }

    // ==========================================================================
    // 2. STEP B — DOUGH KNEADING INTERACTION
    // ==========================================================================
    function initKnead(containerId, progressCallback) {
        const base = setupBaseScene(containerId);
        if (!base) return;

        const { scene, camera, renderer, container } = base;
        scenes.knead = base;

        camera.position.set(0, 5, 8);
        camera.lookAt(0, 0, 0);

        // Dough Mesh: soft subdivision sphere
        const doughGeo = new THREE.IcosahedronGeometry(2.5, 3);
        const doughMat = createCakeMaterial(0xffdbe9, 0.4); // soft bubblegum pink
        const dough = new THREE.Mesh(doughGeo, doughMat);
        scene.add(dough);

        // Backup coordinates for deformation resets
        const originalPositions = doughGeo.attributes.position.clone();

        let isDragging = false;
        let startX = 0, startY = 0;
        let progress = 0;

        function handleStart(e) {
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX;
            startY = clientY;
        }

        function handleMove(e) {
            if (!isDragging || progress >= 100) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = (clientX - startX) * 0.015;
            const dy = -(clientY - startY) * 0.015; // flip screen y coordinates
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0.05) {
                // Apply elastic squash/stretch deformation to mesh vertices
                const posAttr = doughGeo.attributes.position;
                const pos = posAttr.array;
                const orig = originalPositions.array;

                for (let i = 0; i < pos.length; i += 3) {
                    const ox = orig[i];
                    const oy = orig[i + 1];
                    const oz = orig[i + 2];
                    
                    // project vertices along drag direction
                    const dot = ox * dx + oy * dy;
                    if (dot > 0) {
                        pos[i] = ox + dx * 0.3 * (dot / 2.5);
                        pos[i + 1] = oy + dy * 0.3 * (dot / 2.5);
                    } else {
                        // squash orthogonal axis slightly to conserve volume
                        pos[i] = ox - dx * 0.1;
                        pos[i + 1] = oy - dy * 0.1;
                    }
                }
                posAttr.needsUpdate = true;
                
                // update stretch progress
                progress += distance * 1.5;
                progress = Math.min(100, progress);
                progressCallback(progress);

                if (Math.floor(progress) % 15 === 0) {
                    SoundEngine.playKnead();
                }
            }
        }

        function handleEnd() {
            isDragging = false;
            // Snapping elastic stretch back animation
            gsap.to({ val: 1.0 }, {
                val: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.3)',
                onUpdate: function() {
                    const factor = this.targets()[0].val;
                    const posAttr = doughGeo.attributes.position;
                    const pos = posAttr.array;
                    const orig = originalPositions.array;
                    
                    for (let i = 0; i < pos.length; i++) {
                        pos[i] = orig[i] + (pos[i] - orig[i]) * factor;
                    }
                    posAttr.needsUpdate = true;
                }
            });
        }

        container.addEventListener('mousedown', handleStart);
        container.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);

        container.addEventListener('touchstart', handleStart, { passive: true });
        container.addEventListener('touchmove', handleMove, { passive: true });
        window.addEventListener('touchend', handleEnd);

        let animId;
        function animate() {
            animId = requestAnimationFrame(animate);
            dough.rotation.y += 0.005;
            renderer.render(scene, camera);
        }
        animate();

        scenes.knead.cleanup = () => {
            cancelAnimationFrame(animId);
            container.removeEventListener('mousedown', handleStart);
            container.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            container.removeEventListener('touchstart', handleStart);
            container.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }

    // ==========================================================================
    // 3. STEP C — SHAPE BASE CONFIRMATION
    // ==========================================================================
    function initShape(containerId, initialShape) {
        const base = setupBaseScene(containerId);
        if (!base) return;

        const { scene, camera, renderer } = base;
        scenes.shape = base;

        activeShape = initialShape;
        camera.position.set(0, 6, 9);
        camera.lookAt(0, 0, 0);

        let currentCake = createCakeMesh(activeShape);
        scene.add(currentCake);

        // API Method: Smooth morph swap
        function changeShape(newShape) {
            if (newShape === activeShape) return;
            activeShape = newShape;

            SoundEngine.playClick();

            // Animate scale down -> swap -> scale up
            gsap.to(currentCake.scale, {
                x: 0.01,
                y: 0.01,
                z: 0.01,
                duration: 0.35,
                ease: 'back.in(1.7)',
                onComplete: () => {
                    scene.remove(currentCake);
                    currentCake = createCakeMesh(activeShape);
                    currentCake.scale.set(0.01, 0.01, 0.01);
                    scene.add(currentCake);

                    gsap.to(currentCake.scale, {
                        x: 1,
                        y: 1,
                        z: 1,
                        duration: 0.5,
                        ease: 'back.out(1.7)'
                    });
                }
            });
        }

        let animId;
        function animate() {
            animId = requestAnimationFrame(animate);
            if (currentCake) {
                currentCake.rotation.y += 0.008;
            }
            renderer.render(scene, camera);
        }
        animate();

        scenes.shape.cleanup = () => {
            cancelAnimationFrame(animId);
        };

        // Export shape switching callback
        scenes.shape.changeShape = changeShape;
    }

    // ==========================================================================
    // 4. STEP D — DECORATION TOPPING CANVAS
    // ==========================================================================
    function initDecorate(containerId) {
        const base = setupBaseScene(containerId);
        if (!base) return;

        const { scene, camera, renderer, container } = base;
        scenes.decorate = base;

        camera.position.set(0, 8, 10);
        camera.lookAt(0, 0, 0);

        const cake = createCakeMesh(activeShape);
        scene.add(cake);

        // Wipe previous global list
        addedToppingsList = [];

        // API Method: Spawn falling toppings
        function addTopping(type) {
            SoundEngine.playSelect(Math.floor(Math.random() * 5));

            const mesh = createToppingMesh(type);
            
            // Random location on top surface of the cake
            const radius = 1.0 + Math.random() * 2.8;
            const angle = Math.random() * Math.PI * 2;
            const px = Math.cos(angle) * radius;
            const pz = Math.sin(angle) * radius;

            mesh.position.set(px, 7.0, pz); // spawn high above
            mesh.scale.set(0.01, 0.01, 0.01);
            scene.add(mesh);

            // Record to list for the final scene cloning
            addedToppingsList.push({ type, px, pz, rotation: Math.random() * Math.PI * 2 });

            // Falling starlight trajectory
            gsap.timeline()
                .to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.25 })
                .to(mesh.position, {
                    y: 1.25, // cake top height
                    duration: 0.65,
                    ease: 'bounce.out'
                });
        }

        let animId;
        function animate() {
            animId = requestAnimationFrame(animate);
            cake.rotation.y += 0.003;
            
            // Rotate matching toppings to keep pace
            scene.children.forEach(child => {
                if (child !== cake && !(child instanceof THREE.Light)) {
                    // orbit around origin together with the cake
                    const speed = 0.003;
                    const cos = Math.cos(speed);
                    const sin = Math.sin(speed);
                    const rx = child.position.x * cos - child.position.z * sin;
                    const rz = child.position.x * sin + child.position.z * cos;
                    child.position.x = rx;
                    child.position.z = rz;
                    child.rotation.y += speed;
                }
            });

            renderer.render(scene, camera);
        }
        animate();

        scenes.decorate.cleanup = () => {
            cancelAnimationFrame(animId);
        };

        // Export toppings callback
        scenes.decorate.addTopping = addTopping;
    }

    // ==========================================================================
    // 5. PHASE 5 & 6 — FINAL CINEMATIC CUTTING & WISHES ORBIT
    // ==========================================================================
    function initFinal(containerId) {
        const base = setupBaseScene(containerId);
        if (!base) return;

        const { scene, camera, renderer, container } = base;
        scenes.final = base;

        // Cinematic wide camera angle
        camera.position.set(0, 7, 12);

        // OrbitControls for interaction
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go under floor
        controls.minDistance = 6;
        controls.maxDistance = 16;

        // Recreate the custom cake mesh inside a parent animation group
        const cakeGroup = new THREE.Group();
        
        // Build cake split halves
        const leftHalf = new THREE.Group();
        const rightHalf = new THREE.Group();
        
        const cakeModel = createCakeMesh(activeShape);
        
        // We will mount toppings onto specific side halves for perfect splitting separation
        addedToppingsList.forEach(data => {
            const mesh = createToppingMesh(data.type);
            mesh.position.set(data.px, 1.25, data.pz);
            mesh.rotation.y = data.rotation;
            
            if (data.px < 0) {
                leftHalf.add(mesh);
            } else {
                rightHalf.add(mesh);
            }
        });

        // Split cake layers dynamically: Left and Right
        // To build a realistic split, we slice the cake model using clipping planes or cloning
        // Here we do a clean mesh duplicate with clipping planes for visual split perfection!
        const clipLeft = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
        const clipRight = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

        // Clone base cake to represent left and right sections
        const leftModel = cakeModel.clone();
        const rightModel = cakeModel.clone();

        // Enable clipping rendering in renderer
        renderer.localClippingEnabled = true;

        leftModel.children.forEach(mesh => {
            if (mesh.material) {
                mesh.material = mesh.material.clone();
                mesh.material.clippingPlanes = [clipLeft];
            }
        });
        rightModel.children.forEach(mesh => {
            if (mesh.material) {
                mesh.material = mesh.material.clone();
                mesh.material.clippingPlanes = [clipRight];
            }
        });

        leftHalf.add(leftModel);
        rightHalf.add(rightModel);

        cakeGroup.add(leftHalf, rightHalf);
        scene.add(cakeGroup);

        // Spawn glowing slice blade indicator
        const bladeGeo = new THREE.BoxGeometry(0.1, 10, 8);
        const bladeMat = new THREE.MeshBasicMaterial({
            color: 0xff007f,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.set(0, 2, 0);
        scene.add(blade);

        let isCutCompleted = false;

        // Perform slicing split animations
        function sliceCake(onCompleteCallback) {
            if (isCutCompleted) return;
            isCutCompleted = true;

            SoundEngine.playCut();

            // 1. Blade flashes glow and slices down
            gsap.timeline()
                .to(bladeMat, { opacity: 0.8, duration: 0.15 })
                .to(blade.position, { y: -2, duration: 0.35, ease: 'power2.in' })
                .to(bladeMat, { opacity: 0, duration: 0.2 })
                .to(leftHalf.position, {
                    x: -1.2,
                    z: -0.4,
                    duration: 1.2,
                    ease: 'power3.out'
                })
                .to(rightHalf.position, {
                    x: 1.2,
                    z: 0.4,
                    duration: 1.2,
                    ease: 'power3.out',
                    onComplete: () => {
                        // Reveal inner sponge slice textures nicely
                        onCompleteCallback();
                    }
                }, "<"); // sync start together

            // Spawn dynamic flying crumbs
            spawnCrumbs();
        }

        function spawnCrumbs() {
            const crumbsCount = 40;
            const crumbGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
            
            for (let i = 0; i < crumbsCount; i++) {
                const colors = [0xffd700, 0xff007f, 0x00f2fe, 0xfffcf0];
                const crumbMat = new THREE.MeshBasicMaterial({
                    color: colors[Math.floor(Math.random() * colors.length)],
                    transparent: true,
                    opacity: 0.9
                });
                const crumb = new THREE.Mesh(crumbGeo, crumbMat);
                
                // Spawn along cut line center
                crumb.position.set(
                    (Math.random() - 0.5) * 0.5,
                    1.0 + Math.random() * 0.5,
                    (Math.random() - 0.5) * 4.0
                );
                scene.add(crumb);

                // Dispersal physics flight
                gsap.to(crumb.position, {
                    x: crumb.position.x + (Math.random() - 0.5) * 4.0,
                    y: crumb.position.y - 3.0,
                    z: crumb.position.z + (Math.random() - 0.5) * 4.0,
                    duration: 1.0 + Math.random() * 1.0,
                    ease: 'power1.out'
                });
                
                gsap.to(crumb.rotation, {
                    x: Math.random() * 10,
                    y: Math.random() * 10,
                    duration: 2.0
                });

                gsap.to(crumbMat, {
                    opacity: 0,
                    duration: 1.5,
                    delay: 0.5,
                    onComplete: () => {
                        scene.remove(crumb);
                    }
                });
            }
        }

        let animId;
        function animate() {
            animId = requestAnimationFrame(animate);
            controls.update();

            // Gentle auto-rotation before being cut
            if (!isCutCompleted) {
                cakeGroup.rotation.y += 0.003;
            }

            renderer.render(scene, camera);
        }
        animate();

        scenes.final.cleanup = () => {
            cancelAnimationFrame(animId);
            controls.dispose();
        };

        // Export slice method
        scenes.final.sliceCake = sliceCake;
    }

    // Window size resizing handler
    function resize() {
        Object.keys(scenes).forEach(key => {
            const base = scenes[key];
            if (base && base.container && base.renderer && base.camera) {
                const width = base.container.clientWidth;
                const height = base.container.clientHeight;
                
                base.camera.aspect = width / height;
                base.camera.updateProjectionMatrix();
                
                base.renderer.setSize(width, height);
            }
        });
    }

    window.addEventListener('resize', resize);

    function changeShape(shape) {
        if (scenes.shape && scenes.shape.changeShape) {
            scenes.shape.changeShape(shape);
        }
    }

    function addTopping(type) {
        if (scenes.decorate && scenes.decorate.addTopping) {
            scenes.decorate.addTopping(type);
        }
    }

    function sliceCake(callback) {
        if (scenes.final && scenes.final.sliceCake) {
            scenes.final.sliceCake(callback);
        }
    }

    function cleanup() {
        Object.keys(scenes).forEach(key => {
            if (scenes[key] && scenes[key].cleanup) {
                scenes[key].cleanup();
                scenes[key] = null;
            }
        });
    }

    return {
        initStir,
        initKnead,
        initShape,
        initDecorate,
        initFinal,
        changeShape,
        addTopping,
        sliceCake,
        cleanup,
        resize
    };
})();
