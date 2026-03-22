import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RotateCcw, Thermometer, Zap, Users, Shuffle } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

// Local Simulation config interfaces
interface SimulationConfig {
    temperature: number;
    activationEnergy: number;
    stericFactor: number;
    moleculeCount: number;
}
enum MoleculeState { REACTANT, PRODUCT }
interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    state: MoleculeState;
    angle: number;
    energy: number;
}

interface CollisionTheoryLabProps {
    topic: any;
    onExit: () => void;
}

const CollisionTheoryLab: React.FC<CollisionTheoryLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const particlesRef = useRef<Particle[]>([]);

    // Extracted state from App.tsx
    const [config, setConfig] = useState<SimulationConfig>({
        temperature: 300,
        activationEnergy: 120,
        stericFactor: 0.5,
        moleculeCount: 25
    });
    const [reactionCount, setReactionCount] = useState(0);
    const reactionCountRef = useRef(0);

    const handleReset = useCallback(() => {
        setConfig({
            temperature: 300,
            activationEnergy: 120,
            stericFactor: 0.5,
            moleculeCount: 25
        });
        // Component will re-initialize particles because of config ref changes in useEffect
    }, []);

    // ─── Initialize Particles ───
    useEffect(() => {
        const logicalWidth = 800;
        const logicalHeight = 500;

        const count = config.moleculeCount;
        const newParticles: Particle[] = [];
        reactionCountRef.current = 0;
        setReactionCount(0);

        for (let i = 0; i < count; i++) {
            const speed = (Math.random() * 0.5 + 0.5) * Math.sqrt(config.temperature / 100);
            const angle = Math.random() * Math.PI * 2;

            newParticles.push({
                id: i,
                x: Math.random() * 600, // Reduced from logicalWidth to fit graph
                y: Math.random() * 500,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 10,
                state: MoleculeState.REACTANT,
                angle: Math.random() * Math.PI * 2,
                energy: speed * speed * 50
            });
        }
        particlesRef.current = newParticles;
    }, [config.moleculeCount, config.temperature]);

    // ─── ResizeObserver ───
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const ro = new ResizeObserver(() => {
            // We're handling scaling differently here (using logical coords)
            // But we can trigger a forced redraw if needed or rely on the animation loop.
        });
        ro.observe(parent);
        return () => ro.disconnect();
    }, []);

    // ─── Main Render & Physics ───
    const updatePhysics = (width: number, height: number, currentConfig: SimulationConfig) => {
        const particles = particlesRef.current;

        // 1. Move
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.angle += 0.05;

            if (p.x < p.radius) { p.x = p.radius; p.vx *= -1; }
            if (p.x > 600 - p.radius) { p.x = 600 - p.radius; p.vx *= -1; } // Restrict to left partition
            if (p.y < p.radius) { p.y = p.radius; p.vy *= -1; }
            if (p.y > height - p.radius) { p.y = height - p.radius; p.vy *= -1; }
        });

        // 2. Collision
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < p1.radius + p2.radius) {
                    const overlap = (p1.radius + p2.radius - dist) / 2;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    p1.x -= nx * overlap;
                    p1.y -= ny * overlap;
                    p2.x += nx * overlap;
                    p2.y += ny * overlap;

                    const dvx = p2.vx - p1.vx;
                    const dvy = p2.vy - p1.vy;
                    const velAlongNormal = dvx * nx + dvy * ny;

                    if (velAlongNormal > 0) continue;

                    const impulse = velAlongNormal;
                    p1.vx += impulse * nx;
                    p1.vy += impulse * ny;
                    p2.vx -= impulse * nx;
                    p2.vy -= impulse * ny;

                    // Reaction Logic
                    const collisionEnergy = p1.energy + p2.energy;
                    const orientationSuccess = Math.random() < currentConfig.stericFactor;

                    if (
                        p1.state === MoleculeState.REACTANT &&
                        p2.state === MoleculeState.REACTANT &&
                        collisionEnergy >= currentConfig.activationEnergy &&
                        orientationSuccess
                    ) {
                        p1.state = MoleculeState.PRODUCT;
                        p2.state = MoleculeState.PRODUCT;
                        reactionCountRef.current += 1;
                        setReactionCount(reactionCountRef.current);
                    }
                }
            }
        }
    };

    const draw = (currentConfig: SimulationConfig) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        // Use parent dimensions for crisp rendering
        const displayWidth = parent.clientWidth;
        const displayHeight = parent.clientHeight;

        const dpr = window.devicePixelRatio || 1;

        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
            canvas.width = displayWidth * dpr;
            canvas.height = displayHeight * dpr;
        }
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';

        ctx.save();
        ctx.scale(dpr, dpr);

        const logicalWidth = 1000; // Increased width to fit graph
        const logicalHeight = 500;

        // Scale the drawing to fit the canvas proportionally
        const scaleX = displayWidth / logicalWidth;
        const scaleY = displayHeight / logicalHeight;
        const drawScale = Math.min(scaleX, scaleY);

        // Center the logical canvas inside the actual canvas
        const offsetX = (displayWidth - logicalWidth * drawScale) / 2;
        const offsetY = (displayHeight - logicalHeight * drawScale) / 2;

        ctx.translate(offsetX, offsetY);
        ctx.scale(drawScale, drawScale);

        updatePhysics(logicalWidth, logicalHeight, currentConfig);

        // Background / Container
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);

        // Rich radial gradient background
        const bgGrad = ctx.createRadialGradient(logicalWidth / 2, logicalHeight / 2, 0, logicalWidth / 2, logicalHeight / 2, logicalWidth);
        bgGrad.addColorStop(0, '#ffffff');
        bgGrad.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // Container Border for particles
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 600, logicalHeight);

        // Draw a soft grid for scientific feel (only in particles area)
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1;
        for (let x = 0; x < 600; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, logicalHeight); ctx.stroke(); }
        for (let y = 0; y < logicalHeight; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke(); }

        // --- GRAPH PANEL ---
        const gx = 660;
        const gy = 80;
        const gw = 280;
        const gh = 300;
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Energy Profile", gx + gw/2, gy - 25);
        
        // Axes
        ctx.beginPath();
        ctx.moveTo(gx, gy + gh);
        ctx.lineTo(gx + gw, gy + gh); // X axis
        ctx.moveTo(gx, gy + gh);
        ctx.lineTo(gx, gy - 10); // Y axis
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText("Reaction Coordinate", gx + gw/2, gy + gh + 45);
        ctx.save(); ctx.translate(gx - 45, gy + gh/2); ctx.rotate(-Math.PI/2); ctx.fillText("Potential Energy", 0,0); ctx.restore();

        const eReactant = gy + gh - 80;
        const eProduct = gy + gh - 40; // Exothermic
        // Peak is purely visual representation of Ea
        const ePeak = eReactant - currentConfig.activationEnergy;

        // Energy Curve
        ctx.beginPath();
        ctx.moveTo(gx, eReactant);
        ctx.lineTo(gx + 40, eReactant);
        ctx.bezierCurveTo(gx + 100, eReactant, gx + 90, ePeak, gx + 140, ePeak);
        ctx.bezierCurveTo(gx + 190, ePeak, gx + 180, eProduct, gx + 240, eProduct);
        ctx.lineTo(gx + gw, eProduct);
        
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Activation Energy (Ea) marker
        ctx.beginPath(); ctx.moveTo(gx + 140, eReactant); ctx.lineTo(gx + 140, ePeak);
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([5,5]); ctx.stroke(); ctx.setLineDash([]);
        
        // Label Ea explicitly
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign='left';
        ctx.fillText(`Ea`, gx + 150, (eReactant + ePeak)/2 + 5);

        // Average Kinetic Energy Line
        // Maps 100K-600K range to a visual height on the graph
        const keY = gy + gh - (currentConfig.temperature * 0.25);
        ctx.beginPath(); ctx.moveTo(gx, keY); ctx.lineTo(gx + gw, keY);
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([8,6]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign='right';
        ctx.fillText(`Avg Kinetic Energy (${currentConfig.temperature}K)`, gx + gw, keY - 10);
        ctx.textAlign = 'center'; // reset

        // Particles
        particlesRef.current.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);

            ctx.beginPath();
            if (p.state === MoleculeState.PRODUCT) {
                // Energetic Red/Orange Product
                const pGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, p.radius);
                pGrad.addColorStop(0, '#fca5a5');
                pGrad.addColorStop(1, '#ef4444');
                ctx.fillStyle = pGrad;
                ctx.strokeStyle = '#b91c1c';

                // Add a permanent soft glow to products
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
            } else {
                // Cool Blue Reactant
                const pGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, p.radius);
                pGrad.addColorStop(0, '#93c5fd');
                pGrad.addColorStop(1, '#3b82f6');
                ctx.fillStyle = pGrad;
                ctx.strokeStyle = '#1d4ed8';
            }

            // Draw a more complex diatomic molecule shape
            ctx.arc(-6, 0, p.radius * 0.9, 0, Math.PI * 2);
            ctx.arc(6, 0, p.radius * 0.9, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0; // reset for stroke
            ctx.lineWidth = 2;
            ctx.stroke();

            // Sizzling glow for high energy reactants (close to Ea)
            if (p.state === MoleculeState.REACTANT && p.energy > currentConfig.activationEnergy * 0.8) {
                const glowIntensity = Math.min(25, (p.energy - currentConfig.activationEnergy * 0.8) * 0.5);
                ctx.shadowBlur = glowIntensity;
                ctx.shadowColor = '#fbbf24';
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            ctx.restore();
        });

        ctx.restore();
    };

    // Use a ref for config so the animation loop always has the latest without recreating the loop
    const configRef = useRef(config);
    useEffect(() => { configRef.current = config; }, [config]);

    useEffect(() => {
        const animate = () => {
            draw(configRef.current);
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // ─── JSX ───
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 overflow-hidden rounded-2xl border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

                {/* Overlay Dashboard */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm p-3 rounded-xl pointer-events-none">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-100 pb-1">Live Feed</div>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-sm font-medium text-slate-600">Total Molecules:</span>
                            <span className="font-mono font-bold text-slate-800">{config.moleculeCount}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Reactants:
                            </span>
                            <span className="font-mono font-bold text-blue-600">{config.moleculeCount - reactionCount * 2}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span> Products:
                            </span>
                            <span className="font-mono font-bold text-red-600">{reactionCount * 2}</span>
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full w-full">
            <div className="flex bg-slate-50 border-b border-slate-200 p-4 gap-2 rounded-t-xl shrink-0">
                <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Shuffle className="text-blue-500" size={20} />
                    Collision Theory Parameters
                </h3>
            </div>

            <div className="p-4 flex flex-col gap-4 w-full flex-1 overflow-y-auto max-h-[35vh] lg:max-h-[350px]">
                <div className="text-center p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-sm">
                    For a reaction to occur, molecules must collide with energy greater than the <strong>Activation Energy (Ea)</strong> and with proper orientation (controlled by <strong>Steric Factor P</strong>).
                </div>

                <div className="space-y-6">
                    {/* Temperature Presets */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">
                            <Thermometer size={16} className="text-orange-500" /> Temperature
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[{t: 100, label: "Cold"}, {t: 300, label: "Room"}, {t: 500, label: "Hot"}].map(temp => (
                                <button
                                    key={temp.t}
                                    onClick={() => setConfig({ ...config, temperature: temp.t })}
                                    className={`p-2 rounded-lg text-sm font-bold border-2 transition-all ${config.temperature === temp.t ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {temp.label} <br/>
                                    <span className="text-xs opacity-75">{temp.t}K</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activation Energy Presets */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">
                            <Zap size={16} className="text-purple-500" /> Activation Energy (Ea)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[{e: 60, label: "Low"}, {e: 120, label: "Med"}, {e: 200, label: "High"}].map(ea => (
                                <button
                                    key={ea.e}
                                    onClick={() => setConfig({ ...config, activationEnergy: ea.e })}
                                    className={`p-2 rounded-lg text-sm font-bold border-2 transition-all ${config.activationEnergy === ea.e ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {ea.label} <br/>
                                    <span className="text-xs opacity-75">{ea.e}J</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Simple Steric Factor Toggle */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-600 uppercase">Orientation Success</label>
                        <div className="flex bg-slate-100 rounded-xl p-1">
                            <button
                                onClick={() => setConfig({ ...config, stericFactor: 0.1 })}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${config.stericFactor === 0.1 ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                            >
                                Strict (P=0.1)
                            </button>
                            <button
                                onClick={() => setConfig({ ...config, stericFactor: 1.0 })}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${config.stericFactor === 1.0 ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                            >
                                Any Angle (P=1)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
        />
    );
};

export default CollisionTheoryLab;
