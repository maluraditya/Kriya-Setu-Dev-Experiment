import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Gauge, Plus, RefreshCcw, ShieldAlert, Timer } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface EnzymesLabProps {
    topic: any;
    onExit: () => void;
}

const EnzymesLab: React.FC<EnzymesLabProps> = ({ topic, onExit }) => {
    const [substrate, setSubstrate] = useState(80);
    const [enzymeCount, setEnzymeCount] = useState(1);
    const [slowMotion, setSlowMotion] = useState(false);
    const [inhibitorOn, setInhibitorOn] = useState(false);

    const vmax = enzymeCount * 24;
    const km = 55;
    const inhibitorFactor = inhibitorOn ? 0.55 : 1;
    const velocity = Math.round((vmax * substrate / (km + substrate)) * inhibitorFactor);
    const halfVmax = Math.round(vmax / 2);
    const saturation = velocity >= vmax * 0.82;

    const observation = useMemo(() => {
        if (inhibitorOn) return 'Fake substrates are blocking some active sites, so fewer true substrates form ES complexes and velocity drops.';
        if (saturation) return 'The curve is flattening. Most active sites are occupied, so adding more substrate cannot increase velocity much.';
        if (substrate < km) return 'Substrate is still limited. More substrate means more ES complexes, so velocity rises quickly.';
        return 'The reaction is approaching Vmax. Enzymes are busy for most of the time.';
    }, [inhibitorOn, saturation, substrate]);

    const resetLab = () => {
        setSubstrate(80);
        setEnzymeCount(1);
        setSlowMotion(false);
        setInhibitorOn(false);
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-3 flex-1 min-h-0">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Molecular Micro-Lab</div>
                            <div className="text-xs text-slate-500">ES complex, induced fit, product release</div>
                        </div>
                        <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white">{slowMotion ? 'Slow motion' : 'Live'}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2 min-h-[320px]">
                        <EnzymeSceneSVG substrate={substrate} inhibitorOn={inhibitorOn} slowMotion={slowMotion} saturation={saturation} />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Velocity vs Substrate</div>
                            <div className="text-xs text-slate-500">Vmax and Km saturation logic</div>
                        </div>
                        <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">{velocity}/sec</span>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-2 min-h-[240px]">
                        <VelocityGraphSVG substrate={substrate} velocity={velocity} vmax={vmax} km={km} inhibitorOn={inhibitorOn} />
                    </div>
                    <div className="grid sm:grid-cols-4 gap-2 mt-2">
                        <MetricCard label="Velocity" value={`${velocity}/sec`} tone="text-rose-700" />
                        <MetricCard label="Vmax" value={`${vmax}/sec`} tone="text-slate-700" />
                        <MetricCard label="Km" value={`${km}`} tone="text-indigo-700" />
                        <MetricCard label="Half Vmax" value={`${halfVmax}/sec`} tone="text-amber-700" />
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 shrink-0">
                <InfoCard title="Live Observation" icon={<Activity size={16} className="text-indigo-600" />}>
                    <p>{observation}</p>
                </InfoCard>
                <InfoCard title="Activation Energy" icon={<Gauge size={16} className="text-emerald-600" />}>
                    <p>Enzymes speed reactions by lowering the activation-energy barrier needed to reach the transition state.</p>
                </InfoCard>
                <InfoCard title="Assembly Line Analogy" icon={<ArrowRight size={16} className="text-amber-600" />}>
                    <p>At Vmax, every enzyme worker is busy. Extra substrate is like extra parts waiting in line.</p>
                </InfoCard>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
                    <strong>Experiment Goal:</strong> Observe ES complex formation, induced fit, product release, and the Vmax plateau as substrate concentration rises.
                </div>

                <SliderBlock label="Substrate Injector" value={`${substrate}`} minLabel="Few S" maxLabel="Many S">
                    <input type="range" min="0" max="220" value={substrate} onChange={(e) => setSubstrate(parseInt(e.target.value, 10))} className="w-full accent-emerald-600" />
                </SliderBlock>

                <div className="grid sm:grid-cols-3 gap-2">
                    <button onClick={() => setEnzymeCount(v => Math.min(4, v + 1))}
                        className="rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-900 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                        <Plus size={15} /> Add Enzyme ({enzymeCount})
                    </button>
                    <button onClick={() => setSlowMotion(v => !v)}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${slowMotion ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}>
                        <Timer size={15} /> Slow Motion
                    </button>
                    <button onClick={() => setInhibitorOn(v => !v)}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${inhibitorOn ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'}`}>
                        <ShieldAlert size={15} /> Inhibitor
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <FactTile icon={<Activity size={15} className="text-violet-600" />} title="Catalytic Cycle">
                        Substrate binds, enzyme changes shape, bonds break, products release, enzyme is reused.
                    </FactTile>
                    <FactTile icon={<Gauge size={15} className="text-rose-600" />} title="Saturation">
                        Vmax appears because the number of active sites is limited.
                    </FactTile>
                </div>

                <button onClick={resetLab} className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                    <RefreshCcw size={15} /> Reset Lab
                </button>
            </div>
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />;
};

const EnzymeSceneSVG = ({ substrate, inhibitorOn, slowMotion, saturation }: { substrate: number; inhibitorOn: boolean; slowMotion: boolean; saturation: boolean }) => {
    const particles = Math.min(18, Math.floor(substrate / 12));
    return (
        <svg viewBox="0 0 640 360" className="w-full h-full" aria-label="Enzyme action simulation">
            <rect width="640" height="360" rx="16" fill="#f5f3ff" />
            <text x="320" y="32" textAnchor="middle" fontSize="18" fontWeight="800" fill="#312e81">Active Site Specificity and Induced Fit</text>

            {Array.from({ length: particles }).map((_, i) => (
                <polygon key={i} points={`${70 + (i % 6) * 78},${75 + Math.floor(i / 6) * 46} ${86 + (i % 6) * 78},${84 + Math.floor(i / 6) * 46} ${86 + (i % 6) * 78},${102 + Math.floor(i / 6) * 46} ${70 + (i % 6) * 78},${111 + Math.floor(i / 6) * 46} ${54 + (i % 6) * 78},${102 + Math.floor(i / 6) * 46} ${54 + (i % 6) * 78},${84 + Math.floor(i / 6) * 46}`} fill="#22c55e" stroke="#14532d" strokeWidth="2" opacity="0.9" />
            ))}
            {inhibitorOn && [0, 1, 2, 3].map((i) => <circle key={i} cx={460 + i * 34} cy={82 + (i % 2) * 42} r="14" fill="#ef4444" stroke="#991b1b" strokeWidth="3" />)}

            <path d="M220 174 C220 105 292 70 358 95 C430 122 450 205 403 259 C352 317 248 292 225 225 C214 196 242 195 270 205 C296 214 316 200 317 174 C318 144 278 139 252 151 C235 159 221 166 220 174Z" fill="#8b5cf6" stroke="#4c1d95" strokeWidth="5" />
            <path d={slowMotion ? 'M314 156 C350 147 378 156 392 183 C377 210 347 221 318 209 C333 192 333 174 314 156Z' : 'M320 154 C352 148 378 157 392 183 C378 208 350 216 322 207 C337 190 337 172 320 154Z'} fill="#ede9fe" stroke="#4c1d95" strokeWidth="4" />
            <text x="333" y="143" textAnchor="middle" fontSize="13" fontWeight="800" fill="#4c1d95">Active Site</text>

            <polygon points="330,175 350,186 350,208 330,219 310,208 310,186" fill="#22c55e" stroke="#14532d" strokeWidth="3" />
            {slowMotion && <text x="320" y="255" textAnchor="middle" fontSize="14" fontWeight="800" fill="#4c1d95">Induced fit: enzyme squeezes around substrate</text>}
            {!slowMotion && (
                <>
                    <circle cx="420" cy="242" r="12" fill="#38bdf8" stroke="#075985" strokeWidth="3" />
                    <circle cx="452" cy="250" r="12" fill="#38bdf8" stroke="#075985" strokeWidth="3" />
                    <text x="438" y="282" textAnchor="middle" fontSize="13" fontWeight="800" fill="#075985">Products released</text>
                </>
            )}
            {saturation && <text x="320" y="330" textAnchor="middle" fontSize="15" fontWeight="900" fill="#be123c">Active sites mostly occupied: Vmax plateau</text>}
        </svg>
    );
};

const VelocityGraphSVG = ({ substrate, velocity, vmax, km, inhibitorOn }: { substrate: number; velocity: number; vmax: number; km: number; inhibitorOn: boolean }) => {
    const plotX = 58 + Math.min(substrate, 220) / 220 * 500;
    const plotY = 222 - Math.min(velocity, vmax) / Math.max(vmax, 1) * 165;
    const vmaxY = 222 - (inhibitorOn ? 0.55 : 1) * 165;
    const points = Array.from({ length: 22 }).map((_, i) => {
        const s = i * 10;
        const v = (vmax * s / (km + s)) * (inhibitorOn ? 0.55 : 1);
        const x = 58 + s / 220 * 500;
        const y = 222 - Math.min(v, vmax) / Math.max(vmax, 1) * 165;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg viewBox="0 0 640 260" className="w-full h-full" aria-label="Enzyme velocity graph">
            <rect width="640" height="260" rx="14" fill="#fff1f2" />
            <line x1="58" y1="222" x2="580" y2="222" stroke="#475569" strokeWidth="3" />
            <line x1="58" y1="222" x2="58" y2="32" stroke="#475569" strokeWidth="3" />
            <text x="318" y="248" textAnchor="middle" fontSize="12" fontWeight="800" fill="#475569">Substrate concentration</text>
            <text x="22" y="128" textAnchor="middle" fontSize="12" fontWeight="800" fill="#475569" transform="rotate(-90 22 128)">Velocity</text>
            <line x1="58" y1={vmaxY} x2="580" y2={vmaxY} stroke="#be123c" strokeWidth="3" strokeDasharray="8 7" />
            <text x="530" y={vmaxY - 8} fontSize="12" fontWeight="900" fill="#be123c">Vmax</text>
            <line x1={58 + km / 220 * 500} y1="222" x2={58 + km / 220 * 500} y2="142" stroke="#f59e0b" strokeWidth="3" strokeDasharray="5 5" />
            <text x={58 + km / 220 * 500} y="137" textAnchor="middle" fontSize="12" fontWeight="900" fill="#92400e">Km</text>
            <polyline points={points} fill="none" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={plotX} cy={plotY} r="8" fill="#e11d48" stroke="white" strokeWidth="3" />
        </svg>
    );
};

const SliderBlock = ({ label, value, minLabel, maxLabel, children }: { label: string; value: string; minLabel: string; maxLabel: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-700">{label}</div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-mono text-slate-700">{value}</div>
        </div>
        {children}
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
        </div>
    </div>
);

const MetricCard = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
        <div className={`mt-1 text-xs md:text-sm font-bold break-words ${tone}`}>{value}</div>
    </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-xs md:text-sm text-slate-600 leading-relaxed min-w-0">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">{icon}{title}</div>
        {children}
    </div>
);

const FactTile = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">{icon}{title}</div>
        {children}
    </div>
);

export default EnzymesLab;
