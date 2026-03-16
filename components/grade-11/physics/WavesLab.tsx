import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface WavesLabProps {
    topic: any;
    onExit: () => void;
}

const WavesLab: React.FC<WavesLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);

    const [freq, setFreq] = useState(5.0);
    const [tension, setTension] = useState(50);
    const [fixedEnd, setFixedEnd] = useState(true);
    const [running, setRunning] = useState(true);

    const stateRef = useRef({
        freq: 5.0, tension: 50, mu: 0.01, amplitude: 35,
        fixedEnd: true, running: true, time: 0,
    });

    const N_PARTICLES = 140;

    useEffect(() => {
        stateRef.current.freq = freq;
        stateRef.current.tension = tension;
        stateRef.current.fixedEnd = fixedEnd;
        stateRef.current.running = running;
    }, [freq, tension, fixedEnd, running]);

    // Dynamic canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        resizeObserver.observe(parent);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        return () => resizeObserver.disconnect();
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }
        const s = stateRef.current;

        if (s.running) s.time += 0.004;

        // Physics
        const v_wave = Math.sqrt(s.tension / s.mu);
        const lambda = v_wave / s.freq;
        const omega = 2 * Math.PI * s.freq;
        const k = 2 * Math.PI / lambda;
        const STRING_L = W * 0.85;
        const L_meters = STRING_L * 0.01;
        const n_harmonic = Math.round(2 * L_meters * s.freq / v_wave);
        const resonantFreq = n_harmonic > 0 ? n_harmonic * v_wave / (2 * L_meters) : 0;
        const isResonant = n_harmonic > 0 && Math.abs(s.freq - resonantFreq) < 0.3;

        // Clear
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; // Soft White
        ctx.fillRect(0, 0, W, H);

        // DYNAMIC VIEWPORT SCALING (Laptop vs Smartboard)
        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

        // ═══════════════════════════════════════════
        // TOP: String animation
        // ═══════════════════════════════════════════
        const STRING_X0 = pad * 4;
        const STRING_Y = H * 0.18;
        const scaledAmp = Math.min(s.amplitude, H * 0.08);

        // Oscillator (left)
        const oscY = STRING_Y + Math.sin(omega * s.time) * scaledAmp * 0.6;
        ctx.fillStyle = '#94a3b8';
        roundRect(ctx, STRING_X0 - 32 * scale, STRING_Y - 35 * scale, 32 * scale, 70 * scale, 6); ctx.fill();
        ctx.fillStyle = '#334155'; ctx.beginPath();
        ctx.arc(STRING_X0 - 16 * scale, oscY, 10 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5 * scale;
        ctx.beginPath(); ctx.arc(STRING_X0 - 16 * scale, oscY, 10 * scale, 0, Math.PI * 2); ctx.stroke();

        // Clamp (right)
        const clampX = STRING_X0 + STRING_L;
        ctx.fillStyle = '#94a3b8';
        if (s.fixedEnd) {
            ctx.fillRect(clampX, STRING_Y - 35 * scale, 16 * scale, 70 * scale);
            ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.5 * scale;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(clampX + 14 * scale, STRING_Y - 30 * scale + i * 12 * scale);
                ctx.lineTo(clampX + 2 * scale, STRING_Y - 21 * scale + i * 12 * scale);
                ctx.stroke();
            }
        } else {
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 4 * scale;
            ctx.beginPath(); ctx.arc(clampX + 8 * scale, STRING_Y, 12 * scale, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(clampX + 8 * scale, STRING_Y, 8 * scale, 0, Math.PI * 2); ctx.fill();
        }

        // Labels
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('OSCILLATOR', STRING_X0 - 16 * scale, STRING_Y + 55 * scale);
        ctx.fillText(s.fixedEnd ? 'FIXED' : 'FREE', clampX + 8 * scale, STRING_Y + 55 * scale);

        // Draw string
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= N_PARTICLES; i++) {
            const px = STRING_X0 + (i / N_PARTICLES) * STRING_L;
            const x_m = (i / N_PARTICLES) * L_meters;
            const y_inc = scaledAmp * Math.sin(k * x_m - omega * s.time);
            const y_ref = s.fixedEnd
                ? -scaledAmp * Math.sin(k * (2 * L_meters - x_m) - omega * s.time)
                : scaledAmp * Math.sin(k * (2 * L_meters - x_m) - omega * s.time);
            points.push({ x: px, y: STRING_Y + y_inc + y_ref });
        }

        ctx.strokeStyle = isResonant ? '#16a34a' : '#475569';
        ctx.lineWidth = (isResonant ? 4.5 : 3.5) * scale;
        ctx.beginPath();
        points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Particles
        const particleStep = Math.max(1, Math.floor(N_PARTICLES / 45));
        for (let i = 0; i <= N_PARTICLES; i += particleStep) {
            const p = points[i];
            const disp = Math.abs(p.y - STRING_Y);
            const bright = Math.min(1, disp / (scaledAmp * 1.5));
            ctx.fillStyle = isResonant
                ? `rgba(22, 163, 74, ${0.6 + bright * 0.4})`
                : `rgba(15, 23, 42, ${0.5 + bright * 0.35})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, (4 + bright * 2) * scale, 0, Math.PI * 2); ctx.fill();
        }

        // Nodes and antinodes
        if (isResonant && n_harmonic > 0) {
            const lambdaRes = 2 * L_meters / n_harmonic;
            for (let nn = 0; nn <= n_harmonic; nn++) {
                const nodeX = STRING_X0 + (nn * lambdaRes / 2 / L_meters) * STRING_L;
                ctx.fillStyle = '#dc2626';
                ctx.beginPath(); ctx.arc(nodeX, STRING_Y, 8 * scale, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffffff'; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'center';
                ctx.fillText('N', nodeX, STRING_Y + 4 * scale);
            }
            for (let an = 0; an < n_harmonic; an++) {
                const antiX = STRING_X0 + ((an + 0.5) * lambdaRes / 2 / L_meters) * STRING_L;
                ctx.strokeStyle = 'rgba(37, 99, 235, 0.5)'; ctx.lineWidth = 2 * scale; ctx.setLineDash([6, 5]);
                ctx.beginPath(); ctx.moveTo(antiX, STRING_Y - scaledAmp * 2.2); ctx.lineTo(antiX, STRING_Y + scaledAmp * 2.2); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#2563eb'; ctx.font = `bold ${fs(14)}px sans-serif`;
                ctx.fillText('A', antiX, STRING_Y - scaledAmp * 2.2 - 8 * scale);
            }
        }

        // Title area
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('Superposition, Reflection & Standing Waves', pad, pad * 1.2);
        ctx.fillStyle = isResonant ? '#16a34a' : '#64748b';
        ctx.font = `bold ${fs(12)}px sans-serif`;
        ctx.fillText(isResonant ? `STATIONARY WAVE: HARMONIC #${n_harmonic}` : 'SWEEP FREQUENCY FOR RESONANCE harmonics', pad, pad * 1.2 + fs(17));

        // ═══════════════════════════════════════════
        // BOTTOM: Wave Graphs + Info Panel
        // ═══════════════════════════════════════════
        const bottomY = H * 0.35;
        const bottomH = H - bottomY - pad;

        const graphAreaW = W * 0.48;
        const graphX = pad;
        const graphGap = pad * 0.5;
        const graphCount = 3;
        const resBoxH = Math.min(bottomH * 0.2, 55 * scale);
        const singleGH = (bottomH - graphGap * graphCount - resBoxH - graphGap) / graphCount;

        const waveGraphs = [
            { label: 'INCIDENT', color: '#2563eb' },
            { label: 'REFLECTED', color: '#dc2626' },
            { label: 'RESULTANT', color: '#7c3aed' },
        ];

        waveGraphs.forEach((g, idx) => {
            const gy = bottomY + idx * (singleGH + graphGap);
            ctx.fillStyle = '#ffffff';
            roundRect(ctx, graphX, gy, graphAreaW, singleGH, 8); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
            roundRect(ctx, graphX, gy, graphAreaW, singleGH, 8); ctx.stroke();
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(graphX, gy + singleGH / 2); ctx.lineTo(graphX + graphAreaW, gy + singleGH / 2); ctx.stroke();
            ctx.fillStyle = g.color; ctx.font = `bold ${fs(11)}px monospace`; ctx.textAlign = 'left';
            ctx.fillText(g.label, graphX + 10, gy + fs(12) + 4);
        });

        for (let i = 0; i <= N_PARTICLES; i++) {
            const px = graphX + (i / N_PARTICLES) * graphAreaW;
            const x_m = (i / N_PARTICLES) * L_meters;
            const y_inc = Math.sin(k * x_m - omega * s.time);
            const y_ref = s.fixedEnd
                ? -Math.sin(k * (2 * L_meters - x_m) - omega * s.time)
                : Math.sin(k * (2 * L_meters - x_m) - omega * s.time);
            const y_res = y_inc + y_ref;

            const drawDot = (gIdx: number, val: number, color: string) => {
                const gy = bottomY + gIdx * (singleGH + graphGap);
                const py = gy + singleGH / 2 - val * (singleGH / 2 - 6);
                ctx.fillStyle = color;
                if (i % 2 === 0) ctx.fillRect(px, py, 3, 3);
            };
            drawDot(0, y_inc, '#2563eb');
            drawDot(1, y_ref, '#dc2626');
            drawDot(2, y_res * 0.5, '#7c3aed');
        }

        const resY = bottomY + graphCount * (singleGH + graphGap);
        if (isResonant && n_harmonic > 0) {
            ctx.fillStyle = 'rgba(22,163,74,0.08)'; roundRect(ctx, graphX, resY, graphAreaW, resBoxH, 10); ctx.fill();
            ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2.5 * scale; roundRect(ctx, graphX, resY, graphAreaW, resBoxH, 10); ctx.stroke();
            ctx.fillStyle = '#16a34a'; ctx.font = `bold ${fs(14)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(`🎶 RESONANCE DETECTED (n = ${n_harmonic})`, graphX + graphAreaW / 2, resY + resBoxH * 0.45);
        } else {
            ctx.fillStyle = '#ffffff'; roundRect(ctx, graphX, resY, graphAreaW, resBoxH, 10); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5; roundRect(ctx, graphX, resY, graphAreaW, resBoxH, 10); ctx.stroke();
            ctx.fillStyle = '#94a3b8'; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('SWEEP FREQUENCY FOR RESONANCE...', graphX + graphAreaW / 2, resY + resBoxH * 0.6);
        }

        const rightX = graphX + graphAreaW + pad;
        const rightW = W - rightX - pad;

        const card1H = bottomH * 0.52;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, rightX, bottomY, rightW, card1H, 14); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, rightX, bottomY, rightW, card1H, 14); ctx.stroke();

        const lineH = fs(16) + 10;
        let fy = bottomY + lineH * 1.5;
        ctx.fillStyle = '#2563eb'; ctx.font = `bold ${fs(20)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText(`ν = ${s.freq.toFixed(1)} Hz`, rightX + rightW * 0.3, fy);
        ctx.fillStyle = '#d97706'; ctx.font = `bold ${fs(20)}px monospace`;
        ctx.fillText(`v = ${v_wave.toFixed(1)} m/s`, rightX + rightW * 0.7, fy);

        fy += lineH;
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(11)}px monospace`;
        ctx.fillText(`λ = ${lambda.toFixed(3)} m | k = ${k.toFixed(1)}`, rightX + rightW / 2, fy);

        fy += lineH;
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(11)}px monospace`;
        ctx.fillText(`SPEED v = √(T/μ)`, rightX + rightW / 2, fy);

        fy += lineH * 1.2;
        if (isResonant && n_harmonic > 0) {
            ctx.fillStyle = '#16a34a'; ctx.font = `bold ${fs(13)}px sans-serif`;
            ctx.fillText(`RESONANT: νₙ = ${resonantFreq.toFixed(2)} Hz`, rightX + rightW / 2, fy);
        }

        const card2Y = bottomY + card1H + pad * 0.8;
        const card2H = bottomH - card1H - pad * 0.8;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, rightX, card2Y, rightW, card2H, 14); ctx.fill();
        ctx.strokeStyle = '#7c3aed40'; ctx.lineWidth = 2;
        roundRect(ctx, rightX, card2Y, rightW, card2H, 14); ctx.stroke();

        ctx.fillStyle = '#7c3aed'; ctx.font = `bold ${fs(14)}px sans-serif`;
        ctx.fillText('STANDING WAVE EQUATION', rightX + rightW / 2, card2Y + lineH * 0.8);
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px monospace`;
        ctx.fillText('y = [2A sin(kx)] cos(ωt)', rightX + rightW / 2, card2Y + lineH * 1.8);

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const handleReset = () => {
        setFreq(5.0); setTension(50); setFixedEnd(true); setRunning(true);
        stateRef.current = { freq: 5.0, tension: 50, mu: 0.01, amplitude: 35, fixedEnd: true, running: true, time: 0 };
    };

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-2 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🎵 Driver Frequency</span>
                        <span className="text-blue-700 font-mono text-base md:text-lg bg-blue-50 border border-blue-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{freq.toFixed(1)} Hz</span>
                    </label>
                    <input type="range" min="1" max="50" step="0.5" value={freq}
                        onChange={(e) => setFreq(Number(e.target.value))}
                        className="w-full accent-blue-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-400">
                        <span>Min (1 Hz)</span><span>Max (50 Hz)</span>
                    </div>
                </div>
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🔧 String Tension</span>
                        <span className="text-amber-700 font-mono text-base md:text-lg bg-amber-50 border border-amber-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{Math.round(tension)} N</span>
                    </label>
                    <input type="range" min="10" max="200" step="5" value={tension}
                        onChange={(e) => setTension(Number(e.target.value))}
                        className="w-full accent-amber-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-400">
                        <span>Min (10 N)</span><span>Max (200 N)</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 items-center justify-center mt-1 md:mt-2">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
                    <button onClick={() => setFixedEnd(true)}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-bold rounded-lg transition-all ${fixedEnd
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>
                        FIXED
                    </button>
                    <button onClick={() => setFixedEnd(false)}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-bold rounded-lg transition-all ${!fixedEnd
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>
                        FREE
                    </button>
                </div>
                <button onClick={() => setRunning(!running)}
                    className={`w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-xl border font-bold text-sm md:text-base transition-all shadow-md active:scale-95 ${running
                        ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        : 'bg-emerald-600 text-white border-emerald-500 shadow-lg'}`}>
                    {running ? <><Pause size={20} /> PAUSE</> : <><Play size={20} /> RESUME</>}
                </button>
                <button onClick={handleReset}
                    className="w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-sm md:text-base shadow-sm active:scale-95">
                    <RotateCcw size={20} /> RESET ALL
                </button>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

export default WavesLab;
