/**
 * Web Audio API synthesizer for pedestrian fall emergency warning sound
 */

let audioCtx: AudioContext | null = null;
let sirenInterval: any = null;
let osc1: OscillatorNode | null = null;
let osc2: OscillatorNode | null = null;
let mainGain: GainNode | null = null;

export const startEmergencySiren = () => {
  try {
    // If already playing, don't duplicate
    if (audioCtx) return;

    // Create audio context
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create gain node for volume control
    mainGain = audioCtx.createGain();
    mainGain.gain.setValueAtTime(0.3, audioCtx.currentTime); // moderate volume

    // Create Two-Tone siren (Hi-Lo alarm)
    osc1 = audioCtx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz

    osc2 = audioCtx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz

    // Connect them
    osc1.connect(mainGain);
    osc2.connect(mainGain);
    mainGain.connect(audioCtx.destination);

    // Start oscillators
    osc1.start();
    osc2.start();

    // Alternate frequencies to create a realistic siren sound ("Wee-Woo-Wee-Woo")
    let alternate = true;
    sirenInterval = setInterval(() => {
      if (!audioCtx || !osc1 || !osc2 || !mainGain) return;
      
      const now = audioCtx.currentTime;
      if (alternate) {
        osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        osc2.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        mainGain.gain.exponentialRampToValueAtTime(0.4, now + 0.1);
      } else {
        osc1.frequency.exponentialRampToValueAtTime(600, now + 0.25);
        osc2.frequency.exponentialRampToValueAtTime(400, now + 0.25);
        mainGain.gain.exponentialRampToValueAtTime(0.15, now + 0.1);
      }
      alternate = !alternate;
    }, 450);

  } catch (error) {
    console.error("Failed to start Web Audio API emergency siren:", error);
  }
};

export const stopEmergencySiren = () => {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  
  if (osc1) {
    try { osc1.stop(); } catch (e) {}
    osc1.disconnect();
    osc1 = null;
  }
  
  if (osc2) {
    try { osc2.stop(); } catch (e) {}
    osc2.disconnect();
    osc2 = null;
  }

  if (mainGain) {
    mainGain.disconnect();
    mainGain = null;
  }

  if (audioCtx) {
    if (audioCtx.state !== "closed") {
      audioCtx.close();
    }
    audioCtx = null;
  }
};

// Simple diagnostic quick beep test
export const playSuccessBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6 note (clear high beep)
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.error(e);
  }
};
