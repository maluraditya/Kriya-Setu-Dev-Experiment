import React, { useState, useMemo } from 'react';
import { RefreshCcw, Droplets, AlertTriangle } from 'lucide-react';

type BufferSystem = 'acetic' | 'ammonia';

/*──────────────────────────────────────────────────────────
  PURE HELPER: compute pH of plain water after adding acid/base
──────────────────────────────────────────────────────────*/
function waterPH(hclMl: number, naohMl: number): number {
    const netH = (hclMl - naohMl) * 0.001; // moles (1 M reagent)
    if (Math.abs(netH) < 1e-7) return 7.0;
    if (netH > 0) return Math.max(0.5, -Math.log10(netH));
    return Math.min(14, 14 + Math.log10(Math.abs(netH)));
}

/*──────────────────────────────────────────────────────────
  PURE HELPER: compute buffered pH via Henderson-Hasselbalch
──────────────────────────────────────────────────────────*/
function bufferPH(
    system: BufferSystem, acidM: number, saltM: number,
    hclMl: number, naohMl: number
) {
    const pKa = system === 'acetic' ? 4.76 : 9.25;
    const initAcid = acidM;   // moles (1 L)
    const initSalt = saltM;
    const netH = (hclMl - naohMl) * 0.001;

    let curAcid: number, curSalt: number;
    if (system === 'acetic') {
        curAcid = initAcid + netH;
        curSalt = initSalt - netH;
    } else {
        curAcid = initAcid - netH;
        curSalt = initSalt + netH;
    }

    const broken = curSalt <= 1e-4 || curAcid <= 1e-4;
    let pH: number;
    if (broken) {
        if (curSalt <= 0) {
            const excess = Math.abs(curSalt);
            pH = excess > 0 ? Math.max(0.5, -Math.log10(excess)) : 1;
        } else {
            const excess = Math.abs(curAcid);
            pH = excess > 0 ? Math.min(14, 14 + Math.log10(excess)) : 13;
        }
    } else {
        if (system === 'acetic') {
            pH = pKa + Math.log10(curSalt / curAcid);
        } else {
            const pOH = (14 - pKa) + Math.log10(curAcid / curSalt);
            pH = 14 - pOH;
        }
    }
    return {
        pH: Math.max(0.5, Math.min(14, pH)),
        curAcid: Math.max(0, curAcid),
        curSalt: Math.max(0, curSalt),
        broken,
    };
}

/*──────────────────────────────────────────────────────────
  pH → color mapping
──────────────────────────────────────────────────────────*/
function phColor(ph: number): string {
    if (ph < 3) return '#ef4444';
    if (ph < 5) return '#f97316';
    if (ph < 6.5) return '#eab308';
    if (ph < 7.5) return '#22c55e';
    if (ph < 9) return '#3b82f6';
    if (ph < 11) return '#8b5cf6';
    return '#a855f7';
}

