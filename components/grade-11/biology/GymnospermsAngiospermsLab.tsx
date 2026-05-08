import React, { useMemo, useState, useEffect } from 'react';
import { ArrowRight, Eye, RefreshCcw, Wind, Flower, Zap, Shield, Search, Info, Activity } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type PlantType = 'Gymnosperm' | 'Angiosperm';
type SimStep = 'Observe' | 'Pollinate' | 'Fertilise' | 'Result';

interface GymnospermsAngiospermsLabProps {
    topic: any;
    onExit: () => void;
}

const GymnospermsAngiospermsLab: React.FC<GymnospermsAngiospermsLabProps> = ({ topic, onExit }) => {
    const [plantType, setPlantType] = useState<PlantType>('Gymnosperm');
    const [simStep, setSimStep] = useState<SimStep>('Observe');
    const [xrayActive, setXrayActive] = useState(false);
    const [slowMo, setSlowMo] = useState(false);

    // Reset step when plant type changes
    useEffect(() => {
        setSimStep('Observe');
        setXrayActive(false);
    }, [plantType]);

    const activeData = useMemo(() => {
        if (plantType === 'Gymnosperm') {
            return {
                name: 'Gymnosperm (Pine)',
                color: '#166534',
                accent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                seeds: 'Naked (Exposed)',
                fertilisation: 'Single Fertilisation',
                endosperm: 'Haploid (n)',
                example: 'Pinus, Cycas',
                description: 'Ovules are exposed on megasporophylls. No ovary wall protects them.'
            };
        }
        return {
            name: 'Angiosperm (Hibiscus)',
            color: '#f59e0b',
            accent: 'bg-amber-100 text-amber-800 border-amber-200',
            seeds: 'Enclosed (Inside fruit)',
            fertilisation: 'Double Fertilisation',
            endosperm: 'Triploid (3n)',
            example: 'Mango, Sunflower',
            description: 'Ovules are enclosed within an ovary, which later develops into a fruit.'
        };
    }, [plantType]);

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="flex-1 relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                {/* HUD Overlay */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${activeData.accent} shadow-sm backdrop-blur-md`}>
                        {activeData.name}
                    </div>
                    {simStep !== 'Observe' && (
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm animate-pulse uppercase tracking-wider">
                            Step: {simStep}
                        </div>
                    )}
                </div>

                {/* Main Visual Scene */}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    {plantType === 'Gymnosperm' ? (
                        <GymnospermScene simStep={simStep} />
                    ) : (
                        <AngiospermScene simStep={simStep} xray={xrayActive} slowMo={slowMo} />
                    )}
                </div>

                {/* X-Ray Indicator (Angiosperm only) */}
                {plantType === 'Angiosperm' && (
                    <div className="absolute top-3 right-3 z-10">
                         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${xrayActive ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                            <Zap size={12} />
                            {xrayActive ? 'X-RAY ACTIVE' : 'X-RAY OFF'}
                        </div>
                    </div>
                )}
            </div>

            {/* Observation Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
                <InfoCard title="What to Notice" icon={<Eye size={16} className="text-sky-600" />}>
                    {plantType === 'Gymnosperm' ? (
                        <p className="text-xs">In Pine cones, pollen lands <strong>directly</strong> on the ovule micropyle. There is no stigma or style to traverse.</p>
                    ) : (
                        <p className="text-xs">In Flowers, pollen must land on the <strong>stigma</strong>. It then grows a long tube through the <strong>style</strong> to reach the hidden ovary.</p>
                    )}
                </InfoCard>
                <InfoCard title="Scientific Logic" icon={<ArrowRight size={16} className="text-emerald-600" />}>
                    {plantType === 'Angiosperm' && simStep === 'Fertilise' ? (
                        <p className="text-xs"><strong>Double Fertilisation:</strong> One male gamete fuses with egg (Zygote), the other with two polar nuclei (Endosperm).</p>
                    ) : (
                        <p className="text-xs">{activeData.description}</p>
                    )}
                </InfoCard>
                <InfoCard title="Current Phase" icon={<Activity size={16} className="text-amber-600" />}>
                    <p className="text-xs font-semibold">{simStep === 'Observe' ? 'Observation' : simStep === 'Pollinate' ? 'Pollination Journey' : simStep === 'Fertilise' ? 'Fertilisation Event' : 'Post-Fertilisation'}</p>
                    <p className="text-[10px] mt-1 text-slate-500">
                        {simStep === 'Observe' && 'Observe the placement of the ovule.'}
                        {simStep === 'Pollinate' && 'Watch the pollen reach the ovule.'}
                        {simStep === 'Fertilise' && 'Watch the gametes enter the embryo sac.'}
                        {simStep === 'Result' && 'See the final seed structure.'}
                    </p>
                </InfoCard>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col w-full h-full">
            <div className="p-4 md:p-5 flex flex-col gap-5 w-full">
                {/* 1. Plant Switcher */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Flower size={12} /> Plant Selection
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setPlantType('Gymnosperm')}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${plantType === 'Gymnosperm' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Wind size={14} /> Gymnosperm
                        </button>
                        <button
                            onClick={() => setPlantType('Angiosperm')}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${plantType === 'Angiosperm' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Flower size={14} /> Angiosperm
                        </button>
                    </div>
                </div>

                {/* 2. Step Navigator */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Search size={12} /> Simulation Steps
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {(['Observe', 'Pollinate', 'Fertilise', 'Result'] as SimStep[]).map((step, idx) => (
                            <button
                                key={step}
                                onClick={() => setSimStep(step)}
                                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${simStep === step ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${simStep === step ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {idx + 1}
                                </span>
                                <span className="text-[10px] font-bold">{step}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Specialized Toggles */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">X-Ray (Ovary)</label>
                        <button
                            disabled={plantType === 'Gymnosperm'}
                            onClick={() => setXrayActive(!xrayActive)}
                            className={`w-full py-2.5 rounded-lg border-2 font-bold text-[11px] transition-all flex items-center justify-center gap-2 ${plantType === 'Gymnosperm' ? 'opacity-30 grayscale cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300' : xrayActive ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                        >
                            <Shield size={14} /> {xrayActive ? 'Show Wall' : 'X-Ray View'}
                        </button>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Slow-Mo Mode</label>
                        <button
                            onClick={() => setSlowMo(!slowMo)}
                            className={`w-full py-2.5 rounded-lg border-2 font-bold text-[11px] transition-all flex items-center justify-center gap-2 ${slowMo ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                        >
                            <Activity size={14} /> {slowMo ? 'Normal Speed' : 'Slow Motion'}
                        </button>
                    </div>
                </div>

                {/* 4. Live Data Summary */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Feature</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                    </div>
                    <StatRow label="Seed Protection" value={activeData.seeds} />
                    <StatRow label="Fertilisation" value={activeData.fertilisation} />
                    <StatRow label="Endosperm" value={activeData.endosperm} />
                    <StatRow label="Example" value={activeData.example} />
                </div>

                <button
                    onClick={() => { setSimStep('Observe'); setPlantType('Gymnosperm'); setXrayActive(false); setSlowMo(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    <RefreshCcw size={16} /> Reset Lab
                </button>
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

// --- Sub-components ---

const GymnospermScene = ({ simStep }: { simStep: SimStep }) => {
    return (
        <svg viewBox="0 0 400 400" className="w-full max-w-[320px] h-auto drop-shadow-2xl">
            <style>{`
                @keyframes gymno-pollen {
                    0% { transform: translate(-100px, -100px); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translate(140px, 160px); opacity: 1; }
                }
                @keyframes gamete-enter {
                    0% { opacity: 0; transform: translateY(0); }
                    50% { opacity: 1; }
                    100% { opacity: 1; transform: translateY(20px); }
                }
                .pollen-flight { animation: gymno-pollen 2s forwards ease-in-out; }
                .gamete-pulse { animation: gamete-enter 1s forwards ease-out 2.5s; }
            `}</style>
            
            {/* Cone Scale Base */}
            <path d="M50 250 Q200 350 350 250 L300 150 Q200 100 100 150 Z" fill="#3f3f46" stroke="#1c1917" strokeWidth="4" />
            <path d="M70 240 Q200 320 330 240" fill="none" stroke="#27272a" strokeWidth="2" strokeDasharray="8 4" />

            {/* Exposed Ovule */}
            <g transform="translate(150, 160)">
                <ellipse cx="50" cy="40" rx="30" ry="45" fill="#facc15" stroke="#ca8a04" strokeWidth="3" />
                <circle cx="50" cy="65" r="8" fill="#ca8a04" opacity="0.3" /> {/* Micropyle area */}
                
                {/* Archegonium */}
                <ellipse cx="50" cy="50" rx="12" ry="18" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="50" cy="55" r="5" fill="#16a34a" /> {/* Egg cell */}
                
                <text x="50" y="-10" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#71717a">NAKED OVULE</text>
            </g>

            {/* Pollination Step */}
            {simStep === 'Pollinate' && (
                <circle cx="0" cy="0" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1" className="pollen-flight" />
            )}

            {/* Fertilisation Step */}
            {simStep === 'Fertilise' && (
                <g>
                    <circle cx="200" cy="180" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                    <line x1="200" y1="180" x2="200" y2="205" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="200" cy="215" r="4" fill="#ef4444" className="gamete-pulse" />
                    <text x="250" y="218" fontSize="10" fontWeight="bold" fill="#ef4444" className="gamete-pulse">MALE GAMETE</text>
                </g>
            )}

            {/* Result Step */}
            {simStep === 'Result' && (
                <g transform="translate(150, 160)">
                    <ellipse cx="50" cy="40" rx="32" ry="48" fill="#92400e" stroke="#451a03" strokeWidth="4" />
                    <text x="50" y="45" textAnchor="middle" fontSize="12" fontWeight="black" fill="white">HARD SEED</text>
                </g>
            )}
        </svg>
    );
};

const AngiospermScene = ({ simStep, xray, slowMo }: { simStep: SimStep, xray: boolean, slowMo: boolean }) => {
    const animDuration = slowMo ? '6s' : '2.5s';
    const gameteDelay = slowMo ? '6.5s' : '3s';

    return (
        <svg viewBox="0 0 400 400" className="w-full max-w-[320px] h-auto drop-shadow-2xl">
            <style>{`
                @keyframes tube-grow {
                    0% { height: 0; }
                    100% { height: 180px; }
                }
                @keyframes gamete-1 {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    100% { transform: translateY(180px); opacity: 1; }
                }
                @keyframes hit-egg {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.5); fill: #ef4444; }
                    100% { transform: scale(1.2); fill: #b91c1c; }
                }
                @keyframes hit-polar {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.8); fill: #3b82f6; }
                    100% { transform: scale(1.4); fill: #1d4ed8; }
                }
                .tube-animate { animation: tube-grow ${animDuration} forwards linear; }
                .gamete-animate { animation: gamete-1 ${animDuration} forwards linear; }
                .zygote-form { animation: hit-egg 1s forwards ease-out ${gameteDelay}; }
                .endosperm-form { animation: hit-polar 1s forwards ease-out ${gameteDelay}; }
            `}</style>

            {/* Hibiscus Carpel Structure */}
            {/* Stigma */}
            <path d="M180 40 Q200 20 220 40 L210 60 L190 60 Z" fill="#be123c" stroke="#881337" strokeWidth="2" />
            
            {/* Style */}
            <rect x="194" y="60" width="12" height="200" fill="#fecdd3" stroke="#fda4af" strokeWidth="1" />
            
            {/* Ovary */}
            <path d="M150 320 Q200 380 250 320 Q260 260 200 260 Q140 260 150 320" fill={xray ? "rgba(244, 63, 94, 0.1)" : "#f43f5e"} stroke="#be123c" strokeWidth={xray ? "2" : "4"} strokeDasharray={xray ? "4 2" : "none"} />

            {/* Hidden Ovule (Inside Ovary) */}
            <g transform="translate(175, 285)">
                <ellipse cx="25" cy="35" rx="20" ry="28" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                {/* Embryo Sac */}
                <ellipse cx="25" cy="35" rx="12" ry="18" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
                
                {/* Egg Apparatus */}
                <circle cx="25" cy="46" r="4" fill="#22c55e" className={simStep === 'Fertilise' ? 'zygote-form' : ''} />
                {simStep === 'Result' && <text x="45" y="50" fontSize="8" fontWeight="bold" fill="#166534">ZYGOTE (2n)</text>}
                
                {/* Central Cell (2 Polar Nuclei) */}
                <g className={simStep === 'Fertilise' ? 'endosperm-form' : ''}>
                    <circle cx="22" cy="32" r="2.5" fill="#3b82f6" />
                    <circle cx="28" cy="32" r="2.5" fill="#3b82f6" />
                </g>
                {simStep === 'Result' && <text x="45" y="32" fontSize="8" fontWeight="bold" fill="#1d4ed8">ENDOSPERM (3n)</text>}
            </g>

            {/* Pollination Step: Pollen lands on stigma */}
            {(simStep === 'Pollinate' || simStep === 'Fertilise') && (
                <circle cx="200" cy="40" r="5" fill="#fbbf24" stroke="#d97706" />
            )}

            {/* Fertilisation Step: Pollen tube and TWO gametes */}
            {simStep === 'Fertilise' && (
                <g>
                    {/* Pollen Tube */}
                    <rect x="198" y="60" width="4" height="0" fill="#fbbf24" className="tube-animate" />
                    
                    {/* Gamete 1 (for Egg) */}
                    <circle cx="199" cy="65" r="3" fill="#ef4444" className="gamete-animate" style={{ animationDelay: '0.2s' } as any} />
                    
                    {/* Gamete 2 (for Polar Nuclei) */}
                    <circle cx="201" cy="65" r="3" fill="#3b82f6" className="gamete-animate" style={{ animationDelay: '0s' } as any} />
                </g>
            )}

            {/* Result Step: Fruit formation */}
            {simStep === 'Result' && (
                <g transform="translate(100, 240)">
                    <circle cx="100" cy="80" r="80" fill="#ef4444" opacity="0.4" />
                    <path d="M80 10 L100 30 L120 10" fill="none" stroke="#166534" strokeWidth="4" transform="translate(0, -20)" />
                    <text x="100" y="150" textAnchor="middle" fontSize="14" fontWeight="black" fill="#991b1b">RIPENED FRUIT</text>
                </g>
            )}
        </svg>
    );
};

const StatRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center text-[11px]">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="text-slate-800 font-bold">{value}</span>
    </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
            {icon}
            <span className="text-[11px] uppercase tracking-wider">{title}</span>
        </div>
        <div className="text-slate-600 leading-relaxed">
            {children}
        </div>
    </div>
);

export default GymnospermsAngiospermsLab;
