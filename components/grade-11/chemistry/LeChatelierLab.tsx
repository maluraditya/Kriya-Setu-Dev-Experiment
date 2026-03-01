import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { RefreshCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

/*================================================================
  CONSTANTS
================================================================*/
const Kc = 200;

/*================================================================
  Solve equilibrium: Fe3+ + SCN- ⇌ FeSCN2+
  Kc = x / ((F-x)(S-x))  →  quadratic in x
================================================================*/
function solveEquilibrium(totalFe: number, totalSCN: number) {
    const F = Math.max(0, totalFe);
    const S = Math.max(0, totalSCN);
    const a = Kc;
    const b = -(Kc * F + Kc * S + 1);
    const c = Kc * F * S;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return { fe: F, scn: S, product: 0 };
    const x1 = (-b - Math.sqrt(disc)) / (2 * a);
    const x2 = (-b + Math.sqrt(disc)) / (2 * a);
    const maxX = Math.min(F, S);
    let x = x1;
    if (x < 0 || x > maxX) x = x2;
    if (x < 0 || x > maxX) x = 0;
    return { fe: F - x, scn: S - x, product: x };
}

/*================================================================
  MAIN COMPONENT
================================================================*/
interface Props {
    topic: Topic;
    onExit: () => void;
}

const LeChatelierLab: React.FC<Props> = ({ topic, onExit }) => {
    const [totalFe, setTotalFe] = useState(0.005);
    const [totalSCN, setTotalSCN] = useState(0.005);

    // Animated concentrations
    const [fe, setFe] = useState(0);
    const [scn, setScn] = useState(0);
    const [product, setProduct] = useState(0);

    // Pouring animation state
    const [pouring, setPouring] = useState<string | null>(null); // dropper id or null
    const pourTimer = useRef<number>(0);

    const eqTarget = useMemo(() => solveEquilibrium(totalFe, totalSCN), [totalFe, totalSCN]);

    // Animation
    const animRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const fromRef = useRef({ fe: 0, scn: 0, product: 0 });
    const toRef = useRef({ fe: 0, scn: 0, product: 0 });

    const animateToEquilibrium = useCallback((target: { fe: number; scn: number; product: number }) => {
        cancelAnimationFrame(animRef.current);
        fromRef.current = { fe, scn, product };
        toRef.current = target;
        startTimeRef.current = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - startTimeRef.current) / 3000);
            const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            setFe(fromRef.current.fe + (toRef.current.fe - fromRef.current.fe) * ease);
            setScn(fromRef.current.scn + (toRef.current.scn - fromRef.current.scn) * ease);
            setProduct(fromRef.current.product + (toRef.current.product - fromRef.current.product) * ease);
            if (t < 1) animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
    }, [fe, scn, product]);

    useEffect(() => {
        animateToEquilibrium(eqTarget);
        return () => cancelAnimationFrame(animRef.current);
    }, [eqTarget]);

    useEffect(() => {
        const eq = solveEquilibrium(0.005, 0.005);
        setFe(eq.fe); setScn(eq.scn); setProduct(eq.product);
    }, []);

    // Qc
    const Qc = (fe > 1e-8 && scn > 1e-8) ? product / (fe * scn) : 0;
    const qcStatus = Math.abs(Qc - Kc) < 5 ? 'equilibrium' : Qc < Kc ? 'forward' : 'backward';

    const [message, setMessage] = useState('System at equilibrium. Click a reagent bottle below to disturb it!');

    // Color: pale yellow → deep blood red
    const maxProduct = 0.012;
    const pRatio = Math.min(1, product / maxProduct);
    const solR = Math.round(255 - pRatio * 40);
    const solG = Math.round(230 - pRatio * 200);
    const solB = Math.round(160 - pRatio * 140);
    const solutionColor = `rgb(${solR}, ${solG}, ${solB})`;

    // Color name for label
    const colorName = pRatio < 0.15 ? 'Pale Yellow' : pRatio < 0.35 ? 'Light Orange' : pRatio < 0.55 ? 'Orange' : pRatio < 0.75 ? 'Reddish Orange' : 'Deep Blood Red';

    // Pour animation trigger
    const triggerPour = (id: string) => {
        clearTimeout(pourTimer.current);
        setPouring(id);
        pourTimer.current = window.setTimeout(() => setPouring(null), 1200);
    };

    const addFe = () => {
        triggerPour('fe');
        setTotalFe(prev => prev + 0.003);
        setMessage('🧪 Fe(NO₃)₃ poured! Fe³⁺ added → Q꜀ < K꜀ → shifts FORWARD → solution turns deeper red.');
    };
    const addSCN = () => {
        triggerPour('scn');
        setTotalSCN(prev => prev + 0.003);
        setMessage('🧪 KSCN poured! SCN⁻ added → Q꜀ < K꜀ → shifts FORWARD → solution turns deeper red.');
    };
    const removeFe = () => {
        triggerPour('oxalic');
        setTotalFe(prev => Math.max(0.001, prev - 0.003));
        setMessage('🧫 Oxalic acid poured! Binds Fe³⁺ → Q꜀ > K꜀ → shifts BACKWARD → color fades toward yellow.');
    };
    const removeSCN = () => {
        triggerPour('hgcl');
        setTotalSCN(prev => Math.max(0.001, prev - 0.003));
        setMessage('🧫 HgCl₂ poured! Binds SCN⁻ → Q꜀ > K꜀ → shifts BACKWARD → color fades toward yellow.');
    };
    const handleReset = () => {
        setTotalFe(0.005); setTotalSCN(0.005);
        setPouring(null);
        setMessage('System reset to baseline equilibrium.');
    };

    // Reagent bottle component
    const ReagentBottle = ({ id, label, sublabel, color, onClick, effect }: {
        id: string; label: string; sublabel: string; color: string; onClick: () => void; effect: string;
    }) => {
        const isPouring = pouring === id;
        return (
            <button onClick={onClick}
                className="flex flex-col items-center gap-1 group cursor-pointer transition-all active:scale-95"
                title={effect}>
                {/* Bottle */}
                <div className={`relative transition-transform duration-300 ${isPouring ? '-rotate-45 translate-x-3 -translate-y-2' : 'group-hover:-rotate-12'}`}>
                    {/* Neck */}
                    <div className="w-3 h-4 mx-auto rounded-t-sm" style={{ backgroundColor: `${color}90` }} />
                    {/* Body */}
                    <div className="w-10 h-14 rounded-b-lg border-2 relative overflow-hidden" style={{ borderColor: `${color}60` }}>
                        <div className="absolute bottom-0 left-0 right-0 h-3/4" style={{ backgroundColor: `${color}40` }} />
                    </div>
                    {/* Pour stream */}
                    {isPouring && (
                        <div className="absolute -right-1 top-2 w-1 h-10 rounded-b animate-pulse" style={{
                            backgroundColor: `${color}80`,
                            transformOrigin: 'top',
                        }} />
                    )}
                </div>
                <div className="text-[10px] font-bold text-center leading-tight mt-1" style={{ color }}>{label}</div>
                <div className="text-[8px] text-white/30 text-center">{sublabel}</div>
                <div className={`text-[8px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${effect.includes('Forward') ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {effect}
                </div>
            </button>
        );
    };

    // Bar component
    const Bar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
        <div className="flex flex-col items-center gap-1">
            <div className="text-[9px] text-white/30 font-mono">{label}</div>
            <div className="w-10 h-24 bg-slate-800/50 rounded border border-white/5 relative overflow-hidden flex items-end">
                <div className="w-full rounded-t transition-all duration-500" style={{
                    height: `${Math.min(100, (value / max) * 100)}%`,
                    backgroundColor: color,
                    opacity: 0.6,
                }} />
            </div>
            <div className="text-[10px] font-mono font-bold" style={{ color }}>
                {(value * 1000).toFixed(1)}
            </div>
            <div className="text-[7px] text-white/20">mM</div>
        </div>
    );

    const statusBadge = (
        <div className="flex flex-col items-center px-4 py-2 bg-slate-800/80 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl max-w-xl text-center">
            <div className="text-[12px] text-white/70 font-medium leading-tight">
                {message}
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="w-full flex flex-col md:flex-row gap-4 lg:gap-8 items-center justify-center">
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest text-center hidden md:block">
                Reagents<br /><span className="text-[8px] font-normal opacity-70">Click to pour</span>
            </div>

            <div className="flex flex-wrap justify-center gap-4 lg:gap-8">
                <ReagentBottle id="fe" label="Fe(NO₃)₃" sublabel="Adds Fe³⁺" color="#facc15" onClick={addFe} effect="→ Forward Shift" />
                <ReagentBottle id="scn" label="KSCN" sublabel="Adds SCN⁻" color="#94a3b8" onClick={addSCN} effect="→ Forward Shift" />
            </div>

            <div className="w-16 h-px md:w-px md:h-16 bg-white/10" />

            <div className="flex flex-wrap justify-center gap-4 lg:gap-8">
                <ReagentBottle id="oxalic" label="Oxalic Acid" sublabel="Removes Fe³⁺" color="#a78bfa" onClick={removeFe} effect="← Backward Shift" />
                <ReagentBottle id="hgcl" label="HgCl₂" sublabel="Removes SCN⁻" color="#22d3ee" onClick={removeSCN} effect="← Backward Shift" />
            </div>

            <div className="w-16 h-px md:w-px md:h-16 bg-white/10" />

            <button onClick={handleReset}
                className="flex flex-col items-center justify-center gap-1 cursor-pointer group active:scale-95 bg-slate-800/50 hover:bg-slate-700/50 p-2 lg:p-3 rounded-xl border border-slate-700 transition-all">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                    <RefreshCcw size={16} className="text-slate-300" />
                </div>
                <div className="text-[10px] text-slate-300 font-bold tracking-widest uppercase">Reset</div>
            </button>
        </div>
    );

    const simulationCombo = (
        <div className="w-full h-full flex items-center justify-center p-4 lg:p-8 relative bg-transparent overflow-y-auto lg:overflow-hidden rounded-3xl min-h-0">
            {/* Grid */}
            <div className="absolute inset-0 transition-opacity duration-1000" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '80px 80px',
                maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)'
            }} />

            <div className="w-full max-w-[1400px] flex flex-col lg:flex-row items-center lg:items-center justify-center gap-8 lg:gap-24 z-10 h-full max-h-[800px]">
                {/* ── LEFT: MAIN FLASK ── */}
                <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full min-w-0 h-full">
                    <div className="text-sm font-bold text-white/50 bg-black/30 px-6 py-2 rounded-full border border-white/5 uppercase tracking-widest shadow-inner">Reaction Flask</div>
                    <div className="text-[11px] lg:text-sm 2xl:text-base font-mono text-white/40 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-700/50 shadow-inner">
                        Fe³⁺<span className="text-yellow-400/60">(yellow)</span> + SCN⁻ ⇌ [Fe(SCN)]²⁺<span className="text-red-400/60">(deep red)</span>
                    </div>

                    {/* Large flask (Scaled up dynamically via aspect ratio and height constraints) */}
                    <div className="relative w-full max-w-[280px] lg:max-w-[400px] aspect-[4/5] mt-4 flex-shrink">
                        {/* Flask neck */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[20%] h-[15%] rounded-t-lg border-2 border-b-0 border-slate-500/30 bg-slate-800/20 backdrop-blur-sm shadow-[0_-5px_15px_rgba(0,0,0,0.2)]" />

                        {/* Flask opening highlight */}
                        <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[24%] h-[3%] rounded-full border-2 border-slate-400/40 bg-slate-800/40 -mt-1 shadow-[0_2px_5px_rgba(0,0,0,0.5)] z-10" />

                        {/* Flask body */}
                        <div className="absolute top-[12%] inset-x-0 bottom-0 rounded-b-[3rem] overflow-hidden backdrop-blur-sm"
                            style={{
                                border: '2px solid rgba(148,163,184,0.3)',
                                boxShadow: `inset 0 0 60px rgba(${solR},${solG},${solB},0.2), 0 10px 40px rgba(0,0,0,0.5)`,
                            }}>
                            {/* Liquid */}
                            <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 rounded-b-[2rem]" style={{
                                height: '80%',
                                background: `linear-gradient(180deg, rgba(${solR},${solG},${solB},0.3) 0%, rgba(${solR},${solG},${solB},0.6) 100%)`,
                            }}>
                                {/* Animated particles inside */}
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="absolute rounded-full" style={{
                                        width: i >= 7 ? '6px' : '5px',
                                        height: i >= 7 ? '6px' : '5px',
                                        left: `${8 + ((i * 29 + i * i * 3) % 80)}%`,
                                        top: `${8 + ((i * 41 + i * 7) % 78)}%`,
                                        backgroundColor: i < 3 ? 'rgba(250,204,21,0.6)' : i < 6 ? 'rgba(148,163,184,0.3)' : `rgba(220,38,38,${0.3 + pRatio * 0.7})`,
                                        boxShadow: i >= 7 ? `0 0 10px rgba(220,38,38,${pRatio * 0.5})` : 'none',
                                        animation: `eq-float ${2 + (i % 3) * 0.6}s ease-in-out infinite alternate`,
                                    }} />
                                ))}
                            </div>

                            {/* Meniscus reflection */}
                            <div className="absolute top-[20%] left-0 right-0 h-2 bg-gradient-to-b from-white/20 to-transparent flex items-center justify-center">
                                <div className="w-[90%] h-[1px] bg-white/30 rounded-full blur-[1px]" />
                            </div>

                            {/* Flask glare */}
                            <div className="absolute top-[25%] left-[5%] w-[10%] h-[60%] rounded-[50%] bg-gradient-to-r from-white/20 to-transparent rotate-[-10deg] blur-[2px]" />

                            {/* White base glow */}
                            <div className="absolute bottom-0 left-0 right-0 h-4 rounded-b-[2rem]" style={{
                                background: `linear-gradient(0deg, rgba(${solR},${solG},${solB},0.3), transparent)`,
                            }} />
                        </div>
                    </div>

                    {/* Color indicator strip */}
                    <div className="flex items-center gap-3 mt-3 bg-slate-900/60 p-2.5 rounded-xl border border-white/5 backdrop-blur-sm">
                        <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg" style={{
                            backgroundColor: solutionColor,
                            boxShadow: `0 0 15px rgba(${solR},${solG},${solB},0.5)`,
                        }} />
                        <div className="flex flex-col justify-center">
                            <div className="text-sm lg:text-lg 2xl:text-xl font-bold tracking-wide" style={{ color: solutionColor }}>{colorName}</div>
                            <div className="text-[10px] lg:text-xs 2xl:text-sm text-white/40 font-mono mt-0.5 lg:mt-1">
                                [FeSCN²⁺] = <span className="text-red-400">{(product * 1000).toFixed(2)} mM</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: DASHBOARD ── */}
                <div className="w-full lg:w-64 flex flex-col items-center justify-center gap-4 shrink-0">
                    {/* Shift direction */}
                    <div className={`w-full px-4 py-3 rounded-2xl text-center text-sm font-bold border shadow-lg backdrop-blur-sm transition-all duration-500 ${qcStatus === 'equilibrium' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : qcStatus === 'forward' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                        }`}>
                        {qcStatus === 'equilibrium' ? '⚖️ At Equilibrium (Q꜀ = K꜀)' :
                            qcStatus === 'forward' ? '→ Shifting Forward (making product)' :
                                '← Shifting Backward (consuming product)'}
                    </div>

                    {/* Qc vs Kc */}
                    <div className="bg-slate-900/80 border border-white/10 shadow-lg rounded-2xl p-4 w-full text-center backdrop-blur-sm">
                        <div className="text-[9px] text-white/50 font-bold uppercase tracking-widest mb-1.5">Reaction Quotient</div>
                        <div className="font-mono text-xs text-white/70 bg-black/40 py-1.5 rounded-lg border border-white/5">
                            Q꜀ = <span className="text-red-400">[P]</span> / (<span className="text-yellow-400">[Fe³⁺]</span>·<span className="text-slate-300">[SCN⁻]</span>)
                        </div>
                        <div className="mt-3 flex items-center justify-center gap-4">
                            <div className="text-center bg-black/20 p-2 rounded-xl flex-1 border border-white/5">
                                <div className="text-[9px] text-white/40 font-medium mb-0.5">Q꜀</div>
                                <div className="text-xl font-bold font-mono" style={{
                                    color: qcStatus === 'equilibrium' ? '#34d399' : qcStatus === 'forward' ? '#f59e0b' : '#3b82f6',
                                    textShadow: qcStatus === 'equilibrium' ? '0 0 10px rgba(52,211,153,0.3)' : qcStatus === 'forward' ? '0 0 10px rgba(245,158,11,0.3)' : '0 0 10px rgba(59,130,246,0.3)'
                                }}>{Qc.toFixed(0)}</div>
                            </div>

                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <span className={`text-lg font-bold ${qcStatus === 'equilibrium' ? 'text-emerald-400' : qcStatus === 'forward' ? 'text-amber-400' : 'text-blue-400'}`}>{qcStatus === 'equilibrium' ? '=' : qcStatus === 'forward' ? '<' : '>'}</span>
                            </div>

                            <div className="text-center bg-black/20 p-2 rounded-xl flex-1 border border-white/5 relative overflow-hidden">
                                {/* Lock icon watermark */}
                                <div className="absolute right-1 top-1 text-white/5">🔒</div>
                                <div className="text-[9px] text-white/40 font-medium mb-0.5">K꜀ (Fixed)</div>
                                <div className="text-xl font-bold font-mono text-emerald-400/80 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]">{Kc}</div>
                            </div>
                        </div>
                    </div>

                    {/* Concentration bars */}
                    <div className="bg-slate-900/80 border border-white/10 shadow-lg rounded-2xl p-4 w-full backdrop-blur-sm">
                        <div className="text-[9px] text-white/50 text-center font-bold uppercase tracking-widest mb-3">Concentrations</div>
                        <div className="flex justify-center gap-6">
                            <Bar label="Fe³⁺" value={fe} max={0.015} color="#facc15" />
                            <Bar label="SCN⁻" value={scn} max={0.015} color="#94a3b8" />
                            <Bar label="FeSCN²⁺" value={product} max={0.015} color="#ef4444" />
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes eq-float {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(4px, -5px) scale(1.15); }
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

export default LeChatelierLab;
