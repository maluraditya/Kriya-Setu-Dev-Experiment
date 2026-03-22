import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, Zap, X } from 'lucide-react';

// Energy level calculations (eV) based on E_n = -13.6 / n^2
const calculateEnergy = (n: number) => -13.6 / (n * n);

// Calculate wavelength in nm: lambda = hc / Delta E
// hc approx 1240 eV nm
const calculateWavelength = (deltaE: number) => Math.abs(1240 / deltaE);

// Determine color based on wavelength
const getWavelengthColor = (lambda: number) => {
    if (lambda < 400) return '#a855f7'; // Purple/UV
    if (lambda >= 400 && lambda < 440) return '#8b5cf6'; // Violet
    if (lambda >= 440 && lambda < 490) return '#3b82f6'; // Blue
    if (lambda >= 490 && lambda < 510) return '#06b6d4'; // Cyan
    if (lambda >= 510 && lambda < 580) return '#22c55e'; // Green
    if (lambda >= 580 && lambda < 600) return '#eab308'; // Yellow
    if (lambda >= 600 && lambda < 650) return '#f97316'; // Orange
    if (lambda >= 650 && lambda <= 750) return '#ef4444'; // Red
    return '#94a3b8'; // Infrared/Gray
};

const getSeriesName = (finalN: number) => {
    switch (finalN) {
        case 1: return 'Lyman Series (UV)';
        case 2: return 'Balmer Series (Visible)';
        case 3: return 'Paschen Series (IR)';
        case 4: return 'Brackett Series (IR)';
        case 5: return 'Pfund Series (IR)';
        default: return 'Infrared';
    }
};

import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface SpectralLine {
    id: number;
    wavelength: number;
    color: string;
    series: string;
    initialN: number;
    finalN: number;
}

interface Props {
    topic: Topic;
    onExit: () => void;
}

const HydrogenSpectrumLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentN, setCurrentN] = useState<number>(1);
    const [targetLevel, setTargetLevel] = useState<number>(2);
    const [spectralLines, setSpectralLines] = useState<SpectralLine[]>([]);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    // Radii for orbits (Bohr model r_n propto n^2, but we scale it non-linearly for UI)
    const maxN = 6;
    const getOrbitRadius = (n: number, maxRadius: number) => {
        // scale to fit visually
        return (maxRadius * Math.pow(n, 1.2)) / Math.pow(maxN, 1.2);
    };

    const drawModel = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // We don't want to clear the whole canvas if we're just drawing over it every frame, but we have to.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.9;

        // Draw Nucleus
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#facc15'; // yellow nucleus
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#facc15';
        ctx.closePath();
        ctx.shadowBlur = 0;

        // Draw Orbits
        for (let n = 1; n <= maxN; n++) {
            const radius = getOrbitRadius(n, maxRadius);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = n === currentN ? '#38bdf8' : 'rgba(51, 65, 85, 0.4)'; // Dimmer unselected orbits
            ctx.lineWidth = n === currentN ? 2 : 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.closePath();

            // Label
            if (n === 1 || n === maxN || n === currentN) {
                ctx.fillStyle = n === currentN ? '#38bdf8' : '#64748b';
                ctx.font = '12px monospace';
                ctx.fillText(`n=${n}`, centerX + radius + 4, centerY);
            }
        }
        ctx.setLineDash([]); // reset

        // Draw Electron
        const electronRadius = getOrbitRadius(currentN, maxRadius);
        const time = Date.now() / 1000;
        const angle = time * (3 / currentN); // slower rotation for higher orbits
        const electronX = centerX + electronRadius * Math.cos(angle);
        const electronY = centerY + electronRadius * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(electronX, electronY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#38bdf8';
        ctx.closePath();
        ctx.shadowBlur = 0;
    };

    useEffect(() => {
        let animationFrameId: number;
        const render = () => {
            drawModel();
            animationFrameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [currentN]);

    useEffect(() => {
        if (targetLevel <= currentN && currentN < maxN) {
            setTargetLevel(currentN + 1);
        }
    }, [currentN, maxN]);

    // Make sure canvas size is responsive
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                if (parent) {
                    canvasRef.current.width = parent.clientWidth;
                    canvasRef.current.height = parent.clientHeight;
                }
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleFirePhoton = (targetOverride?: number) => {
        if (isAnimating) return;

        const target = targetOverride || targetLevel;
        if (target <= currentN || target > maxN) {
            showAlert("Please select a higher orbit to jump to.");
            return;
        }

        setIsAnimating(true);
        setTimeout(() => {
            setCurrentN(target);
            setIsAnimating(false);
        }, 500); // UI feedback delay
    };

    const handleDeexcite = (targetN: number) => {
        if (isAnimating || targetN >= currentN) return;

        setIsAnimating(true);
        const initialE = calculateEnergy(currentN);
        const finalE = calculateEnergy(targetN);
        const deltaE = initialE - finalE;
        const wavelength = calculateWavelength(deltaE);
        const color = getWavelengthColor(wavelength);

        const newLine: SpectralLine = {
            id: Date.now(),
            wavelength: Math.round(wavelength),
            color,
            series: getSeriesName(targetN),
            initialN: currentN,
            finalN: targetN
        };

        setTimeout(() => {
            setSpectralLines(prev => [...prev, newLine]);
            setCurrentN(targetN);
            setIsAnimating(false);
        }, 500);
    };

    const showAlert = (msg: string) => {
        setAlertMessage(msg);
        setIsAlertVisible(true);
        setTimeout(() => setIsAlertVisible(false), 4000);
    };

    const clearSpectrum = () => setSpectralLines([]);

    const statusBadge = (
        <div className="flex flex-col items-center justify-center px-4 py-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Electron State</div>
            <div className="flex gap-4 items-end">
                <div className="text-center">
                    <span className="text-2xl font-mono font-bold text-white">n={currentN}</span>
                </div>
                <div className="w-px h-6 bg-slate-700" />
                <div className="text-center">
                    <span className="text-lg font-mono font-bold text-emerald-400">{calculateEnergy(currentN).toFixed(2)} eV</span>
                </div>
            </div>
        </div>
    );

    const handleReset = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentN(1);
            setSpectralLines([]);
            setIsAnimating(false);
        }, 300);
    };

    const controlsCombo = (
        <div className="w-full flex justify-between gap-6 p-2">
            {/* Absorption */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="text-[10px] uppercase font-bold text-amber-500 tracking-widest mb-3 flex items-center gap-1"><Zap size={12} /> Excite Electron (Jump Up)</div>
                {currentN === maxN ? (
                    <div className="text-sm font-bold text-amber-500/80 bg-slate-900 border border-amber-500/20 px-4 py-3 rounded-xl text-center">
                        Highest orbit reached. Cannot excite further.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {[...Array(maxN)].map((_, i) => {
                            const n = i + 1;
                            if (n <= currentN) return null;
                            const energyReq = (calculateEnergy(n) - calculateEnergy(currentN)).toFixed(2);
                            return (
                                <button key={n} onClick={() => { setTargetLevel(n); handleFirePhoton(); }} disabled={isAnimating}
                                    className="bg-slate-800 hover:bg-amber-500 hover:text-slate-900 text-amber-400 font-bold px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-slate-700 hover:border-amber-400 text-xs flex flex-col items-center">
                                    <span>Jump to n={n}</span>
                                    <span className="text-[9px] opacity-70">+{energyReq} eV</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="w-px bg-slate-700/50 hidden md:block" />

            {/* Emission */}
            <div className="flex-[1.2] flex flex-col justify-center">
                <div className="text-[10px] uppercase font-bold text-brand-secondary tracking-widest mb-3 flex items-center justify-between">
                    <span><ArrowDown size={12} className="inline mr-1" /> Emit Photon (Drop Down)</span>
                </div>
                {currentN === 1 ? (
                    <div className="text-sm font-bold text-brand-secondary/80 bg-slate-900 border border-brand-secondary/20 px-4 py-3 rounded-xl text-center">
                        Ground state reached. Cannot drop further.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {[...Array(maxN - 1)].map((_, i) => {
                            const targetN = i + 1;
                            if (targetN >= currentN) return null;
                            return (
                                <button key={targetN} onClick={() => handleDeexcite(targetN)} disabled={isAnimating}
                                    className="flex flex-col items-center bg-slate-800 hover:bg-brand-secondary hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-700 hover:border-brand-secondary transition-all font-bold text-brand-secondary text-xs">
                                    <span>Drop to n={targetN}</span>
                                    <span className="text-[9px] opacity-70">Emit {getSeriesName(targetN).split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="w-px bg-slate-700/50 hidden md:block" />

            {/* Reset */}
            <div className="flex flex-col justify-center gap-2">
                <button onClick={handleReset} disabled={isAnimating || (currentN === 1 && spectralLines.length === 0)}
                    className="flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 px-4 py-3 rounded-lg border border-slate-700 transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed h-full">
                    <X size={16} />
                    <span>RESET</span>
                </button>
            </div>
        </div>
    );

    const simulationCombo = (
        <div className="w-full h-full flex flex-col relative">
            {isAlertVisible && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-xl backdrop-blur flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <Zap size={20} />
                    <span className="font-semibold text-sm text-center">{alertMessage}</span>
                </div>
            )}

            <div className="flex-1 relative w-full flex items-center justify-center min-h-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20 rounded-t-3xl mask-image:linear-gradient(to_bottom,black,transparent)"></div>
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            <div className="h-28 lg:h-32 w-full bg-slate-950/80 backdrop-blur-md border-t border-white/10 relative shrink-0 rounded-b-3xl">
                <button onClick={clearSpectrum} className="absolute top-2 right-4 z-10 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600 shadow-sm cursor-pointer">
                    Clear Spectrometer
                </button>
                <div className="absolute right-4 bottom-2 text-[9px] text-slate-600 font-bold uppercase tracking-widest"><Zap size={10} className="inline mr-1" />Spectrometer Array</div>

                <div className="flex-1 relative mx-[5%] border-x border-slate-800 bg-black/50 mt-4 mb-3 h-16 lg:h-20 overflow-visible rounded-sm pt-4">
                    <div className="absolute inset-0 opacity-20 pointer-events-none rounded-sm"
                        style={{ background: 'linear-gradient(to right, transparent 0%, #a855f7 15%, #3b82f6 30%, #22c55e 50%, #eab308 65%, #ef4444 80%, transparent 100%)' }}>
                    </div>

                    <div className="absolute bottom-0 w-full flex justify-between px-2 text-[9px] text-slate-500 pb-1 font-bold tracking-widest uppercase">
                        <span>UV (100nm)</span>
                        <span>Visible (400-700nm)</span>
                        <span>IR (1000nm+)</span>
                    </div>

                    {spectralLines.map((line) => {
                        const minWl = 90;
                        const maxWl = 1500;
                        const leftPos = ((Math.max(minWl, Math.min(maxWl, line.wavelength)) - minWl) / (maxWl - minWl)) * 100;
                        return (
                            <div key={line.id} className="absolute top-0 bottom-0 w-1 pt-1 opacity-100 z-10 animate-pulse"
                                style={{ left: `${leftPos}%`, backgroundColor: line.color, boxShadow: `0 0 10px ${line.color}, 0 0 15px ${line.color}` }}>
                                <div className="absolute top-0 -translate-x-1/2 -mt-7 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap shadow-xl" style={{ color: line.color }}>
                                    {line.wavelength}nm
                                    <span className="block text-[7px] text-slate-400 text-center uppercase tracking-widest">{line.series}</span>
                                </div>
                            </div>
                        )
                    })}
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
            StatusBadgeComponent={statusBadge}
        />
    );
};

export default HydrogenSpectrumLab;
