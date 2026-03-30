import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RotateCcw, Play, Pause, RefreshCw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ElasticPotentialEnergyLabProps {
    topic: any;
    onExit: () => void;
}

/* ─── Helpers ─── */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function arrowLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    const hl = 10;
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(a - Math.PI / 6), y2 - hl * Math.sin(a - Math.PI / 6));
    ctx.lineTo(x2 - hl * Math.cos(a + Math.PI / 6), y2 - hl * Math.sin(a + Math.PI / 6));
    ctx.closePath(); ctx.fill();
}

/* ════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════ */
const ElasticPotentialEnergyLab: React.FC<ElasticPotentialEnergyLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);
    const lastTimeRef = useRef(0);

    // Physics State
    const [k, setK] = useState(50);         // N/m
    const [mass, setMass] = useState(1.0);  // kg
    const [x, setX] = useState(0);          // m (displacement)
    const [v, setV] = useState(0);          // m/s
    const [isDragging, setIsDragging] = useState(false);
    const [isOscillating, setIsOscillating] = useState(false);
    const [permanentSet, setPermanentSet] = useState(0); // For plastic deformation
    const [maxReachedX, setMaxReachedX] = useState(0);

    const ELASTIC_LIMIT = 0.25; // m

    // Derived values
    const springForce = useMemo(() => {
        const dx = x - permanentSet;
        if (Math.abs(dx) <= ELASTIC_LIMIT) {
            return -k * dx;
        } else {
            // Non-linear / Plastic region
            const sign = Math.sign(dx);
            const linearForce = k * ELASTIC_LIMIT;
            const extra = (Math.abs(dx) - ELASTIC_LIMIT) * (k * 0.2); // softer slope
            return -sign * (linearForce + extra);
        }
    }, [x, k, permanentSet]);

    const potentialEnergy = useMemo(() => {
        const dx = x - permanentSet;
        if (Math.abs(dx) <= ELASTIC_LIMIT) {
            return 0.5 * k * dx * dx;
        } else {
            // Area under non-linear curve
            const eLimit = 0.5 * k * ELASTIC_LIMIT * ELASTIC_LIMIT;
            const extraDist = Math.abs(dx) - ELASTIC_LIMIT;
            const baseF = k * ELASTIC_LIMIT;
            // integral of (baseF + 0.2k*u) du from 0 to extraDist
            return eLimit + (baseF * extraDist + 0.5 * (k * 0.2) * extraDist * extraDist);
        }
    }, [x, k, permanentSet]);

    const kineticEnergy = 0.5 * mass * v * v;

    // Ref for animation state to avoid closure staleness
    const stateRef = useRef({ k, mass, x, v, isDragging, isOscillating, permanentSet, springForce, potentialEnergy, kineticEnergy, maxReachedX });
    useEffect(() => {
        stateRef.current = { k, mass, x, v, isDragging, isOscillating, permanentSet, springForce, potentialEnergy, kineticEnergy, maxReachedX };
    }, [k, mass, x, v, isDragging, isOscillating, permanentSet, springForce, potentialEnergy, kineticEnergy, maxReachedX]);

    // Handle Dragging
    const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const mouseX = (clientX - rect.left) * (canvas.width / rect.width);
        
        // Check if mouse is near the block (Equilibrium is at W*0.35 typically)
        // We'll calculate visual X in the draw loop, but let's estimate here
        // Current visual X = EQUILIBRIUM_BASE + x * SCALE
        const W = canvas.width;
        const eqBase = W * 0.35;
        const blockVisualX = eqBase + stateRef.current.x * 200; // 200 is scale
        
        if (Math.abs(mouseX - blockVisualX) < 80) {
            setIsDragging(true);
            setIsOscillating(false);
            setV(0);
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!stateRef.current.isDragging) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const mouseX = (clientX - rect.left) * (canvas.width / rect.width);
        
        const W = canvas.width;
        const eqBase = W * 0.35;
        let newX = (mouseX - eqBase) / 200;
        
        // Clamp to screen bounds roughly
        newX = Math.max(-0.2, Math.min(0.5, newX));
        
        setX(newX);
        if (Math.abs(newX) > maxReachedX) setMaxReachedX(Math.abs(newX));

        // Check for permanent set (plastic deformation)
        if (Math.abs(newX) > ELASTIC_LIMIT) {
            const over = Math.abs(newX) - ELASTIC_LIMIT;
            const pSet = over * 0.4 * Math.sign(newX); // 40% of over-stretch becomes permanent
            if (Math.abs(pSet) > Math.abs(permanentSet)) {
                setPermanentSet(pSet);
            }
        }
    }, [maxReachedX, permanentSet]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Resize
    useEffect(() => {
        const c = canvasRef.current; if (!c) return;
        const p = c.parentElement; if (!p) return;
        const ro = new ResizeObserver(() => { c.width = p.clientWidth; c.height = p.clientHeight; });
        ro.observe(p); c.width = p.clientWidth; c.height = p.clientHeight;
        return () => ro.disconnect();
    }, []);

    /* ════════════════════════════════════════════════════════
       DRAW & PHYSICS LOOP
       ════════════════════════════════════════════════════════ */
    const draw = useCallback((time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }

        // Time delta
        const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
        lastTimeRef.current = time;

        const s = stateRef.current;
        const sc = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);

        // --- Physics Step ---
        if (s.isOscillating && !s.isDragging) {
            const steps = 10; // Sub-steps for stability
            let curX = s.x;
            let curV = s.v;
            const subDt = Math.min(dt, 0.032) / steps;

            for (let i = 0; i < steps; i++) {
                // Force calculation
                const dx = curX - s.permanentSet;
                let F = 0;
                if (Math.abs(dx) <= ELASTIC_LIMIT) {
                    F = -s.k * dx;
                } else {
                    const sign = Math.sign(dx);
                    F = -sign * (s.k * ELASTIC_LIMIT + (Math.abs(dx) - ELASTIC_LIMIT) * (s.k * 0.2));
                }

                // Acceleration
                const a = F / s.mass;
                
                // Euler-Cromer integration
                curV += a * subDt;
                curV *= 0.9995; // Slight damping
                curX += curV * subDt;
            }
            setX(curX);
            setV(curV);
        }

        // --- Rendering ---
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        const surfaceY = H * 0.65;
        const wallX = W * 0.08;
        const eqX = W * 0.35;
        const visualX = eqX + s.x * 200 * sc;

        // ═══ ENVIRONMENT ═══
        // Wall
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(wallX - 10 * sc, surfaceY - 120 * sc, 10 * sc, 120 * sc);
        // Floor
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, surfaceY, W, 4 * sc);

        // Ruler
        const rulerY = surfaceY + 20 * sc;
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let m = -0.2; m <= 0.6; m += 0.05) {
            const rx = eqX + m * 200 * sc;
            const h = m % 0.1 === 0 ? 15 * sc : 8 * sc;
            ctx.moveTo(rx, rulerY);
            ctx.lineTo(rx, rulerY + h);
            if (m % 0.1 === 0) {
                ctx.fillStyle = '#64748b';
                ctx.font = `${10 * sc}px monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(`${(m * 100).toFixed(0)}`, rx, rulerY + 28 * sc);
            }
        }
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.fillText('cm', eqX + 0.61 * 200 * sc, rulerY + 28 * sc);

        // Danger zone highlight
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        const dZoneXLeft = eqX - 0.25 * 200 * sc;
        const dZoneXRight = eqX + 0.25 * 200 * sc;
        // Right side danger zone
        ctx.fillRect(dZoneXRight, surfaceY - 100 * sc, W - dZoneXRight, 100 * sc);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(dZoneXRight, surfaceY - 100 * sc); ctx.lineTo(dZoneXRight, surfaceY); ctx.stroke();
        ctx.setLineDash([]);

        // ═══ SPRING ═══
        // We'll calculate a 'stress intensity' for the color (0-1)
        const intensity = Math.min(Math.abs(s.x - s.permanentSet) / ELASTIC_LIMIT, 1.2);
        const colR = Math.round(59 + (intensity <= 1 ? intensity * (239 - 59) : (239 - 59)));
        const colG = Math.round(130 + (intensity <= 1 ? intensity * (68 - 130) : (68 - 130)));
        const colB = Math.round(246 + (intensity <= 1 ? intensity * (68 - 246) : (68 - 246)));
        
        ctx.strokeStyle = `rgb(${colR}, ${colG}, ${colB})`;
        ctx.lineWidth = 4 * sc;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        const springWidth = visualX - wallX; 
        const numCoils = 15;
        const coilH = 30 * sc;
        const springYBase = surfaceY - 40 * sc;
        ctx.moveTo(wallX, springYBase);
        for (let i = 0; i <= numCoils; i++) {
            const sx = wallX + (i / numCoils) * springWidth;
            const sy = springYBase + (i === 0 || i === numCoils ? 0 : (i % 2 === 0 ? coilH : -coilH));
            ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // ═══ BLOCK ═══
        const blockSize = 60 * sc;
        ctx.fillStyle = s.isDragging ? '#475569' : '#64748b';
        rr(ctx, visualX, surfaceY - blockSize, blockSize, blockSize, 4);
        ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2 * sc;
        rr(ctx, visualX, surfaceY - blockSize, blockSize, blockSize, 4);
        ctx.stroke();
        
        // Mass text on block
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${14 * sc}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${s.mass.toFixed(1)}kg`, visualX + blockSize / 2, surfaceY - blockSize / 2 + 5 * sc);

        // Energy Bars
        const barStartX = 50 * sc;
        const barStartY = H - 50 * sc;
        const maxBarH = 150 * sc;
        const maxEnergy = 30.0; // Increased to 30J to cover max possible energy (25J)

        const drawBar = (bx: number, val: number, color: string, label: string) => {
            const h = Math.min((val / maxEnergy) * maxBarH, maxBarH);
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(bx, barStartY - maxBarH, 30 * sc, maxBarH);
            ctx.fillStyle = color;
            ctx.fillRect(bx, barStartY - h, 30 * sc, h);
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
            ctx.strokeRect(bx, barStartY - maxBarH, 30 * sc, maxBarH);
            
            ctx.fillStyle = '#64748b';
            ctx.font = `bold ${10 * sc}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(label, bx + 15 * sc, barStartY + 15 * sc);
        };

        drawBar(barStartX, s.potentialEnergy, '#3b82f6', 'PE');
        drawBar(barStartX + 45 * sc, s.kineticEnergy, '#10b981', 'KE');
        drawBar(barStartX + 90 * sc, s.potentialEnergy + s.kineticEnergy, '#8b5cf6', 'Total');

        // ═══ LIVE GRAPH (Top Right) ═══
        const gW = 240 * sc, gH = 180 * sc;
        const gX = W - gW - 20 * sc, gY = 20 * sc;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        rr(ctx, gX, gY, gW, gH, 8); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
        rr(ctx, gX, gY, gW, gH, 8); ctx.stroke();

        // Axes
        const gx0 = gX + 40 * sc, gy0 = gY + gH - 35 * sc;
        const gaw = gW - 55 * sc, gah = gH - 55 * sc;
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
        arrowLine(ctx, gx0, gy0, gx0 + gaw, gy0); // x-axis
        arrowLine(ctx, gx0, gy0, gx0, gy0 - gah); // y-axis
        
        ctx.fillStyle = '#64748b';
        ctx.font = `${9 * sc}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('x', gx0 + gaw, gy0 + 12 * sc);
        ctx.fillText('F', gx0 - 12 * sc, gy0 - gah);

        const MAX_F_DISPLAY = 110; // Max Force displayed on graph (N)
        const MAX_X_DISPLAY = 0.6;   // Max displacement displayed on graph (m)

        // Theoretical Curve
        ctx.beginPath();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.moveTo(gx0, gy0);
        for (let ix = 0; ix <= 100; ix++) {
            const dx = (ix / 100) * MAX_X_DISPLAY;
            const fx = dx * s.k;
            ctx.lineTo(gx0 + (dx / MAX_X_DISPLAY) * (gaw - 5), gy0 - (fx / MAX_F_DISPLAY) * (gah - 5));
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Active shaded triangle / curve
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.beginPath();
        ctx.moveTo(gx0, gy0);
        const steps = 40;
        const absX = Math.abs(s.x);
        for (let i = 0; i <= steps; i++) {
            const px = (i / steps) * absX;
            const pdx = px - (s.x > 0 ? s.permanentSet : -s.permanentSet);
            let pf = 0;
            const stiffnessK = s.k;
            const checkDX = Math.abs(pdx);
            
            if (checkDX <= ELASTIC_LIMIT) pf = stiffnessK * checkDX;
            else {
                pf = stiffnessK * ELASTIC_LIMIT + (checkDX - ELASTIC_LIMIT) * (stiffnessK * 0.2);
            }
            ctx.lineTo(gx0 + (px / MAX_X_DISPLAY) * (gaw - 5), gy0 - (pf / MAX_F_DISPLAY) * (gah - 5));
        }
        ctx.lineTo(gx0 + (absX / MAX_X_DISPLAY) * (gaw - 5), gy0);
        ctx.closePath();
        ctx.fill();

        // Active point dot
        const dotX = gx0 + (absX / MAX_X_DISPLAY) * (gaw - 5);
        const dotY = gy0 - (Math.abs(s.springForce) / MAX_F_DISPLAY) * (gah - 5);
        if (absX > 0) {
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath(); ctx.arc(dotX, dotY, 4 * sc, 0, Math.PI * 2); ctx.fill();
        }

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, [draw]);

    /* ════════ JSX ════════ */
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col"
             onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
             onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}>
            
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
                
                {/* Visual Overlays */}
                <div className="absolute left-6 top-24 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-blue-100 shadow-sm">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">Displacement (x)</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-mono font-bold text-blue-600">{(x * 100).toFixed(1)}</span>
                            <span className="text-xs text-blue-400 font-bold">cm</span>
                        </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-red-100 shadow-sm">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-0.5">Spring Force (F)</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-mono font-bold text-red-600">{Math.abs(springForce).toFixed(1)}</span>
                            <span className="text-xs text-red-400 font-bold">N</span>
                        </div>
                    </div>
                    {permanentSet !== 0 && (
                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 animate-pulse">
                            <span className="text-[9px] font-bold text-amber-600 block">⚠ PLASTIC DEFORMATION</span>
                            <span className="text-[10px] text-amber-500 font-mono">Set: {(permanentSet * 100).toFixed(1)} cm</span>
                        </div>
                    )}
                </div>

                <div className="absolute right-6 top-64 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-purple-100 shadow-sm flex flex-col items-center">
                   <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">Potential Energy (U)</span>
                   <span className="text-2xl font-mono font-bold text-purple-600">{potentialEnergy.toFixed(3)} J</span>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                       <div className="h-full bg-purple-500 transition-all duration-75" style={{ width: `${Math.min((potentialEnergy / 30) * 100, 100)}%` }} />
                   </div>
                </div>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col md:flex-row gap-4 w-full text-slate-700">
            <div className="flex-1 space-y-3">
                {/* Spring Constant */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase">Spring Constant (k)</span>
                        <span className="text-sm font-mono font-bold text-blue-600">{k} N/m</span>
                    </div>
                    <input type="range" min="10" max="200" step="10" value={k}
                        onChange={e => setK(Number(e.target.value))}
                        className="w-full accent-blue-500 h-2 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                        <span>SOFT (10)</span>
                        <span>STIFF (200)</span>
                    </div>
                </div>

                {/* Mass */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase">Block Mass (m)</span>
                        <span className="text-sm font-mono font-bold text-emerald-600">{mass.toFixed(1)} kg</span>
                    </div>
                    <input type="range" min="0.5" max="5.0" step="0.5" value={mass}
                        onChange={e => setMass(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-2 cursor-pointer" />
                </div>
            </div>

            <div className="flex-non w-full md:w-48 flex flex-col gap-2">
                <button onClick={() => setIsOscillating(!isOscillating)}
                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${isOscillating ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
                    {isOscillating ? <><Pause size={20} /> PAUSE</> : <><Play size={20} /> RELEASE</>}
                </button>
                
                <button onClick={() => { setX(0); setV(0); setIsOscillating(false); setPermanentSet(0); setMaxReachedX(0); }}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl border border-slate-200 font-bold text-sm transition-all active:scale-95">
                    <RefreshCw size={16} /> RESET SYSTEM
                </button>

                <p className="text-[10px] text-slate-400 font-medium italic text-center px-2">
                    Drag the block to stretch, or release to see oscillation energy transfer.
                </p>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

export default ElasticPotentialEnergyLab;
