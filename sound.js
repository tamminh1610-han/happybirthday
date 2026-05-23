/* ==========================================================================
   BIRTHDAY FANTASY NIGHT SKY - WEB AUDIO API SOUND GENERATOR
   Ethereal soundscapes and interactive FX without external audio assets.
   ========================================================================== */

const SoundEngine = (() => {
    let ctx = null;
    let isMuted = true;
    
    // Nodes for ambient synth
    let ambientOsc1 = null;
    let ambientOsc2 = null;
    let ambientFilter = null;
    let ambientGain = null;
    let delayNode = null;
    let delayGain = null;
    
    // Scheduled events
    let arpeggioTimer = null;
    let musicActive = false;

    // Pentatonic scale for magical starlight arpeggios
    // Notes: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5
    const SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

    // Initialize Audio Context on user gesture
    function init() {
        if (ctx) return;
        
        // Browser support compatibility
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContextClass();
        
        setupAmbientSynth();
    }

    // Setup the Ethereal Ambient synth nodes
    function setupAmbientSynth() {
        if (!ctx) return;

        // Ambient Gain to control volume
        ambientGain = ctx.createGain();
        ambientGain.gain.setValueAtTime(0, ctx.currentTime);

        // Low Pass Filter with LFO modulation
        ambientFilter = ctx.createBiquadFilter();
        ambientFilter.type = 'lowpass';
        ambientFilter.Q.setValueAtTime(4, ctx.currentTime);
        ambientFilter.frequency.setValueAtTime(200, ctx.currentTime);

        // Main ambient oscillator (warm triangle wave)
        ambientOsc1 = ctx.createOscillator();
        ambientOsc1.type = 'triangle';
        ambientOsc1.frequency.setValueAtTime(65.41, ctx.currentTime); // C2 low drone

        // Sub oscillator for celestial thickness
        ambientOsc2 = ctx.createOscillator();
        ambientOsc2.type = 'sine';
        ambientOsc2.frequency.setValueAtTime(130.81, ctx.currentTime); // C3 low drone

        // Delay effect for cosmic deep space echo
        delayNode = ctx.createDelay(1.0);
        delayNode.delayTime.setValueAtTime(0.4, ctx.currentTime);

        delayGain = ctx.createGain();
        delayGain.gain.setValueAtTime(0.3, ctx.currentTime); // feed feedback gain

        // Connect synthesis graph
        ambientOsc1.connect(ambientFilter);
        ambientOsc2.connect(ambientFilter);
        ambientFilter.connect(ambientGain);

        // Delay feedback loop
        ambientGain.connect(delayNode);
        delayNode.connect(delayGain);
        delayGain.connect(delayNode); // feedback loop
        delayGain.connect(ctx.destination); // feed back to output

        ambientGain.connect(ctx.destination);

        // Start oscillators
        ambientOsc1.start(0);
        ambientOsc2.start(0);

        // Modulate filter frequency with custom LFO
        modulateFilter();
    }

    // slow sweep filter modulation
    function modulateFilter() {
        if (!ctx || !ambientFilter) return;
        
        const now = ctx.currentTime;
        const speed = 12; // slow modulation
        
        // Randomly sweep filter between 180Hz and 800Hz for nebula swelling effect
        ambientFilter.frequency.cancelScheduledValues(now);
        ambientFilter.frequency.setValueAtTime(ambientFilter.frequency.value, now);
        ambientFilter.frequency.linearRampToValueAtTime(180 + Math.random() * 600, now + speed);

        setTimeout(() => {
            if (musicActive) modulateFilter();
        }, speed * 1000);
    }

    // Dreamy celestial arpeggios that play randomly in the background
    function playBackgroundArpeggio() {
        if (!musicActive || isMuted || !ctx) return;

        const now = ctx.currentTime;
        const octaveShift = Math.floor(Math.random() * 2) * 5; // shift pentatonic octave
        const index1 = Math.floor(Math.random() * 5) + octaveShift;
        const index2 = (index1 + 2 + Math.floor(Math.random() * 3)) % SCALE.length;
        
        // Trigger a soft starlight note
        triggerStarNote(SCALE[index1], 0.04, 0.4);
        triggerStarNote(SCALE[index2], 0.04, 0.4, 0.25); // staggered note

        // Schedule next starlight arpeggio sequence
        const delay = 3000 + Math.random() * 4000;
        arpeggioTimer = setTimeout(playBackgroundArpeggio, delay);
    }

    // Trigger single soft starlight synth chime
    function triggerStarNote(freq, attack, release, delaySec = 0) {
        if (!ctx || isMuted) return;

        const time = ctx.currentTime + delaySec;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.08, time + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + release);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(delayNode); // routing through main cosmic delay

        osc.start(time);
        osc.stop(time + attack + release + 0.1);
    }

    // ==========================================================================
    // EXTERNAL API METHODS
    // ==========================================================================

    function startMusic() {
        init();
        if (musicActive) return;
        musicActive = true;
        
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }

        // Fade in ambient music smoothly
        if (ambientGain && !isMuted) {
            ambientGain.gain.cancelScheduledValues(ctx.currentTime);
            ambientGain.gain.setValueAtTime(ambientGain.gain.value, ctx.currentTime);
            ambientGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 3.0); // low background hum
        }

        // Start starry arpeggio sequences
        playBackgroundArpeggio();
    }

    function toggleMute() {
        init();
        isMuted = !isMuted;
        
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;
        if (isMuted) {
            // Mute everything instantly
            if (ambientGain) {
                ambientGain.gain.cancelScheduledValues(now);
                ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
                ambientGain.gain.linearRampToValueAtTime(0, now + 0.5);
            }
        } else {
            // Unmute & start pad
            if (ambientGain) {
                ambientGain.gain.cancelScheduledValues(now);
                ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
                ambientGain.gain.linearRampToValueAtTime(0.12, now + 1.5);
            }
            if (!musicActive) {
                startMusic();
            }
        }
        return isMuted;
    }

    // High pitched magical button hover tone
    function playHover() {
        if (!ctx || isMuted) return;
        
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5 high note
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.015, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Dreamy click bell
    function playClick() {
        if (!ctx || isMuted) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // Sweep to C6

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    // Sparkle note triggered on ingredient selection
    function playSelect(index = 0) {
        if (!ctx || isMuted) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = ctx.createDelay();
        
        const noteFreq = SCALE[index % SCALE.length];

        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreq, now);
        osc.frequency.exponentialRampToValueAtTime(noteFreq * 2, now + 0.1);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Swoosh sound when actively stirring
    function playStir(stirIntensity = 0.5) {
        if (!ctx || isMuted) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(80 + stirIntensity * 40, now); // low pitch swirl

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08 * stirIntensity, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Squishy bubble sound when kneading dough
    function playKnead() {
        if (!ctx || isMuted) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15); // falling pitch squish

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Celestial chord sweep when puzzle or cake is finished
    function playSuccess() {
        if (!ctx || isMuted) return;

        const now = ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major chord sweep
        
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.07;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, time);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.04, time + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(time);
            osc.stop(time + 0.5);
        });
    }

    // High passed swoosh sound for cutting cake
    function playCut() {
        if (!ctx || isMuted) return;

        const now = ctx.currentTime;
        
        // 1. Noise Generator for cutting friction
        const bufferSize = ctx.sampleRate * 0.4; // 0.4 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(5000, now + 0.3);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // 2. Ethereal bells descending at the same time
        const chimeNotes = [880.00, 659.25, 523.25, 440.00];
        chimeNotes.forEach((freq, idx) => {
            const time = now + idx * 0.06;
            const osc = ctx.createOscillator();
            const chimeGain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            chimeGain.gain.setValueAtTime(0, time);
            chimeGain.gain.linearRampToValueAtTime(0.03, time + 0.03);
            chimeGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);

            osc.connect(chimeGain);
            chimeGain.connect(ctx.destination);

            osc.start(time);
            osc.stop(time + 0.45);
        });

        noiseNode.start(now);
        noiseNode.stop(now + 0.4);
    }

    return {
        init,
        startMusic,
        toggleMute,
        playHover,
        playClick,
        playSelect,
        playStir,
        playKnead,
        playSuccess,
        playCut
    };
})();
