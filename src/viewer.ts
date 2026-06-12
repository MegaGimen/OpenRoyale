import './style.css';
import { SCRenderer } from './engine/SCRenderer';

const charSelect = document.getElementById('charSelect') as HTMLSelectElement;
const animSelect = document.getElementById('animSelect') as HTMLSelectElement;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const fpsInput = document.getElementById('fpsInput') as HTMLInputElement;
const spriteDisplay = document.getElementById('spriteDisplay') as HTMLDivElement;
const frameInfo = document.getElementById('frameInfo') as HTMLDivElement;
const timeline = document.getElementById('timeline') as HTMLDivElement;

let currentFrameIndex = 0;
let frameCount = 0;
let isPlaying = true;
let playbackTimer: number | null = null;
let currentExports: string[] = [];
let canvas: HTMLCanvasElement | null = null;

async function loadMapping(charId: string) {
    try {
        const id = charId.replace('chr_', '');
        await SCRenderer.loadCharacter(`chr_${id}`);
        
        const data = SCRenderer.dataCache[`chr_${id}`];
        if (!data) return;

        currentExports = Object.keys(data.exports).sort();
        
        animSelect.innerHTML = '';
        for (const animName of currentExports) {
            const opt = document.createElement('option');
            opt.value = animName;
            opt.innerText = animName;
            animSelect.appendChild(opt);
        }
        
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            spriteDisplay.style.backgroundImage = 'none';
            spriteDisplay.style.backgroundColor = '#ccc';
            spriteDisplay.appendChild(canvas);
        }
        
        updateAnimationRange();
    } catch (e) {
        frameInfo.innerText = "Error loading mapping: " + e;
    }
}

function updateAnimationRange() {
    const charId = charSelect.value.replace('chr_', '');
    const data = SCRenderer.dataCache[`chr_${charId}`];
    if (!data) return;

    const animName = animSelect.value;
    const mcId = data.exports[animName];
    const mc = data.movieclips[mcId];
    
    if (!mc) {
        frameCount = 0;
        timeline.innerHTML = '';
        return;
    }
    
    frameCount = mc.frames.length;
    currentFrameIndex = 0;
    
    timeline.innerHTML = '';
    for (let f = 0; f < frameCount; f++) {
        const dot = document.createElement('div');
        dot.className = 'frame-dot';
        dot.dataset.frame = f.toString();
        
        const frameData = mc.frames[f];
        if (frameData.name && frameData.name.includes("action_frame")) {
            dot.style.backgroundColor = 'red';
        }
        
        dot.onclick = () => {
            currentFrameIndex = f;
            isPlaying = false;
            renderFrame();
        };
        timeline.appendChild(dot);
    }
    
    renderFrame();
}

function renderFrame() {
    if (frameCount === 0 || !canvas) return;
    
    const charId = charSelect.value.replace('chr_', '');
    const animName = animSelect.value;
    
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    SCRenderer.drawFrameDirect(ctx, `chr_${charId}`, animName, currentFrameIndex, false, 1.0);
    ctx.restore();
    
    frameInfo.innerText = `Playing: ${animName} | Frame: ${currentFrameIndex} / ${frameCount-1}`;
    
    const dots = timeline.querySelectorAll('.frame-dot');
    dots.forEach(d => d.classList.remove('active'));
    const activeDot = timeline.querySelector(`.frame-dot[data-frame="${currentFrameIndex}"]`);
    if (activeDot) activeDot.classList.add('active');
}

function loop() {
    if (isPlaying && frameCount > 0) {
        currentFrameIndex++;
        if (currentFrameIndex >= frameCount) {
            currentFrameIndex = 0;
        }
        renderFrame();
    }
    
    const fps = parseInt(fpsInput.value) || 15;
    const delay = 1000 / fps;
    
    if (playbackTimer) clearTimeout(playbackTimer);
    playbackTimer = setTimeout(loop, delay) as any;
}

charSelect.addEventListener('change', () => loadMapping(charSelect.value));
animSelect.addEventListener('change', () => updateAnimationRange());
playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying && frameCount > 0) renderFrame();
});

loadMapping(charSelect.value).then(() => loop());
