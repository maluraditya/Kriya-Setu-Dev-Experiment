import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCcw, Divide, Plus, Minus } from 'lucide-react';

const ExtensiveIntensivePropertiesLab: React.FC = () => {
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

    return (
        <div className="w-full h-full flex flex-col text-slate-100 font-sans">
            {/* ===== SIMULATION AREA ===== */}
            <div className="flex-1 relative bg-slate-900 overflow-hidden min-h-0">
                {/* Grid background */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />

                <div className="absolute inset-0 flex items-stretch p-4 gap-4">
                    {/* ---- LEFT PANEL: EXTENSIVE PROPERTIES ---- */}
                    <div className="w-48 flex flex-col gap-2 shrink-0">
                        <div className="text-[10px] font-bold text-red-400/70 uppercase tracking-widest text-center mb-1 flex items-center justify-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-400/50" /> Extensive Properties
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            <Meter label="Total Volume (V)" value={effectiveVolume.toFixed(1)} unit="L" color="#f87171" changed={partitioned} direction={extDir} />
                            <Meter label="Total Mass (m)" value={effectiveMass.toFixed(1)} unit="g" color="#fb923c" changed={partitioned} direction={extDir} />
                            <Meter label="Total Moles (n)" value={effectiveMoles.toFixed(1)} unit="mol" color="#fbbf24" changed={partitioned} direction={extDir} />
                            <Meter label="Internal Energy (U)" value={(internalEnergy / 1000).toFixed(2)} unit="kJ" color="#a78bfa" changed={partitioned} direction={extDir} />
                        </div>
                    </div>

                    {/* ---- CENTER: GAS CONTAINER ---- */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 min-w-0">
                        {/* Container title */}
                        <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Gas Container</div>

                        {/* Glass box */}
                        <div className="relative w-full max-w-md aspect-[2/1.2] rounded-xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(16,24,40,0.9), rgba(30,41,59,0.9))',
                                border: '2px solid rgba(148,163,184,0.3)',
                                boxShadow: 'inset 0 0 40px rgba(96,165,250,0.05), 0 0 20px rgba(0,0,0,0.5)',
                            }}>

                            {/* Gas molecules (only in active half if partitioned) */}
                            <div className={`absolute top-0 bottom-0 left-0 transition-all duration-500 overflow-hidden ${partitioned ? 'right-1/2' : 'right-0'}`}>
                                {molecules.map((m, i) => (
                                    <div key={i} className="absolute w-2.5 h-2.5 rounded-full"
                                        style={{
                                            left: `${m.x}%`,
                                            top: `${m.y}%`,
                                            backgroundColor: 'rgba(74,222,128,0.7)',
                                            boxShadow: '0 0 6px rgba(74,222,128,0.5)',
                                            animation: `mol-float ${m.speed}s ease-in-out ${m.delay}s infinite alternate`,
                                        }} />
                                ))}
                            </div>

                            {/* Greyed out right half when partitioned */}
                            {partitioned && (
                                <div className="absolute top-0 bottom-0 right-0 left-1/2 bg-slate-900/70 flex items-center justify-center">
                                    <div className="text-xs text-white/20 font-mono text-center px-4">
                                        Excluded<br />half
                                    </div>
                                </div>
                            )}

                            {/* Partition blade */}
                            <div className={`absolute left-1/2 -translate-x-1/2 w-1.5 transition-all duration-500 z-10 ${partitioned ? 'top-0 h-full' : '-top-full h-full'}`}
                                style={{
                                    background: partitioned ? 'linear-gradient(180deg, #64748b, #94a3b8, #64748b)' : 'linear-gradient(180deg, #475569, #64748b)',
                                    boxShadow: partitioned ? '0 0 12px rgba(148,163,184,0.4), -2px 0 8px rgba(0,0,0,0.3), 2px 0 8px rgba(0,0,0,0.3)' : 'none',
                                }}>
                                {/* Blade notches */}
                                {partitioned && [0, 1, 2, 3].map(i => (
                                    <div key={i} className="absolute w-full h-px bg-white/20" style={{ top: `${25 + i * 20}%` }} />
                                ))}
                            </div>

                            {/* Volume labels */}
                            <div className={`absolute bottom-2 text-[10px] font-mono transition-all ${partitioned ? 'left-[15%]' : 'left-1/2 -translate-x-1/2'} text-white/30`}>
                                V = {effectiveVolume} L
                            </div>

                            {/* Temperature indicator (always same) */}
                            <div className="absolute top-2 right-3 text-[10px] font-mono text-orange-400/70 flex items-center gap-1">
                                <div className="w-1 h-4 rounded-full bg-orange-400/40" />
                                T = {T} K
                            </div>
                        </div>

                        {/* System message */}
                        <div className="max-w-md mx-auto px-4 py-2.5 bg-slate-800/60 rounded-lg border border-white/10 text-[11px] text-white/50 text-center leading-relaxed">
                            {systemMessage}
                        </div>

                        {/* Molar derivation */}
                        {showMolarDerivation && (
                            <div className="max-w-md mx-auto px-4 py-3 bg-purple-900/20 rounded-xl border border-purple-500/20 text-center animate-in fade-in duration-500">
                                <div className="text-xs text-purple-300 mb-1 font-bold">✨ Molar Property Derivation</div>
                                <div className="font-mono text-sm text-purple-200">
                                    V<sub>m</sub> = V / n = {effectiveVolume.toFixed(1)} / {effectiveMoles.toFixed(1)} = <span className="text-purple-400 font-bold">{molarVolume.toFixed(2)} L/mol</span>
                                </div>
                                <div className="text-[10px] text-purple-400/60 mt-1.5">Extensive ÷ Extensive = <span className="font-bold text-purple-300">Intensive!</span> Molar properties don't depend on system size.</div>
                            </div>
                        )}
                    </div>

                    {/* ---- RIGHT PANEL: INTENSIVE PROPERTIES ---- */}
                    <div className="w-48 flex flex-col gap-2 shrink-0">
                        <div className="text-[10px] font-bold text-blue-400/70 uppercase tracking-widest text-center mb-1 flex items-center justify-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-400/50" /> Intensive Properties
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
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
                </div>
            </div>

            {/* ===== CONTROLS ===== */}
            <div className="bg-slate-800 border-t border-slate-700 px-5 py-4 shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end max-w-4xl mx-auto">
                    {/* Partition toggle */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Partition</label>
                        <button onClick={handlePartition}
                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${partitioned ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.15)]' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                            <Divide size={14} />
                            {partitioned ? 'Remove Partition' : 'Insert Partition'}
                        </button>
                    </div>

                    {/* Gas pump slider */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between mb-1.5">
                            <span>Pump Gas (n)</span>
                            <span className="text-emerald-400 font-mono">{moles} mol</span>
                        </label>
                        <input type="range" min="1" max="8" step="1" value={moles}
                            onChange={e => handleMolesChange(Number(e.target.value))}
                            className="w-full accent-emerald-400 h-2 bg-slate-700 rounded-lg cursor-pointer" />
                        <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                            <span>1 mol</span><span>8 mol</span>
                        </div>
                    </div>

                    {/* Derive molar property */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Derive</label>
                        <button onClick={() => {
                            setShowMolarDerivation(!showMolarDerivation);
                            if (!showMolarDerivation) {
                                setSystemMessage('Extensive ÷ Extensive = Intensive! Molar Volume is an intensive property derived from two extensive ones.');
                            }
                        }}
                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${showMolarDerivation ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                            ✨ V ÷ n = V<sub>m</sub>
                        </button>
                    </div>

                    {/* Reset */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">&nbsp;</label>
                        <button onClick={handleReset}
                            className="w-full py-2.5 px-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-2">
                            <RefreshCcw size={14} /> Reset
                        </button>
                    </div>
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
};

export default ExtensiveIntensivePropertiesLab;