/*================================================================
  MAIN COMPONENT
================================================================*/
const BufferSolutionsLab: React.FC = () => {
    // ---- Buffer config ----
    const [bufferSystem, setBufferSystem] = useState<BufferSystem>('acetic');
    const [acidConc, setAcidConc] = useState(0.50);
    const [saltConc, setSaltConc] = useState(0.50);

    // ---- SEPARATE counters for each beaker ----
    const [waterHCl, setWaterHCl] = useState(0);
    const [waterNaOH, setWaterNaOH] = useState(0);
    const [bufHCl, setBufHCl] = useState(0);
    const [bufNaOH, setBufNaOH] = useState(0);

    const [showMath, setShowMath] = useState(true);

    // ---- Derived values ----
    const wPH = useMemo(() => waterPH(waterHCl, waterNaOH), [waterHCl, waterNaOH]);
    const buf = useMemo(() => bufferPH(bufferSystem, acidConc, saltConc, bufHCl, bufNaOH),
        [bufferSystem, acidConc, saltConc, bufHCl, bufNaOH]);
    const pKa = bufferSystem === 'acetic' ? 4.76 : 9.25;

    const handleReset = () => {
        setWaterHCl(0); setWaterNaOH(0);
        setBufHCl(0); setBufNaOH(0);
        setAcidConc(0.50); setSaltConc(0.50);
        setBufferSystem('acetic');
    };

    const acidLabel = bufferSystem === 'acetic' ? 'CH₃COOH' : 'NH₃';
    const saltLabel = bufferSystem === 'acetic' ? 'CH₃COO⁻' : 'NH₄⁺';

    /*──────── Reusable beaker card ────────*/
    const BeakerCard = ({ title, subtitle, pH, hcl, naoh, onHCl, onNaOH, isBuf, broken }: {
        title: string; subtitle: string; pH: number;
        hcl: number; naoh: number;
        onHCl: () => void; onNaOH: () => void;
        isBuf?: boolean; broken?: boolean;
    }) => {
        const col = phColor(pH);
        return (
            <div className="flex-1 bg-slate-800/40 rounded-2xl border border-white/10 p-4 flex flex-col items-center gap-3 min-w-0">
                {/* Header */}
                <div className="text-center">
                    <div className="text-sm font-bold text-white/80">{title}</div>
                    <div className="text-[10px] text-white/30">{subtitle}</div>
                </div>

                {/* Beaker visual */}
                <div className="relative w-36 h-44 rounded-b-2xl overflow-hidden"
                    style={{ border: `2px solid ${broken ? '#ef444480' : 'rgba(148,163,184,0.25)'}`, borderTop: 'none' }}>
                    {/* Liquid */}
                    <div className="absolute bottom-0 left-0 right-0 transition-all duration-500" style={{
                        height: '82%',
                        background: `linear-gradient(180deg, ${col}10 0%, ${col}30 100%)`,
                    }}>
                        {/* Particles for buffer */}
                        {isBuf && (
                            <>
                                {Array.from({ length: Math.min(10, Math.round(buf.curSalt * 10)) }).map((_, i) => (
                                    <div key={`s${i}`} className="absolute w-2 h-2 rounded-full" style={{
                                        left: `${8 + ((i * 29 + i * i * 3) % 80)}%`,
                                        top: `${8 + ((i * 41 + i * 7) % 78)}%`,
                                        backgroundColor: 'rgba(96,165,250,0.65)',
                                        boxShadow: '0 0 4px rgba(96,165,250,0.4)',
                                        animation: `buf-drift ${1.8 + (i % 3) * 0.4}s ease-in-out infinite alternate`,
                                    }} />
                                ))}
                                {Array.from({ length: Math.min(10, Math.round(buf.curAcid * 10)) }).map((_, i) => (
                                    <div key={`a${i}`} className="absolute w-2 h-2 rounded-full" style={{
                                        left: `${5 + ((i * 37 + i * i * 11) % 82)}%`,
                                        top: `${12 + ((i * 53 + i * 17) % 72)}%`,
                                        backgroundColor: 'rgba(250,204,21,0.55)',
                                        animation: `buf-drift ${2 + (i % 3) * 0.3}s ease-in-out infinite alternate-reverse`,
                                    }} />
                                ))}
                                {broken && Array.from({ length: 6 }).map((_, i) => (
                                    <div key={`h${i}`} className="absolute w-1.5 h-1.5 rounded-full" style={{
                                        left: `${15 + ((i * 23) % 60)}%`,
                                        top: `${20 + ((i * 31) % 55)}%`,
                                        backgroundColor: 'rgba(239,68,68,0.9)',
                                        boxShadow: '0 0 6px rgba(239,68,68,0.7)',
                                        animation: `buf-drift ${1 + (i % 2) * 0.3}s ease-in-out infinite alternate`,
                                    }} />
                                ))}
                            </>
                        )}
                        {/* Simple water molecules */}
                        {!isBuf && Array.from({ length: 6 }).map((_, i) => (
                            <div key={`w${i}`} className="absolute w-1.5 h-1.5 rounded-full" style={{
                                left: `${12 + ((i * 31) % 70)}%`,
                                top: `${15 + ((i * 47) % 65)}%`,
                                backgroundColor: 'rgba(148,163,184,0.25)',
                                animation: `buf-drift ${2.2 + (i % 3) * 0.5}s ease-in-out infinite alternate`,
                            }} />
                        ))}
                    </div>

                    {/* Broken overlay */}
                    {broken && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 backdrop-blur-[1px] z-10">
                            <div className="text-center">
                                <AlertTriangle size={20} className="text-red-400 mx-auto mb-1 animate-pulse" />
                                <div className="text-[9px] font-bold text-red-300 uppercase">Buffer Broken!</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* pH display */}
                <div className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2 text-center w-full">
                    <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">pH Reading</div>
                    <div className="text-3xl font-bold font-mono transition-colors duration-300" style={{ color: col }}>
                        {pH.toFixed(2)}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-700 mt-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(pH / 14) * 100}%`, background: 'linear-gradient(90deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7)' }} />
                    </div>
                </div>

                {/* Additions counter */}
                <div className="flex gap-3 text-[10px] text-white/30 font-mono">
                    <span className="text-red-400/60">HCl: {hcl} mL</span>
                    <span className="text-blue-400/60">NaOH: {naoh} mL</span>
                </div>

                {/* Add buttons - ONLY affect THIS beaker */}
                <div className="flex gap-2 w-full">
                    <button onClick={onHCl}
                        className="flex-1 py-2 px-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-lg text-[11px] font-bold text-red-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95">
                        <Droplets size={12} /> + HCl
                    </button>
                    <button onClick={onNaOH}
                        className="flex-1 py-2 px-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 rounded-lg text-[11px] font-bold text-blue-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95">
                        <Droplets size={12} /> + NaOH
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col text-slate-100 font-sans">
            {/* ===== SIMULATION AREA ===== */}
            <div className="flex-1 relative bg-slate-900 overflow-hidden min-h-0">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />

                <div className="absolute inset-0 flex items-stretch p-4 gap-4">
                    {/* ── BEAKER A: WATER ── */}
                    <BeakerCard
                        title="Beaker A — Pure Water"
                        subtitle="No buffer (control)"
                        pH={wPH}
                        hcl={waterHCl} naoh={waterNaOH}
                        onHCl={() => setWaterHCl(prev => prev + 1)}
                        onNaOH={() => setWaterNaOH(prev => prev + 1)}
                    />

                    {/* ── CENTER: EQUATION + INFO ── */}
                    <div className="flex flex-col items-center justify-center gap-3 w-56 shrink-0">
                        {/* Comparison arrow */}
                        <div className="text-center mb-1">
                            <div className="text-xs font-bold text-white/40">← Compare →</div>
                            <div className="text-[10px] text-white/20 mt-1">
                                Add same acid/base to both beakers and watch the difference
                            </div>
                        </div>

                        {/* Henderson-Hasselbalch */}
                        {showMath && (
                            <div className="bg-slate-800/70 backdrop-blur-sm border border-purple-500/20 rounded-xl p-3 text-center w-full">
                                <div className="text-[8px] text-purple-400/50 uppercase tracking-wider mb-1.5">Henderson-Hasselbalch</div>
                                <div className="font-mono text-xs text-purple-200 leading-relaxed">
                                    {bufferSystem === 'acetic' ? (
                                        <>
                                            pH = pK<sub>a</sub> + log(<span className="text-blue-400">[A⁻]</span>/<span className="text-yellow-400">[HA]</span>)
                                            <div className="mt-1.5 text-[10px]">
                                                = {pKa} + log(<span className="text-blue-400">{buf.curSalt.toFixed(3)}</span>/<span className="text-yellow-400">{buf.curAcid.toFixed(3)}</span>)
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            pOH = pK<sub>b</sub> + log(<span className="text-blue-400">[B]</span>/<span className="text-yellow-400">[BH⁺]</span>)
                                            <div className="mt-1.5 text-[10px]">
                                                pH = 14 − ({(14 - pKa).toFixed(2)} + log(<span className="text-blue-400">{buf.curAcid.toFixed(3)}</span>/<span className="text-yellow-400">{buf.curSalt.toFixed(3)}</span>))
                                            </div>
                                        </>
                                    )}
                                    <div className="mt-1 text-base font-bold" style={{ color: phColor(buf.pH) }}>
                                        = {buf.pH.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Buffer ratio bar */}
                        <div className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-2.5">
                            <div className="text-[8px] text-white/30 text-center mb-1 uppercase tracking-wider">Buffer Component Ratio</div>
                            <div className="flex h-3 rounded overflow-hidden gap-px">
                                <div className="transition-all duration-300 rounded-l" style={{
                                    width: `${(buf.curAcid / (buf.curAcid + buf.curSalt + 0.001)) * 100}%`,
                                    backgroundColor: 'rgba(250,204,21,0.5)',
                                }} />
                                <div className="transition-all duration-300 rounded-r" style={{
                                    width: `${(buf.curSalt / (buf.curAcid + buf.curSalt + 0.001)) * 100}%`,
                                    backgroundColor: 'rgba(96,165,250,0.5)',
                                }} />
                            </div>
                            <div className="flex justify-between text-[8px] mt-1">
                                <span className="text-yellow-400/50">{acidLabel}</span>
                                <span className="text-blue-400/50">{saltLabel}</span>
                            </div>
                        </div>

                        {/* pH delta comparison */}
                        <div className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-2.5 text-center">
                            <div className="text-[8px] text-white/30 uppercase tracking-wider mb-1">pH Change from Neutral</div>
                            <div className="flex gap-3 justify-center">
                                <div>
                                    <div className="text-[9px] text-white/30">Water</div>
                                    <div className="text-sm font-bold font-mono" style={{ color: Math.abs(wPH - 7) > 1 ? '#ef4444' : '#22c55e' }}>
                                        {wPH >= 7 ? '+' : ''}{(wPH - 7).toFixed(2)}
                                    </div>
                                </div>
                                <div className="w-px bg-white/10" />
                                <div>
                                    <div className="text-[9px] text-white/30">Buffer</div>
                                    <div className="text-sm font-bold font-mono" style={{ color: buf.broken ? '#ef4444' : '#22c55e' }}>
                                        {buf.pH >= pKa ? '+' : ''}{(buf.pH - pKa).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── BEAKER B: BUFFER ── */}
                    <BeakerCard
                        title={`Beaker B — ${bufferSystem === 'acetic' ? 'Acidic' : 'Basic'} Buffer`}
                        subtitle={`${acidLabel} + ${saltLabel}`}
                        pH={buf.pH}
                        hcl={bufHCl} naoh={bufNaOH}
                        onHCl={() => setBufHCl(prev => prev + 1)}
                        onNaOH={() => setBufNaOH(prev => prev + 1)}
                        isBuf broken={buf.broken}
                    />
                </div>
            </div>

            {/* ===== CONTROLS ===== */}
            <div className="bg-slate-800 border-t border-slate-700 px-5 py-3 shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end max-w-5xl mx-auto">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Buffer System</label>
                        <select value={bufferSystem}
                            onChange={e => { setBufferSystem(e.target.value as BufferSystem); setBufHCl(0); setBufNaOH(0); }}
                            className="w-full bg-slate-900 border border-slate-600 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer">
                            <option value="acetic">Acetic Acid / Acetate (pKₐ 4.76)</option>
                            <option value="ammonia">Ammonia / Ammonium (pKᵦ 4.75)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between mb-1.5">
                            <span>[{bufferSystem === 'acetic' ? 'Acid' : 'Base'}]</span>
                            <span className="text-yellow-400 font-mono">{acidConc.toFixed(2)} M</span>
                        </label>
                        <input type="range" min="0.05" max="1" step="0.05" value={acidConc}
                            onChange={e => { setAcidConc(Number(e.target.value)); setBufHCl(0); setBufNaOH(0); }}
                            className="w-full accent-yellow-400 h-2 bg-slate-700 rounded-lg cursor-pointer" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between mb-1.5">
                            <span>[Salt]</span>
                            <span className="text-blue-400 font-mono">{saltConc.toFixed(2)} M</span>
                        </label>
                        <input type="range" min="0.05" max="1" step="0.05" value={saltConc}
                            onChange={e => { setSaltConc(Number(e.target.value)); setBufHCl(0); setBufNaOH(0); }}
                            className="w-full accent-blue-400 h-2 bg-slate-700 rounded-lg cursor-pointer" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Equation</label>
                        <button onClick={() => setShowMath(!showMath)}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${showMath ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                            {showMath ? 'Hide Math' : 'Show Math'}
                        </button>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">&nbsp;</label>
                        <button onClick={handleReset}
                            className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-2">
                            <RefreshCcw size={14} /> Reset All
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes buf-drift {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(3px, -3px); }
                }
            `}} />
        </div>
    );
};

export default BufferSolutionsLab;
