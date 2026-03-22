import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Factory, Zap, GitCommit } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PolymerLabProps {
    topic: any;
    onExit: () => void;
}

const PolymerLab: React.FC<PolymerLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const startTime = useRef(Date.now());

    const [polymerConfig, setPolymerConfig] = useState<{ mode: 'addition' | 'condensation' }>({
        mode: 'addition'
    });

    const handleReset = useCallback(() => {
        startTime.current = Date.now();
    }, []);

    // ─── ResizeObserver ───
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const ro = new ResizeObserver(() => { });
        ro.observe(parent);
        return () => ro.disconnect();
    }, []);

    // ─── Main Render ───
    useEffect(() => {
        const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const parent = canvas.parentElement;
            if (!parent) return;

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

            const logicalWidth = 800;
            const logicalHeight = 500;

            const scaleX = displayWidth / logicalWidth;
            const scaleY = displayHeight / logicalHeight;
            const drawScale = Math.min(scaleX, scaleY);

            const offsetX = (displayWidth - logicalWidth * drawScale) / 2;
            const offsetY = (displayHeight - logicalHeight * drawScale) / 2;

            ctx.translate(offsetX, offsetY);
            ctx.scale(drawScale, drawScale);

            // Rich radial gradient background
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);
            const bgGrad = ctx.createRadialGradient(logicalWidth / 2, logicalHeight / 2, 0, logicalWidth / 2, logicalHeight / 2, logicalWidth);
            bgGrad.addColorStop(0, '#ffffff');
            bgGrad.addColorStop(1, '#f1f5f9');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);

            // Soft border
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, logicalWidth, logicalHeight);

            const time = (Date.now() - startTime.current) / 1000;

            if (polymerConfig.mode === 'addition') {
                // ZIEGLER-NATTA CATALYSIS VISUALIZATION
                const catX = 200;
                const catY = 250;

                // Draw Catalyst Surface
                ctx.fillStyle = '#94a3b8';
                ctx.beginPath();
                ctx.moveTo(100, 300);
                ctx.lineTo(300, 300);
                ctx.lineTo(250, 400);
                ctx.lineTo(150, 400);
                ctx.fill();
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText("Catalyst Surface", 140, 350);

                // Active Site (Ti)
                ctx.beginPath();
                ctx.arc(catX, catY, 20, 0, Math.PI * 2);
                ctx.fillStyle = '#f59e0b';
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText("Ti", catX, catY + 5);

                // Growing Chain (Polymer)
                const unitCount = Math.floor(time * 2) % 15 + 1;

                ctx.beginPath();
                ctx.moveTo(catX, catY);

                for (let i = 0; i < unitCount; i++) {
                    const x = catX + i * 30;
                    const y = catY - i * 15 - Math.sin(i * 1.5) * 15;
                    ctx.lineTo(x, y);

                    // Draw Monomer Unit on Chain
                    ctx.beginPath();
                    ctx.arc(x, y, 10, 0, Math.PI * 2);
                    ctx.fillStyle = i === 0 ? '#ef4444' : '#3b82f6';
                    ctx.fill();
                    ctx.moveTo(x, y);
                }
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 4;
                ctx.stroke();

                // Floating Monomers (Ethylene)
                const monoProgress = (time * 1.5) % 1;
                const monoX = 600 - monoProgress * 400;
                const monoY = 100 + monoProgress * 150;

                if (monoProgress < 0.9) {
                    ctx.beginPath();
                    ctx.arc(monoX, monoY, 16, 0, Math.PI * 2);

                    const monoGrad = ctx.createRadialGradient(monoX - 4, monoY - 4, 2, monoX, monoY, 16);
                    monoGrad.addColorStop(0, '#fca5a5');
                    monoGrad.addColorStop(1, '#ef4444');
                    ctx.fillStyle = monoGrad;
                    ctx.fill();

                    ctx.strokeStyle = '#b91c1c';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText("C₂H₄", monoX, monoY + 3);
                }

                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 22px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText("Addition Polymerization (Ziegler-Natta)", 30, 40);
                ctx.font = '16px sans-serif';
                ctx.fillStyle = '#64748b';
                ctx.fillText("Active site inserts monomer into growing chain", 30, 65);

            } else {
                // CONDENSATION POLYMERIZATION
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 22px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText("Condensation Polymerization (e.g., Nylon 6,6)", 30, 40);
                ctx.font = '16px sans-serif';
                ctx.fillStyle = '#64748b';
                ctx.fillText("Monomers combine with the loss of small molecules (like H₂O)", 30, 65);

                const getX = (i: number) => 100 + i * 70;
                const y = 250;

                const count = Math.floor(time * 1.5) % 8 + 1; // 1 to 8 units

                for(let i=0; i<count; i++) {
                    const x = getX(i);
                    // Draw monomer A or B
                    ctx.beginPath();
                    ctx.roundRect(x - 30, y - 20, 60, 40, 6);
                    ctx.fillStyle = i % 2 === 0 ? '#3b82f6' : '#ef4444';
                    ctx.fill();
                    
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(i % 2 === 0 ? "A" : "B", x, y);
                    
                    if (i > 0) {
                        // Draw bond
                        ctx.beginPath();
                        ctx.moveTo(getX(i-1) + 30, y);
                        ctx.lineTo(x - 30, y);
                        ctx.strokeStyle = '#1e293b';
                        ctx.lineWidth = 4;
                        ctx.stroke();

                        // Water molecule leaving animation for the most recent bond
                        if (i === count - 1) {
                            const waterProgress = (time * 1.5) % 1;
                            const wx = x - 35;
                            const wy = y - 25 - waterProgress * 80;
                            ctx.globalAlpha = 1 - waterProgress;
                            ctx.fillStyle = '#0ea5e9';
                            ctx.font = 'bold 16px sans-serif';
                            ctx.fillText("💦 H₂O", wx, wy);
                            ctx.globalAlpha = 1.0;
                        }
                    }
                }
            }

            ctx.restore();
            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [polymerConfig]);

    // ─── JSX ───
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 overflow-hidden rounded-2xl border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 touch-none" />
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full w-full">
            <div className="flex bg-slate-50 border-b border-slate-200 p-4 gap-2 rounded-t-xl shrink-0">
                <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
                    <GitCommit className="text-pink-500" size={20} />
                    Polymer Properties
                </h3>
            </div>

            <div className="p-4 flex flex-col gap-4 w-full flex-1 overflow-y-auto max-h-[35vh] lg:max-h-[350px]">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setPolymerConfig({ mode: 'addition' }); handleReset(); }}
                            className={`p-4 flex flex-col items-center justify-center rounded-xl font-bold text-sm border-2 transition-all gap-2 ${polymerConfig.mode === 'addition' ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Factory size={24} />
                            <span>Addition Polymerization</span>
                        </button>
                        <button
                            onClick={() => { setPolymerConfig({ mode: 'condensation' }); handleReset(); }}
                            className={`p-4 flex flex-col items-center justify-center rounded-xl font-bold text-sm border-2 transition-all gap-2 ${polymerConfig.mode === 'condensation' ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <GitCommit size={24} />
                            <span>Condensation Polymerization</span>
                        </button>
                    </div>
                </div>

                {/* Explanatory Box based on combination */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-sm shadow-inner mt-4">
                    {polymerConfig.mode === 'addition' ? (
                        <div className="space-y-3 text-slate-700">
                            <h4 className="font-bold text-slate-800 text-base">Addition Polymerization (Chain Growth)</h4>
                            <p>
                                Molecules of the same or different monomers add together on a large scale to form a polymer, without the elimination of any byproduct molecules.
                            </p>
                            <p>
                                <strong>Example:</strong> Formation of Polyethylene from ethylene using a Ziegler-Natta Catalyst [TiCl₄ + Al(C₂H₅)₃].
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 text-slate-700">
                            <h4 className="font-bold text-slate-800 text-base">Condensation Polymerization (Step Growth)</h4>
                            <p>
                                Involves a repetitive condensation reaction between two bi-functional monomers. This process results in the loss of simple molecules such as water, alcohol, etc.
                            </p>
                            <p>
                                <strong>Example:</strong> Formation of Nylon 6,6 from hexamethylenediamine and adipic acid, accompanied by the removal of H₂O molecules.
                            </p>
                        </div>
                    )}
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

export default PolymerLab;
