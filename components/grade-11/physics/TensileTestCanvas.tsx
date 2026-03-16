import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface TensileTestLabProps {
    topic: any;
    onExit: () => void;
}

const TensileTestCanvas: React.FC<TensileTestLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [material, setMaterial] = useState<'ductile' | 'brittle' | 'elastomer'>('ductile');
    const [force, setForce] = useState(0);
    const [radius, setRadius] = useState(2.0);
    const originalLength = 100;

    const materials = useMemo(() => ({
        ductile: { name: 'Steel', Y: 200, ultimateStress: 400, fractureStress: 450, color: '#64748b', emoji: '🔩' },
        brittle: { name: 'Glass', Y: 70, ultimateStress: 50, fractureStress: 55, color: '#94a3b8', emoji: '🪟' },
        elastomer: { name: 'Rubber', Y: 0.05, ultimateStress: 30, fractureStress: 35, color: '#d97706', emoji: '🎈' }
    }), []);

    const currentMat = materials[material];
    const area = Math.PI * radius * radius;

    const computePhysics = useCallback((f: number) => {
        const s = f / area;
        let e = 0;
        if (material === 'elastomer') {
            e = s / currentMat.Y;
            if (e > 2) e = 2 + Math.sqrt(s / currentMat.Y - 2) * 0.5;
        } else {
            const yieldStress = currentMat.ultimateStress * 0.6;
            if (s <= yieldStress) {
                e = s / (currentMat.Y * 10);
            } else {
                const yieldStrain = yieldStress / (currentMat.Y * 10);
                e = yieldStrain + (s - yieldStress) / (currentMat.Y * 2);
            }
        }
        const isFractured = s >= currentMat.fractureStress;
        return { stress: s, strain: e, fractured: isFractured };
    }, [area, material, currentMat]);

    const physics = computePhysics(force);
    const extension = physics.strain * originalLength;

    const maxForce = useMemo(() => {
        return Math.ceil(currentMat.fractureStress * area * 1.15 / 100) * 100;
    }, [currentMat, area]);

    const graphData = useMemo(() => {
        const points: { strain: number; stress: number }[] = [];
        const steps = 150;
        const capForce = physics.fractured ? currentMat.fractureStress * area : force;
        for (let i = 0; i <= steps; i++) {
            const f = (capForce * i) / steps;
            const p = computePhysics(f);
            if (p.stress >= currentMat.fractureStress) break;
            points.push({ strain: p.strain, stress: p.stress });
        }
        return points;
    }, [force, physics.fractured, computePhysics, currentMat, area]);

    // Dynamic resize
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
        if (W < 10 || H < 10) { requestAnimationFrame(draw); return; }

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; // Soft White
        ctx.fillRect(0, 0, W, H);

        // DYNAMIC VIEWPORT SCALING (Laptop vs Smartboard)
        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

        const appW = W * 0.42;
        const appX = appW / 2 + pad;
        const topY = H * 0.18;

        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('Mechanical Properties: Tensile Stress-Strain Test', pad, pad * 1.25);
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(11)}px sans-serif`;
        ctx.fillText(`${currentMat.emoji} SPECIMEN: ${currentMat.name.toUpperCase()} WIRE`, pad, pad * 1.25 + fs(17));

        // Support frame
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(appX - 100 * scale, topY - 35 * scale, 200 * scale, 12 * scale);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(appX - 100 * scale, topY - 35 * scale, 10 * scale, 50 * scale);
        ctx.fillRect(appX + 90 * scale, topY - 35 * scale, 10 * scale, 50 * scale);

        // Clamp
        ctx.fillStyle = '#334155';
        roundRect(ctx, appX - 30 * scale, topY - 5 * scale, 60 * scale, 22 * scale, 6); ctx.fill();

        const wireBaseLen = H * 0.35;
        const wireExt = extension * 1.5;
        const wireTotalLen = wireBaseLen + wireExt;
        const wireWidth = Math.max(radius * 3.8 * scale, 5);

        if (!physics.fractured) {
            const neckFactor = physics.stress > currentMat.ultimateStress
                ? Math.max(0.4, 1 - (physics.stress - currentMat.ultimateStress) / (currentMat.fractureStress - currentMat.ultimateStress) * 0.6)
                : 1;

            const grad = ctx.createLinearGradient(appX - wireWidth, topY + 12 * scale, appX + wireWidth, topY + 12 * scale);
            grad.addColorStop(0, currentMat.color); grad.addColorStop(0.5, '#ffffff'); grad.addColorStop(1, currentMat.color);
            ctx.fillStyle = grad;

            ctx.fillRect(appX - wireWidth / 2, topY + 12 * scale, wireWidth, wireTotalLen * 0.45);
            ctx.fillRect(appX - (wireWidth * neckFactor) / 2, topY + 12 * scale + wireTotalLen * 0.45, wireWidth * neckFactor, wireTotalLen * 0.1);
            ctx.fillRect(appX - wireWidth / 2, topY + 12 * scale + wireTotalLen * 0.55, wireWidth, wireTotalLen * 0.45);
        } else {
            ctx.fillStyle = currentMat.color;
            ctx.fillRect(appX - wireWidth / 2, topY + 12 * scale, wireWidth, wireTotalLen * 0.45);
            ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3.5 * scale; ctx.beginPath();
            const breakY = topY + 12 * scale + wireTotalLen * 0.48;
            ctx.moveTo(appX - wireWidth * 1.2, breakY); 
            ctx.lineTo(appX - wireWidth * 0.6, breakY + 5 * scale); 
            ctx.lineTo(appX, breakY - 5 * scale); 
            ctx.lineTo(appX + wireWidth * 0.6, breakY + 5 * scale); 
            ctx.lineTo(appX + wireWidth * 1.2, breakY); ctx.stroke();
            ctx.fillStyle = currentMat.color;
            ctx.fillRect(appX - wireWidth / 2, topY + 20 * scale + wireTotalLen * 0.55 + 25 * scale, wireWidth, wireTotalLen * 0.3);
            
            ctx.fillStyle = '#dc2626'; ctx.font = `bold ${fs(22)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('⚠ FRACTURED!', appX, topY + wireTotalLen + 110 * scale);
        }

        const hangerY = topY + 12 * scale + wireTotalLen;
        if (!physics.fractured) {
            ctx.fillStyle = '#1e293b'; ctx.fillRect(appX - 45 * scale, hangerY, 90 * scale, 10 * scale);
            const numWeights = Math.floor((force / maxForce) * 10);
            for (let i = 0; i < numWeights; i++) {
                const shade = 160 - i * 15;
                ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 15})`;
                ctx.fillRect(appX - 35 * scale, hangerY + 12 * scale + i * 14 * scale, 70 * scale, 12 * scale);
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
                ctx.strokeRect(appX - 35 * scale, hangerY + 12 * scale + i * 14 * scale, 70 * scale, 12 * scale);
            }
            if (force > 0) {
                const arrowY = hangerY + 15 * scale + numWeights * 14 * scale + 15 * scale;
                ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3.5 * scale;
                ctx.beginPath(); ctx.moveTo(appX, arrowY); ctx.lineTo(appX, arrowY + 30 * scale); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(appX - 8 * scale, arrowY + 18 * scale); ctx.lineTo(appX, arrowY + 32 * scale); ctx.lineTo(appX + 8 * scale, arrowY + 18 * scale); ctx.fillStyle = '#dc2626'; ctx.fill();
                ctx.fillStyle = '#dc2626'; ctx.font = `bold ${fs(15)}px monospace`; ctx.textAlign = 'center';
                ctx.fillText(`${Math.round(force)} N`, appX, arrowY + 55 * scale);
            }
        }

        const gW = W * 0.52;
        const gH = H * 0.65;
        const gX = W - gW - pad;
        const gY = pad * 2.8;

        ctx.fillStyle = '#ffffff'; roundRect(ctx, gX, gY, gW, gH, 16); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5; roundRect(ctx, gX, gY, gW, gH, 16); ctx.stroke();

        const gMargin = pad * 3.5;
        const gx = gX + gMargin;
        const gy = gY + pad * 1.8;
        const gw = gW - gMargin - pad * 1.5;
        const gh = gH - gMargin;

        ctx.strokeStyle = '#334155'; ctx.lineWidth = 3 * scale;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();

        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(11)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('STRAIN ε [ ΔL / L₀ ] →', gx + gw / 2, gy + gh + pad * 2.2);
        ctx.save(); ctx.translate(gx - pad * 2.2, gy + gh / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('STRESS σ (MPa) →', 0, 0); ctx.restore();

        const maxGraphStress = currentMat.fractureStress * 1.25;
        const maxGraphStrain = material === 'elastomer' ? 800 : (currentMat.fractureStress / (currentMat.Y * 2) + currentMat.ultimateStress * 0.6 / (currentMat.Y * 10)) * 1.6;

        const gGetX = (v: number) => gx + (v / maxGraphStrain) * gw;
        const gGetY = (v: number) => gy + gh - (v / maxGraphStress) * gh;

        ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.5;
        for (let i = 1; i <= 4; i++) {
            const sy = gy + gh - (gh / 4) * i;
            ctx.beginPath(); ctx.moveTo(gx, sy); ctx.lineTo(gx + gw, sy); ctx.stroke();
            const sx = gx + (gw / 4) * i;
            ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx, gy + gh); ctx.stroke();
        }

        if (graphData.length > 1) {
            ctx.strokeStyle = 'rgba(220, 38, 38, 0.2)'; ctx.lineWidth = 8 * scale;
            ctx.beginPath(); ctx.moveTo(gGetX(graphData[0].strain), gGetY(graphData[0].stress));
            graphData.forEach(pt => ctx.lineTo(gGetX(pt.strain), gGetY(pt.stress)));
            ctx.stroke();

            ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 4 * scale;
            ctx.beginPath(); ctx.moveTo(gGetX(graphData[0].strain), gGetY(graphData[0].stress));
            graphData.forEach(pt => ctx.lineTo(gGetX(pt.strain), gGetY(pt.stress)));
            ctx.stroke();

            const last = graphData[graphData.length - 1];
            ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(gGetX(last.strain), gGetY(last.stress), 7 * scale, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(gGetX(last.strain), gGetY(last.stress), 3.5 * scale, 0, Math.PI * 2); ctx.fill();
        }

        const dbW = gW;
        const dbH = H - gY - gH - pad * 2.5;
        const dbY = gY + gH + pad * 1.2;
        if (dbH > 35) {
            ctx.fillStyle = '#ffffff'; roundRect(ctx, gX, dbY, dbW, dbH, 16); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5; roundRect(ctx, gX, dbY, dbW, dbH, 16); ctx.stroke();

            const dbColW = dbW / 3;
            const metrics = [
                { label: 'STRESS (σ)', val: `${physics.stress.toFixed(1)} MPa`, color: '#dc2626' },
                { label: 'STRAIN (ε)', val: physics.strain.toFixed(4), color: '#2563eb' },
                { label: 'AREA (A)', val: `${area.toFixed(1)} mm²`, color: '#16a34a' }
            ];
            metrics.forEach((v, i) => {
                const cx = gX + i * dbColW;
                ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(10)}px sans-serif`; ctx.textAlign = 'center';
                ctx.fillText(v.label, cx + dbColW / 2, dbY + dbH * 0.4);
                ctx.fillStyle = v.color; ctx.font = `bold ${fs(19)}px monospace`;
                ctx.fillText(v.val, cx + dbColW / 2, dbY + dbH * 0.82);
            });
        }

        requestAnimationFrame(draw);
    }, [force, extension, radius, physics, currentMat, graphData, material, maxForce]);

    useEffect(() => {
        const h = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(h);
    }, [draw]);

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
                <div className="space-y-2 md:space-y-4">
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Specimen Material</label>
                        <div className="flex bg-slate-100 p-1 md:p-1.5 rounded-xl border border-slate-200 shadow-sm">
                            {(Object.keys(materials) as Array<keyof typeof materials>).map((m) => (
                                <button key={m} onClick={() => { setMaterial(m); setForce(0); }}
                                    className={`flex-1 py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm font-bold rounded-lg transition-all ${material === m
                                        ? 'bg-white text-slate-800 shadow-md border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>
                                    {materials[m].name.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2 md:space-y-4 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                            <span>🧪 Wire Radius (r)</span>
                            <span className="text-emerald-700 font-mono text-base md:text-lg bg-emerald-50 border border-emerald-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{radius.toFixed(1)} mm</span>
                        </label>
                        <input type="range" min="0.5" max="5.0" step="0.5" value={radius}
                            onChange={(e) => { setRadius(Number(e.target.value)); setForce(0); }}
                            className="w-full accent-emerald-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>

                <div className="space-y-2 md:space-y-4 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1 md:mb-2">
                        <span>⚖ Loading Force (F)</span>
                        <span className={`font-mono text-base md:text-lg px-3 py-0.5 md:py-1 rounded shadow-sm border ${physics.fractured ? 'text-white bg-red-600 border-red-500' : 'text-blue-700 bg-blue-50 border-blue-100'}`}>
                            {physics.fractured ? 'FRACTURE!' : `${Math.round(force)} N`}
                        </span>
                    </label>
                    <input type="range" min="0" max={maxForce} step={Math.max(1, Math.round(maxForce / 200))} value={force}
                        onChange={(e) => setForce(Number(e.target.value))}
                        className={`w-full h-3 md:h-4 rounded-full appearance-none cursor-pointer ${physics.fractured ? 'bg-red-100' : 'bg-slate-100'}`}
                        style={{ accentColor: physics.fractured ? '#dc2626' : '#2563eb' }} />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 md:mt-2 uppercase tracking-tight">
                        <span>Min</span><span>Limit ({maxForce} N)</span>
                    </div>
                </div>
            </div>
            <div className="flex justify-center mt-1 md:mt-2">
                <button onClick={() => setForce(0)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-8 md:px-12 py-3 md:py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-sm md:text-base shadow-sm active:scale-95">
                    <RotateCcw size={22} /> RESET SYSTEM
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

export default TensileTestCanvas;
