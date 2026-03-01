import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCcw, Divide, Plus, Minus } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props {
    topic: Topic;
    onExit: () => void;
}

const ExtensiveIntensivePropertiesLab: React.FC<Props> = ({ topic, onExit }) => {
    const [partitioned, setPartitioned] = useState(false);
    const [moles, setMoles] = useState(4);        // n in mol (range 1–8)
    const [showMolarDerivation, setShowMolarDerivation] = useState(false);
    const T = 300;     // constant temperature K
    const R = 8.314;   // J/(mol·K)
    const M = 28;      // molar mass g/mol (N₂)
    const baseVolume = 100; // L

    // Effective values based on partition
    const effectiveVolume = partitioned ? baseVolume / 2 : baseVolume;
    const effectiveMoles = partitioned ? moles / 2 : moles;
    const effectiveMass = effectiveMoles * M; // grams

    // Derived properties
    const pressure = (effectiveMoles * R * T) / effectiveVolume; // J/L ≈ kPa
    const density = effectiveMass / effectiveVolume;
    const internalEnergy = effectiveMoles * (3 / 2) * R * T; // ideal monatomic approx
    const molarVolume = effectiveVolume / effectiveMoles;

    // Previous values for animation comparison
    const [prevExtensive, setPrevExtensive] = useState({ V: baseVolume, m: moles * M, n: moles, U: moles * 1.5 * R * T });
    const [systemMessage, setSystemMessage] = useState('Observe the initial state. All properties are at their baseline values.');

    // Gas molecule positions
    const moleculeCount = Math.round(effectiveMoles * 5);
    const molecules = useMemo(() => {
        const mols: { x: number; y: number; speed: number; delay: number }[] = [];
        for (let i = 0; i < moleculeCount; i++) {
            mols.push({
                x: 5 + ((i * 31 + i * i * 7) % 88),
                y: 8 + ((i * 47 + i * 13) % 80),
                speed: 1.5 + (i % 3) * 0.5,
                delay: (i * 0.2) % 2,
            });
        }
        return mols;
    }, [moleculeCount]);

    const handlePartition = () => {
        const next = !partitioned;
        setPartitioned(next);
        setShowMolarDerivation(false);
        if (next) {
            setSystemMessage('Partition inserted! Extensive properties halved. Intensive properties remain unchanged — they don\'t depend on system size.');
        } else {
            setSystemMessage('Partition removed. The system is whole again. Observe how extensive properties restored to full values.');
        }
    };

    const handleMolesChange = (newMoles: number) => {
        if (partitioned) setPartitioned(false);
        setMoles(newMoles);
        setShowMolarDerivation(false);
        if (newMoles > moles) {
            setSystemMessage('More gas pumped in! Mass and internal energy increase. In a fixed container, pressure and density also increase — but temperature stays constant.');
        } else {
            setSystemMessage('Gas removed. Mass and internal energy decrease. Pressure and density decrease proportionally.');
        }
    };

    const handleReset = () => {
        setPartitioned(false);
        setMoles(4);
        setShowMolarDerivation(false);
        setSystemMessage('System reset to baseline state.');
    };

    // Meter component
    const Meter = ({ label, value, unit, color, changed, direction }: {
        label: string; value: string; unit: string; color: string; changed?: boolean; direction?: 'up' | 'down' | 'same';
    }) => (
        <div className={`rounded-lg p-3 border transition-all duration-500 ${changed ? `border-${color}-400/50 bg-${color}-500/10 scale-[1.02]` : 'border-white/10 bg-white/5'}`}>
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">{label}</div>
            <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono" style={{ color }}>{value}</span>
                <span className="text-xs text-white/30">{unit}</span>
                {direction && direction !== 'same' && (
                    <span className={`text-xs font-bold ml-auto ${direction === 'down' ? 'text-red-400' : 'text-green-400'}`}>
                        {direction === 'down' ? '↓50%' : '↑'}
                    </span>
                )}
                {direction === 'same' && (
                    <span className="text-xs font-bold ml-auto text-blue-400">═ same</span>
                )}
            </div>
        </div>
    );

    const extDir = partitioned ? 'down' : undefined;
    const intDir = partitioned ? 'same' : undefined;

    const statusBadge = (
        <div className="flex flex-col items-center px-4 py-2 bg-slate-800/80 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl max-w-xl text-center">
            <div className="text-[12px] text-white/70 font-medium leading-tight">
                {systemMessage}
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="w-full flex flex-wrap lg:flex-nowrap gap-4">
            {/* Partition toggle */}
            <div className="flex-1 bg-slate-950/50 p-3 flex flex-col gap-2 rounded-xl border border-slate-700/50 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Partition</label>
                <button onClick={handlePartition}
                    className={`h-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${partitioned ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.15)]' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}>
                    <Divide size={16} />
                    {partitioned ? 'Remove Partition' : 'Insert Partition'}
                </button>
            </div>

            {/* Gas pump slider */}
            <div className="flex-[2] bg-slate-950/50 p-3 rounded-xl border border-slate-700/50 min-w-[250px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between mb-2">
                    <span>Pump Gas (n)</span>
                    <span className="text-emerald-400 font-mono">{moles} mol</span>
                </label>
                <input type="range" min="1" max="8" step="1" value={moles}
                    onChange={e => handleMolesChange(Number(e.target.value))}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer" />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">
                    <span>1 mol</span><span>8 mol</span>
                </div>
            </div>

            {/* Derive molar property */}
            <div className="flex-1 bg-slate-950/50 p-3 flex flex-col gap-2 rounded-xl border border-slate-700/50 min-w-[150px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Derive</label>
                <button onClick={() => {
                    setShowMolarDerivation(!showMolarDerivation);
                    if (!showMolarDerivation) {
                        setSystemMessage('Extensive ÷ Extensive = Intensive! Molar Volume is an intensive property derived from two extensive ones.');
                    }
                }}
                    className={`h-full py-2 px-3 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${showMolarDerivation ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}>
                    ✨ V ÷ n = V<sub>m</sub>
                </button>
            </div>

            {/* Reset */}
            <div className="flex-1 bg-slate-950/50 p-3 flex flex-col gap-2 rounded-xl border border-slate-700/50 min-w-[100px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block invisible">Reset</label>
                <button onClick={handleReset}
                    className="h-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-300 transition-colors cursor-pointer" title="Reset">
                    <RefreshCcw size={16} /> Reset
                </button>
            </div>
        </div>
    );

    const simulationCombo = (
        <div className="w-full h-full flex flex-col lg:flex-row items-center lg:items-stretch justify-center p-4 lg:p-8 gap-6 lg:gap-10 relative bg-transparent overflow-y-auto lg:overflow-hidden rounded-3xl min-h-0">
            {/* Grid background */}
            <div className="absolute inset-0 transition-opacity duration-1000" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '80px 80px',
                maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)'
            }} />

            {/* ---- LEFT PANEL: EXTENSIVE PROPERTIES ---- */}
            <div className="w-full lg:w-56 flex flex-col gap-3 shrink-0 z-10">
                <div className="text-[11px] font-bold text-red-400 uppercase tracking-widest text-center mb-2 flex items-center justify-center gap-2 bg-red-950/30 py-1.5 rounded-lg border border-red-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> Extensive Props
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 flex-1">
                    <Meter label="Total Volume (V)" value={effectiveVolume.toFixed(1)} unit="L" color="#f87171" changed={partitioned} direction={extDir} />
                    <Meter label="Total Mass (m)" value={effectiveMass.toFixed(1)} unit="g" color="#fb923c" changed={partitioned} direction={extDir} />
                    <Meter label="Total Moles (n)" value={effectiveMoles.toFixed(1)} unit="mol" color="#fbbf24" changed={partitioned} direction={extDir} />
                    <Meter label="Internal Energy (U)" value={(internalEnergy / 1000).toFixed(2)} unit="kJ" color="#a78bfa" changed={partitioned} direction={extDir} />
                </div>
            </div>

            {/* ---- CENTER: GAS CONTAINER ---- */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 min-w-0 z-10 w-full max-w-2xl">
                {/* Container title */}
                <div className="text-[11px] font-bold text-white/50 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full">Gas Container</div>

                {/* Glass box */}
                <div className="relative w-full aspect-[2/1.4] sm:aspect-[2/1.2] rounded-2xl overflow-hidden backdrop-blur-sm"
                    style={{
                        background: 'linear-gradient(135deg, rgba(16,24,40,0.8), rgba(30,41,59,0.8))',
                        border: '2px solid rgba(148,163,184,0.4)',
                        boxShadow: 'inset 0 0 50px rgba(96,165,250,0.08), 0 10px 30px rgba(0,0,0,0.6)',
                    }}>

                    {/* Gas molecules (only in active half if partitioned) */}
                    <div className={`absolute top-0 bottom-0 left-0 transition-all duration-500 overflow-hidden ${partitioned ? 'right-1/2' : 'right-0'}`}>
                        {molecules.map((m, i) => (
                            <div key={i} className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                                style={{
                                    left: `${m.x}%`,
                                    top: `${m.y}%`,
                                    backgroundColor: 'rgba(74,222,128,0.8)',
                                    boxShadow: '0 0 10px rgba(74,222,128,0.6)',
                                    animation: `mol-float ${m.speed}s ease-in-out ${m.delay}s infinite alternate`,
                                }} />
                        ))}
                    </div>

                    {/* Greyed out right half when partitioned */}
                    {partitioned && (
                        <div className="absolute top-0 bottom-0 right-0 left-1/2 bg-slate-900/80 flex items-center justify-center backdrop-blur-md">
                            <div className="text-sm font-bold text-white/30 uppercase tracking-widest text-center px-4 leading-relaxed bg-black/20 py-2 rounded-xl">
                                Excluded<br />Half
                            </div>
                        </div>
                    )}

                    {/* Partition blade */}
                    <div className={`absolute left-1/2 -translate-x-1/2 w-2 transition-all duration-500 z-10 ${partitioned ? 'top-0 h-full' : '-top-full h-full'}`}
                        style={{
                            background: partitioned ? 'linear-gradient(90deg, #475569, #94a3b8, #475569)' : 'linear-gradient(90deg, #334155, #475569)',
                            boxShadow: partitioned ? '0 0 16px rgba(148,163,184,0.5), -4px 0 12px rgba(0,0,0,0.5), 4px 0 12px rgba(0,0,0,0.5)' : 'none',
                        }}>
                        {/* Blade details */}
                        {partitioned && [0, 1, 2, 3, 4].map(i => (
                            <div key={i} className="absolute w-full h-px bg-white/30" style={{ top: `${15 + i * 18}%` }} />
                        ))}
                    </div>

                    {/* Volume labels */}
                    <div className={`absolute bottom-3 text-xs font-mono font-bold transition-all ${partitioned ? 'left-[25%] -translate-x-1/2' : 'left-1/2 -translate-x-1/2'} text-white/50 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5`}>
                        V = {effectiveVolume} L
                    </div>

                    {/* Temperature indicator (always same) */}
                    <div className="absolute top-3 right-4 text-xs font-mono font-bold text-orange-400 bg-orange-950/40 px-3 py-1 rounded-full flex items-center gap-1.5 border border-orange-500/20 backdrop-blur-sm">
                        <div className="w-1.5 h-4 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                        T = {T} K
                    </div>
                </div>

                {/* Molar derivation */}
                {showMolarDerivation && (
                    <div className="w-full px-6 py-4 bg-purple-900/30 rounded-2xl border border-purple-500/30 text-center animate-in fade-in duration-500 shadow-[0_4px_20px_rgba(168,85,247,0.15)] mt-2">
                        <div className="text-xs text-purple-300 mb-2 font-bold uppercase tracking-widest shrink-0">✨ Molar Property Derivation</div>
                        <div className="font-mono text-base md:text-lg text-purple-200">
                            V<sub>m</sub> = V / n = {effectiveVolume.toFixed(1)} / {effectiveMoles.toFixed(1)} = <span className="text-purple-400 font-bold bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-500/30">{molarVolume.toFixed(2)} L/mol</span>
                        </div>
                        <div className="text-xs text-purple-200/70 mt-3 font-medium">Extensive ÷ Extensive = <span className="font-bold text-purple-300 uppercase tracking-wider">Intensive!</span> Molar properties don't depend on system size.</div>
                    </div>
                )}
            </div>

            {/* ---- RIGHT PANEL: INTENSIVE PROPERTIES ---- */}
            <div className="w-full lg:w-56 flex flex-col gap-3 shrink-0 z-10">
                <div className="text-[11px] font-bold text-blue-400 uppercase tracking-widest text-center mb-2 flex items-center justify-center gap-2 bg-blue-950/30 py-1.5 rounded-lg border border-blue-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" /> Intensive Props
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 flex-1">
                    <Meter label="Temperature (T)" value={T.toFixed(0)} unit="K" color="#60a5fa" changed={partitioned} direction={intDir} />
                    <Meter label="Pressure (p)" value={(pressure / 1000).toFixed(3)} unit="kPa" color="#34d399"
                        changed={false} direction={partitioned ? 'same' : undefined} />
                    <Meter label="Density (d)" value={density.toFixed(3)} unit="g/L" color="#2dd4bf"
                        changed={false} direction={partitioned ? 'same' : undefined} />
                    <Meter label={showMolarDerivation ? "Molar Volume (Vₘ) ✨" : "Molar Volume (Vₘ)"}
                        value={molarVolume.toFixed(2)} unit="L/mol" color="#c084fc"
                        changed={showMolarDerivation} direction={partitioned ? 'same' : undefined} />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes mol-float {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(${3 + Math.random() * 5}px, ${Math.random() > 0.5 ? '' : '-'}${3 + Math.random() * 5}px); }
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

export default ExtensiveIntensivePropertiesLab;
