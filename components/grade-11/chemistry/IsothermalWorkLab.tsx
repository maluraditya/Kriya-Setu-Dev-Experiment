import React, { useState, useMemo } from 'react';
import { RefreshCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

type ProcessType = 'reversible' | 'irreversible';

interface Props {
    topic: Topic;
    onExit: () => void;
}

const IsothermalWorkLab: React.FC<Props> = ({ topic, onExit }) => {
    const [processType, setProcessType] = useState<ProcessType>('reversible');
    const [volume, setVolume] = useState(2); // current volume in L (range 1 to 5)
    const [nMoles] = useState(1);
    const [temperature] = useState(300); // K
    const R = 8.314; // J/(mol·K)
    const initialVolume = 1; // V1 in L

    // Isothermal: PV = nRT → P = nRT/V
    const pressureOnIsotherm = useMemo(() => {
        return (nMoles * R * temperature) / (volume);
    }, [volume, nMoles, temperature]);

    const initialPressure = (nMoles * R * temperature) / initialVolume;

    const externalPressure = useMemo(() => {
        // For irreversible: P_ext = nRT / V_final (constant external pressure at final state)
        return (nMoles * R * temperature) / 5; // P at max volume
    }, [nMoles, temperature]);

    // Current displayed pressure depends on process type
    const displayPressure = processType === 'reversible' ? pressureOnIsotherm : externalPressure;

    // Work calculations
    const workReversible = useMemo(() => {
        // W_rev = -nRT ln(V2/V1)
        if (volume <= initialVolume) return 0;
        return -nMoles * R * temperature * Math.log(volume / initialVolume);
    }, [volume, nMoles, temperature]);

    const workIrreversible = useMemo(() => {
        // W_irr = -P_ext * (V2 - V1)
        if (volume <= initialVolume) return 0;
        return -externalPressure * (volume - initialVolume);
    }, [volume, externalPressure]);

    const currentWork = processType === 'reversible' ? workReversible : workIrreversible;

    // Piston position: map volume (1-5) to visual fraction (0-1)
    const pistonFrac = (volume - 1) / 4;

    // PV data for the graph
    const pvCurve = useMemo(() => {
        const points: { v: number; p: number }[] = [];
        for (let v = 1; v <= 5; v += 0.1) {
            points.push({ v, p: (nMoles * R * temperature) / v });
        }
        return points;
    }, [nMoles, temperature]);

    // SVG graph scaling - use viewBox so it scales with container
    const gW = 320, gH = 220;
    const gPad = { l: 45, r: 15, t: 20, b: 30 };
    const plotW = gW - gPad.l - gPad.r;
    const plotH = gH - gPad.t - gPad.b;
    const maxP = (nMoles * R * temperature) / 1; // P at V=1
    const minP = (nMoles * R * temperature) / 5;  // P at V=5
    const toX = (v: number) => gPad.l + ((v - 1) / 4) * plotW;
    const toY = (p: number) => gPad.t + (1 - (p - minP * 0.5) / (maxP * 1.1 - minP * 0.5)) * plotH;

    // Irreversible process path: vertical drop at V1 then horizontal at P_ext
    const irrProcessPath = useMemo(() => {
        if (volume <= initialVolume) return '';
        const x1 = toX(initialVolume);
        const xEnd = toX(volume);
        const yStart = toY(initialPressure);
        const yPext = toY(externalPressure);
        return `M ${x1} ${yStart} L ${x1} ${yPext} L ${xEnd} ${yPext}`;
    }, [volume, initialPressure, externalPressure]);

    const curvePath = pvCurve.map((pt, i) =>
        `${i === 0 ? 'M' : 'L'} ${toX(pt.v).toFixed(1)} ${toY(pt.p).toFixed(1)}`
    ).join(' ');

    // Shaded area under curve up to current volume (reversible work area)
    const shadedPathRev = useMemo(() => {
        if (volume <= initialVolume) return '';
        const pts = pvCurve.filter(pt => pt.v >= initialVolume && pt.v <= volume);
        if (pts.length === 0) return '';
        let d = `M ${toX(initialVolume)} ${toY(0)} `;
        d += `L ${toX(initialVolume)} ${toY(pts[0].p)} `;
        pts.forEach(pt => { d += `L ${toX(pt.v)} ${toY(pt.p)} `; });
        d += `L ${toX(volume)} ${toY(0)} Z`;
        return d;
    }, [volume, pvCurve]);

    // Shaded rectangle for irreversible work
    const shadedRectIrr = useMemo(() => {
        if (volume <= initialVolume) return null;
        const x1 = toX(initialVolume);
        const x2 = toX(volume);
        const yTop = toY(externalPressure);
        const yBot = toY(0);
        return { x: x1, y: yTop, width: x2 - x1, height: yBot - yTop };
    }, [volume, externalPressure]);

    const handleReset = () => {
        setVolume(2);
        setProcessType('reversible');
    };

    // Gas molecule positions (pseudo-random based on volume)
    const molecules = useMemo(() => {
        const count = Math.max(5, Math.round(18 - volume * 2));
        const mols: { x: number; y: number; delay: number }[] = [];
        for (let i = 0; i < count; i++) {
            mols.push({
                x: 8 + ((i * 37 + i * i * 7) % 80),
                y: 10 + ((i * 53 + i * 13) % 75),
                delay: (i * 0.3) % 2,
            });
        }
        return mols;
    }, [volume]);

    const statusBadge = (
        <div className="flex flex-col items-center px-5 py-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl"
            style={{ backgroundColor: processType === 'reversible' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)' }}>
            <div className="text-[12px] uppercase font-bold tracking-widest text-slate-400 mb-0.5" style={{ color: processType === 'reversible' ? '#34d399' : '#fbbf24' }}>
                Isothermal {processType === 'reversible' ? 'Reversible' : 'Irreversible'} Expansion
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest bg-black/20 px-2 py-0.5 rounded-full mt-1">
                T = {temperature}K · n = {nMoles}mol · PV = nRT
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="w-full flex flex-col md:flex-row gap-4">
            {/* Process type toggle */}
            <div className="flex-1 bg-slate-950/50 p-3 flex flex-col gap-2 rounded-xl border border-slate-700/50">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Process Type</label>
                <div className="flex bg-slate-900 border border-slate-600 rounded-lg overflow-hidden h-full">
                    <button onClick={() => setProcessType('reversible')}
                        className={`flex-1 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${processType === 'reversible' ? 'bg-emerald-500/20 text-emerald-400 border-r border-emerald-500/30' : 'text-slate-400 hover:text-white border-r border-slate-700'}`}>
                        Reversible
                    </button>
                    <button onClick={() => setProcessType('irreversible')}
                        className={`flex-1 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${processType === 'irreversible' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}>
                        Irreversible
                    </button>
                </div>
            </div>

            {/* Volume slider */}
            <div className="flex-[2] bg-slate-950/50 p-3 rounded-xl border border-slate-700/50">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between mb-2">
                    <span>Final Volume (V₂)</span>
                    <span className="text-emerald-400 font-mono">{volume.toFixed(1)} L</span>
                </label>
                <input type="range" min="1" max="5" step="0.1" value={volume}
                    onChange={e => setVolume(Number(e.target.value))}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer" />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">
                    <span>V₁ = 1 L</span><span>5 L</span>
                </div>
            </div>

            {/* Reset */}
            <div className="flex items-center">
                <button onClick={handleReset}
                    className="h-full py-2 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-widest font-bold text-slate-300 transition-colors cursor-pointer" title="Reset">
                    <RefreshCcw size={16} /> Reset
                </button>
            </div>
        </div>
    );

    const simulationCombo = (
        <div className="w-full h-full flex items-center justify-center gap-8 lg:gap-12 relative bg-transparent overflow-hidden rounded-3xl min-h-0">
            {/* Grid background */}
            <div className="absolute inset-0 transition-opacity duration-1000" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '80px 80px',
                maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)'
            }} />

            {/* ---- LEFT: PISTON-CYLINDER ---- */}
            <div className="flex flex-col items-center gap-4 flex-shrink-0 z-10 w-full lg:w-auto h-full lg:h-auto overflow-y-auto lg:overflow-visible p-4 pb-24 lg:pb-0 justify-start lg:justify-center">
                <div className="text-[11px] font-bold text-white/50 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full">Piston-Cylinder System</div>
                <div className="relative w-[200px] h-[250px] lg:w-[260px] lg:h-[320px]">
                    {/* Cylinder body */}
                    <div className="absolute bottom-0 left-4 right-4 rounded-b-xl border-2 border-slate-500/50 bg-slate-800/60 backdrop-blur-md shadow-2xl"
                        style={{ height: '85%' }}>
                        {/* Gas region (below piston) */}
                        <div className="absolute bottom-0 left-0 right-0 rounded-b-lg overflow-hidden transition-all duration-300"
                            style={{
                                height: `${Math.max(20, pistonFrac * 100)}%`,
                                background: `linear-gradient(180deg, rgba(52,211,153,${0.08 + pistonFrac * 0.08}) 0%, rgba(96,165,250,${0.05 + pistonFrac * 0.05}) 100%)`,
                            }}>
                            {molecules.map((m, i) => (
                                <div key={i} className="absolute w-3 h-3 rounded-full"
                                    style={{
                                        left: `${m.x}%`,
                                        top: `${m.y}%`,
                                        backgroundColor: 'rgba(96,165,250,0.8)',
                                        boxShadow: '0 0 8px rgba(96,165,250,0.6)',
                                        animation: `molecule-bounce ${1.5 + m.delay}s ease-in-out infinite alternate`,
                                    }} />
                            ))}
                        </div>

                        {/* Piston head */}
                        <div className="absolute left-0 right-0 h-5 transition-all duration-300 flex items-center justify-center"
                            style={{
                                bottom: `${Math.max(20, pistonFrac * 100)}%`,
                                background: 'linear-gradient(180deg, #64748b 0%, #475569 50%, #334155 100%)',
                                borderTop: '2px solid #94a3b8',
                                borderBottom: '1px solid #1e293b',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
                            }}>
                            <div className="flex gap-4">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400/50 shadow-inner" />
                                ))}
                            </div>
                        </div>

                        {/* Piston rod */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-2.5 bg-gradient-to-b from-slate-400 to-slate-500 rounded-t transition-all duration-300 shadow-md"
                            style={{
                                bottom: `calc(${Math.max(20, pistonFrac * 100)}% + 20px)`,
                                height: `calc(100% - ${Math.max(20, pistonFrac * 100)}% - 10px)`,
                            }} />

                        {/* Weight on top (for irreversible) */}
                        {processType === 'irreversible' && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-8 bg-gradient-to-b from-amber-600 to-amber-800 rounded-md border border-amber-500/50 flex items-center justify-center shadow-[0_6px_16px_rgba(217,119,6,0.4)] transition-all duration-300">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-amber-100">P_ext</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Data readout */}
                <div className="flex gap-6 text-center bg-slate-900/80 backdrop-blur-xl border border-white/10 p-3 pb-2 rounded-2xl shadow-xl mt-2 w-[300px] justify-between">
                    <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Volume</div>
                        <div className="text-xl font-bold font-mono text-emerald-400 group relative">
                            {volume.toFixed(1)} L
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Pressure</div>
                        <div className="text-xl font-bold font-mono text-blue-400 group relative">
                            {(displayPressure / 1000).toFixed(2)} kPa
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Temp</div>
                        <div className="text-xl font-bold font-mono text-orange-400 group relative">
                            {temperature} K
                        </div>
                    </div>
                </div>

                {/* Embedded Work Comparison directly under the Cylinder Data on Mobile, inside the Scroll on Desktop it goes under the right side graph, so let's put it on the right instead of left */}
            </div>

            {/* ---- RIGHT: P-V GRAPH ---- */}
            <div className="hidden lg:flex flex-col items-center gap-4 flex-1 min-w-0 max-w-lg z-10 self-center">
                <div className="text-[11px] font-bold text-white/50 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full">P–V Diagram (Real-time)</div>
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 w-full shadow-2xl relative">
                    <svg viewBox={`0 0 ${gW} ${gH}`} className="w-full h-auto overflow-visible">
                        {/* Grid lines */}
                        {[1, 2, 3, 4, 5].map(v => (
                            <line key={`gv${v}`} x1={toX(v)} y1={gPad.t} x2={toX(v)} y2={gPad.t + plotH} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        ))}
                        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
                            const p = minP * 0.5 + f * (maxP * 1.1 - minP * 0.5);
                            return <line key={`gh${i}`} x1={gPad.l} y1={toY(p)} x2={gPad.l + plotW} y2={toY(p)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
                        })}

                        {/* Axes */}
                        <line x1={gPad.l} y1={gPad.t} x2={gPad.l} y2={gPad.t + plotH} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                        <line x1={gPad.l} y1={gPad.t + plotH} x2={gPad.l + plotW} y2={gPad.t + plotH} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

                        {/* Axis labels */}
                        <text x={gPad.l - 12} y={gPad.t + plotH / 2} fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="bold" textAnchor="middle" transform={`rotate(-90 ${gPad.l - 12} ${gPad.t + plotH / 2})`}>P (kPa)</text>
                        <text x={gPad.l + plotW / 2} y={gH - 2} fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="bold" textAnchor="middle">V (L)</text>

                        {/* Volume labels */}
                        {[1, 2, 3, 4, 5].map(v => (
                            <text key={`lv${v}`} x={toX(v)} y={gPad.t + plotH + 16} fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="bold" textAnchor="middle">{v}</text>
                        ))}

                        {/* Shaded work area */}
                        {processType === 'reversible' && shadedPathRev && (
                            <path d={shadedPathRev} fill="url(#revGrad)" stroke="none" />
                        )}
                        {processType === 'irreversible' && shadedRectIrr && (
                            <rect {...shadedRectIrr} fill="url(#irrGrad)" stroke="none" rx="2" />
                        )}

                        <defs>
                            <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="rgba(52,211,153,0.3)" />
                                <stop offset="100%" stopColor="rgba(52,211,153,0.05)" />
                            </linearGradient>
                            <linearGradient id="irrGrad" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="rgba(251,191,36,0.25)" />
                                <stop offset="100%" stopColor="rgba(251,191,36,0.05)" />
                            </linearGradient>
                        </defs>

                        {/* Isothermal curve (always shown as reference) */}
                        <path d={curvePath} fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="2.5" strokeDasharray="4 4" />

                        {/* Irreversible process path: vertical drop + horizontal */}
                        {processType === 'irreversible' && irrProcessPath && volume > initialVolume && (
                            <path d={irrProcessPath} fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinejoin="round" />
                        )}

                        {/* Reversible process path highlight (follows isotherm) */}
                        {processType === 'reversible' && volume > initialVolume && (
                            <path d={pvCurve.filter(pt => pt.v >= initialVolume && pt.v <= volume)
                                .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toX(pt.v).toFixed(1)} ${toY(pt.p).toFixed(1)}`)
                                .join(' ')}
                                fill="none" stroke="#34d399" strokeWidth="3" />
                        )}

                        {/* P_ext dashed line (for irreversible) */}
                        {processType === 'irreversible' && (
                            <>
                                <line x1={toX(1)} y1={toY(externalPressure)} x2={toX(5)} y2={toY(externalPressure)}
                                    stroke="rgba(251,191,36,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
                                <text x={toX(5) + 4} y={toY(externalPressure) + 4} fill="rgba(251,191,36,0.7)" fontSize="9" fontWeight="bold" textAnchor="start">P_ext</text>
                            </>
                        )}

                        {/* V1 line */}
                        <line x1={toX(initialVolume)} y1={gPad.t} x2={toX(initialVolume)} y2={gPad.t + plotH}
                            stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
                        <text x={toX(initialVolume)} y={gPad.t - 6} fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">V₁</text>

                        {/* Current V line */}
                        {volume > initialVolume && (
                            <>
                                <line x1={toX(volume)} y1={gPad.t} x2={toX(volume)} y2={gPad.t + plotH}
                                    stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
                                <text x={toX(volume)} y={gPad.t - 6} fill="rgba(52,211,153,0.9)" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">V₂</text>
                            </>
                        )}

                        {/* Initial state dot (at V1, P1) */}
                        <circle cx={toX(initialVolume)} cy={toY(initialPressure)} r="5"
                            fill="rgba(255,255,255,0.8)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />

                        {/* Current state dot */}
                        {volume > initialVolume && (
                            <circle cx={toX(volume)} cy={processType === 'reversible' ? toY(pressureOnIsotherm) : toY(externalPressure)} r="7"
                                fill={processType === 'reversible' ? '#34d399' : '#fbbf24'}
                                style={{ filter: `drop-shadow(0 0 10px ${processType === 'reversible' ? '#34d399' : '#fbbf24'})` }} />
                        )}

                        {/* Work value label inside graph */}
                        {volume > 1.3 && (
                            <text x={toX((initialVolume + volume) / 2)} y={toY(0) - 12}
                                fill={processType === 'reversible' ? 'rgba(52,211,153,1)' : 'rgba(251,191,36,1)'}
                                fontSize="12" textAnchor="middle" fontWeight="bold" style={{ textShadow: "0px 2px 4px rgba(0,0,0,0.8)" }}>
                                W = {(currentWork / 1000).toFixed(2)} kJ
                            </text>
                        )}
                    </svg>

                    {/* Legend */}
                    <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-black/40 px-3 py-2 rounded-lg border border-white/10 backdrop-blur">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-1 rounded-full bg-blue-400/50"></div>
                            <span className="text-[9px] uppercase tracking-widest text-slate-300 font-bold">Isotherm Ref</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-4 h-1 rounded-full ${processType === 'reversible' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                            <span className="text-[9px] uppercase tracking-widest text-slate-300 font-bold">Process Path</span>
                        </div>
                    </div>
                </div>

                {/* Work comparison */}
                <div className="flex gap-4 w-full mt-2">
                    <div className={`flex-1 rounded-2xl p-3 text-center border shadow-xl backdrop-blur-md transition-all ${processType === 'reversible' ? 'bg-emerald-500/20 border-emerald-500/40 scale-105' : 'bg-emerald-500/5 border-emerald-500/10 grayscale opacity-60'}`}>
                        <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest shadow-emerald-400/20 drop-shadow-md">W (Reversible)</div>
                        <div className="text-xl font-bold font-mono text-emerald-300">{(workReversible / 1000).toFixed(3)} kJ</div>
                    </div>
                    <div className={`flex-1 rounded-2xl p-3 text-center border shadow-xl backdrop-blur-md transition-all ${processType === 'irreversible' ? 'bg-amber-500/20 border-amber-500/40 scale-105' : 'bg-amber-500/5 border-amber-500/10 grayscale opacity-60'}`}>
                        <div className="text-[10px] text-amber-400 uppercase font-bold tracking-widest shadow-amber-400/20 drop-shadow-md">W (Irreversible)</div>
                        <div className="text-xl font-bold font-mono text-amber-300">{(workIrreversible / 1000).toFixed(3)} kJ</div>
                    </div>
                </div>

                {volume > 1.2 && (
                    <div className="text-[12px] text-white/50 text-center max-w-md mt-1 font-medium bg-black/20 px-4 py-2 rounded-xl backdrop-blur border border-white/5">
                        {Math.abs(workReversible) > Math.abs(workIrreversible)
                            ? <span>|W<sub>rev</sub>| &gt; |W<sub>irr</sub>| → <span className="text-emerald-400 font-bold uppercase tracking-wider">Reversible = max work</span></span>
                            : <span>Slide V₂ further to see the difference grow</span>
                        }
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes molecule-bounce {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(${Math.random() > 0.5 ? '' : '-'}${3 + Math.random() * 4}px, ${Math.random() > 0.5 ? '' : '-'}${3 + Math.random() * 4}px); }
                }
            `}} />
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            StatusBadgeComponent={statusBadge}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
        />
    );
};

export default IsothermalWorkLab;
