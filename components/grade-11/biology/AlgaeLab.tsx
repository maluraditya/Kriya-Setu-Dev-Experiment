import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Beaker, Droplet, Eye, Info, PauseCircle, PlayCircle, Search } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type AlgaeClass = 'Chlorophyceae' | 'Phaeophyceae' | 'Rhodophyceae';
type ReproMode = 'Vegetative' | 'Asexual' | 'Sexual';

interface AlgaeLabProps {
    topic: any;
    onExit: () => void;
}

interface AlgaeInfo {
    name: string;
    title: string;
    color: string;
    softBg: string;
    softBorder: string;
    accentText: string;
    pigments: string;
    storage: string;
    storageVisual: string;
    thallusLabel: string;
    examples: string;
    cellWall: string;
    vegetativeNote: string;
    asexualNote: string;
    sexualNote: string;
    motilitySummary: string;
}

const ALGAE_DATA: Record<AlgaeClass, AlgaeInfo> = {
    Chlorophyceae: {
        name: 'Chlorophyceae',
        title: 'Green Algae',
        color: '#22c55e',
        softBg: 'bg-green-50',
        softBorder: 'border-green-200',
        accentText: 'text-green-800',
        pigments: 'Chlorophyll a and b',
        storage: 'Starch stored in pyrenoids',
        storageVisual: 'Starch grains inside a visible pyrenoid',
        thallusLabel: 'Grass-green thallus',
        examples: 'Volvox, Chlamydomonas, Spirogyra',
        cellWall: 'Cellulose inner wall and pectose outer layer',
        vegetativeNote: 'Simple thallus growth and fragmentation can occur.',
        asexualNote: 'Zoospores swim actively with 2-8 equal apical flagella.',
        sexualNote: 'Gametes may be flagellated in many forms.',
        motilitySummary: 'Equal apical flagella',
    },
    Phaeophyceae: {
        name: 'Phaeophyceae',
        title: 'Brown Algae',
        color: '#8a5a14',
        softBg: 'bg-amber-50',
        softBorder: 'border-amber-200',
        accentText: 'text-amber-800',
        pigments: 'Chlorophyll a, c and fucoxanthin',
        storage: 'Mannitol and laminarin',
        storageVisual: 'Rounded mannitol droplets and laminarin packets',
        thallusLabel: 'Olive-brown frond',
        examples: 'Fucus, Dictyota, Ectocarpus',
        cellWall: 'Cellulose wall with algin coating',
        vegetativeNote: 'Thallus body remains attached and grows as a larger marine frond.',
        asexualNote: 'Pear-shaped zoospores move with two unequal lateral flagella.',
        sexualNote: 'Gametes are also biflagellate and laterally inserted.',
        motilitySummary: 'Two unequal lateral flagella',
    },
    Rhodophyceae: {
        name: 'Rhodophyceae',
        title: 'Red Algae',
        color: '#be123c',
        softBg: 'bg-rose-50',
        softBorder: 'border-rose-200',
        accentText: 'text-rose-800',
        pigments: 'Chlorophyll a, d and r-phycoerythrin',
        storage: 'Floridean starch',
        storageVisual: 'Dense starch granules in the cell',
        thallusLabel: 'Deep red branched body',
        examples: 'Polysiphonia, Gracilaria, Gelidium',
        cellWall: 'Cellulose, pectin and polysulphate esters',
        vegetativeNote: 'Thallus pieces may continue growth in suitable water.',
        asexualNote: 'Spores are non-motile and do not possess flagella.',
        sexualNote: 'Gametes remain stationary and only drift with water current.',
        motilitySummary: 'No flagella',
    },
};

const STEPS = [
    'Select Chlorophyceae and notice the grass-green thallus.',
    'Choose Asexual Reproduction and watch equal apical flagella on swimming zoospores.',
    'Switch to Phaeophyceae and observe olive-brown colour with pear-shaped laterally flagellated zoospores.',
    'Switch to Rhodophyceae and choose Sexual Reproduction to see non-motile gametes drifting instead of swimming.',
] as const;

const AlgaeLab: React.FC<AlgaeLabProps> = ({ topic, onExit }) => {
    const [selectedClass, setSelectedClass] = useState<AlgaeClass>('Chlorophyceae');
    const [reproMode, setReproMode] = useState<ReproMode>('Asexual');
    const [isAnimating, setIsAnimating] = useState(true);

    const activeData = ALGAE_DATA[selectedClass];

    const stageSummary = useMemo(() => {
        if (reproMode === 'Vegetative') return activeData.vegetativeNote;
        if (reproMode === 'Asexual') return activeData.asexualNote;
        return activeData.sexualNote;
    }, [activeData, reproMode]);

    const observationTitle = useMemo(() => {
        if (reproMode === 'Vegetative') {
            return 'Vegetative reproduction involves thallus fragmentation — no motile cells to observe in this phase. Switch to Asexual or Sexual mode.';
        }
        if (selectedClass === 'Chlorophyceae' && reproMode === 'Asexual') {
            return 'Notice: Zoospores swim FAST in straight paths. Look at the TOP of each cell — 2 to 8 equal-length flagella emerge from the apex (apical flagella).';
        }
        if (selectedClass === 'Chlorophyceae' && reproMode === 'Sexual') {
            return 'Gametes also swim actively with flagella. In many green algae, gametes are flagellated and motile, similar to zoospores.';
        }
        if (selectedClass === 'Phaeophyceae' && reproMode === 'Asexual') {
            return 'Notice: Pear-shaped zoospores swim with a WOBBLE. Look at the SIDE — two unequal flagella are inserted laterally (not at the top). One is longer than the other.';
        }
        if (selectedClass === 'Phaeophyceae' && reproMode === 'Sexual') {
            return 'Gametes are also biflagellate with laterally inserted unequal flagella. They wobble-swim just like zoospores.';
        }
        if (selectedClass === 'Rhodophyceae' && reproMode === 'Asexual') {
            return 'Notice: Spores have NO flagella at all. They cannot swim. They only drift passively with the water current — barely moving.';
        }
        if (selectedClass === 'Rhodophyceae' && reproMode === 'Sexual') {
            return 'Gametes are also non-motile (no flagella). They remain stationary and only drift gently. This is the key difference from green and brown algae.';
        }
        return stageSummary;
    }, [reproMode, selectedClass, stageSummary]);

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-[1.08fr_1fr] gap-3 flex-1 min-h-0">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye size={18} className="text-sky-600" />
                                Observable View
                            </div>
                            <div className="text-xs text-slate-500">Colour, thallus shape and natural appearance</div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: activeData.color }}>
                            {activeData.title}
                        </span>
                    </div>

                    <div className={`rounded-2xl border ${activeData.softBorder} ${activeData.softBg} p-2 flex-1 min-h-[170px] md:min-h-[190px]`}>
                        <MacroHabitatView selectedClass={selectedClass} activeData={activeData} />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <ValueCard label="Pigments" value={activeData.pigments} tone={activeData.accentText} />
                        <ValueCard label="Stored Food" value={activeData.storage} tone="text-slate-700" />
                        <ValueCard label="Examples" value={activeData.examples} tone="text-slate-700" />
                    </div>
                </div>

                <div className="flex flex-col gap-4 min-h-0">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex-1 min-h-0">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <div>
                                <div className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Search size={18} className="text-brand-primary" />
                                    Motility Chamber
                                </div>
                                <div className="text-xs text-slate-500">Observe spores or gametes in the selected reproductive phase</div>
                            </div>
                            <button
                                onClick={() => setIsAnimating((prev) => !prev)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
                            >
                                {isAnimating ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
                                {isAnimating ? 'Pause Motion' : 'Play Motion'}
                            </button>
                        </div>

                        <MicroscopeView
                            selectedClass={selectedClass}
                            reproMode={reproMode}
                            isAnimating={isAnimating}
                            activeData={activeData}
                        />
                    </div>

                    <div className={`rounded-2xl border ${activeData.softBorder} ${activeData.softBg} p-3 shadow-sm`}>
                        <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                            <Beaker size={18} className={activeData.accentText} />
                            Cell Detail Window
                        </div>
                        <CellDetailView selectedClass={selectedClass} activeData={activeData} />
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
                <InfoCard title="What Students Should Notice" icon={<Info size={16} className="text-sky-600" />}>
                    <p>{observationTitle}</p>
                    <p className="mt-2">The colour changes because different algae contain different pigments, and the motion changes because flagella are placed differently or completely absent.</p>
                </InfoCard>
                <InfoCard title="Scientific Logic" icon={<ArrowRight size={16} className="text-emerald-600" />}>
                    <p>Motility follows NCERT Table 3.1 style differences: apical flagella in green algae, lateral unequal flagella in brown algae, and no flagella in red algae.</p>
                    <p className="mt-2">Stored food also differs: starch in pyrenoids, mannitol-laminarin reserves, and Floridean starch.</p>
                </InfoCard>
                <InfoCard title="Current Observation" icon={<Activity size={16} className="text-amber-600" />}>
                    <p className="font-semibold text-slate-800">{selectedClass} • {reproMode}</p>
                    <p className="mt-2">{stageSummary}</p>
                </InfoCard>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col w-full h-full">
            <div className="p-4 md:p-5 flex flex-col gap-3 w-full">
                <div className="rounded-lg border border-brand-primary/20 bg-brand-light/30 px-3 py-2 text-xs text-slate-800">
                    <strong>Goal:</strong> Compare algae by <strong>colour</strong>, <strong>stored food</strong>, and whether their reproductive cells can <strong>swim</strong>, drift, or stay non-motile.
                </div>

                {/* Row 1: Class selection + Reproduction mode all in one row */}
                <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Droplet size={12} /> Algae Class
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {(['Chlorophyceae', 'Phaeophyceae', 'Rhodophyceae'] as AlgaeClass[]).map((item) => {
                                const toneMap: Record<AlgaeClass, string> = {
                                    Chlorophyceae: 'bg-green-50 border-green-500 text-green-800',
                                    Phaeophyceae: 'bg-amber-50 border-amber-500 text-amber-800',
                                    Rhodophyceae: 'bg-rose-50 border-rose-500 text-rose-800',
                                };
                                const dotMap: Record<AlgaeClass, string> = {
                                    Chlorophyceae: 'bg-green-500',
                                    Phaeophyceae: 'bg-amber-700',
                                    Rhodophyceae: 'bg-rose-600',
                                };
                                return (
                                    <button
                                        key={item}
                                        onClick={() => setSelectedClass(item)}
                                        className={`rounded-lg border-2 px-2 py-2 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                                            selectedClass === item ? toneMap[item] : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                                        }`}
                                    >
                                        <span className={`w-3 h-3 rounded-full shrink-0 ${dotMap[item]}`} />
                                        {item.replace('ceae', '')}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Activity size={12} /> Reproduction Phase
                        </label>
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                            {(['Vegetative', 'Asexual', 'Sexual'] as ReproMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setReproMode(mode)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${reproMode === mode ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Row 2: Current explanation - compact horizontal */}
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-2 text-xs text-slate-600">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Colour</div>
                        <div className="mt-0.5 font-bold text-slate-800">{activeData.thallusLabel}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Motility</div>
                        <div className="mt-0.5 font-medium">{stageSummary}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Stored Food</div>
                        <div className="mt-0.5 font-medium">{activeData.storage}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Cell Wall</div>
                        <div className="mt-0.5 font-medium">{activeData.cellWall}</div>
                    </div>
                </div>

                {/* Row 3: Quick observation steps - horizontal compact */}
                <div className="flex items-start gap-2 flex-wrap text-[11px] text-slate-600">
                    <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0 pt-0.5">Steps:</span>
                    {STEPS.map((step, index) => (
                        <span key={step} className="inline-flex items-start gap-1">
                            <span className="w-4 h-4 shrink-0 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
                            <span>{step}</span>
                        </span>
                    ))}
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

const MacroHabitatView = ({
    selectedClass,
    activeData,
}: {
    selectedClass: AlgaeClass;
    activeData: AlgaeInfo;
}) => {
    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_55%,#ecfeff_100%)]">
            <div className="absolute inset-x-0 bottom-0 h-16 md:h-20 bg-gradient-to-t from-sky-100 to-transparent" />
            <div className="absolute top-3 left-3 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm z-10">
                {activeData.thallusLabel}
            </div>

            {selectedClass === 'Chlorophyceae' && (
                <div className="absolute inset-0 flex items-center justify-center pt-8">
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-green-500/90 shadow-[0_14px_30px_rgba(34,197,94,0.25)] border-[8px] border-green-300/60">
                        <div className="absolute inset-4 rounded-full border-[3px] border-dashed border-green-200/80" />
                        <div className="absolute left-6 top-8 w-4 h-4 rounded-full bg-green-100" />
                        <div className="absolute right-7 top-10 w-4 h-4 rounded-full bg-green-100" />
                        <div className="absolute left-12 bottom-8 w-4 h-4 rounded-full bg-green-100" />
                        <div className="absolute inset-0 flex items-center justify-center text-center">
                            <span className="text-green-950 font-bold text-xs md:text-sm leading-tight">Volvox / Chlamydomonas</span>
                        </div>
                    </div>
                </div>
            )}

            {selectedClass === 'Phaeophyceae' && (
                <div className="absolute inset-0 flex items-end justify-center pb-6">
                    <div className="relative w-16 md:w-20 h-40 md:h-46 bg-amber-800 rounded-t-[40px] rounded-b-lg">
                        <div className="absolute -left-12 md:-left-16 top-8 w-14 md:w-20 h-8 md:h-10 bg-amber-700 rounded-full rotate-45" />
                        <div className="absolute -right-12 md:-right-16 top-14 w-14 md:w-20 h-8 md:h-10 bg-amber-700 rounded-full -rotate-45" />
                        <div className="absolute -left-10 md:-left-14 top-24 md:top-28 w-12 md:w-16 h-6 md:h-8 bg-amber-700 rounded-full rotate-12" />
                        <div className="absolute -right-10 md:-right-14 top-26 md:top-30 w-12 md:w-16 h-6 md:h-8 bg-amber-700 rounded-full -rotate-12" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-[10px] font-bold text-amber-100 whitespace-nowrap">
                            Fucus Frond
                        </div>
                    </div>
                </div>
            )}

            {selectedClass === 'Rhodophyceae' && (
                <div className="absolute inset-0 flex items-end justify-center pb-6">
                    <div className="relative w-28 md:w-32 h-36 md:h-40">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-34 md:h-36 bg-rose-700 rounded-full" />
                        <div className="absolute bottom-12 left-10 w-14 md:w-18 h-4 bg-rose-500 rounded-full rotate-12" />
                        <div className="absolute bottom-22 left-6 w-14 md:w-18 h-4 bg-rose-500 rounded-full -rotate-12" />
                        <div className="absolute bottom-16 right-6 w-14 md:w-18 h-4 bg-rose-500 rounded-full -rotate-12" />
                        <div className="absolute bottom-28 right-8 w-12 md:w-14 h-4 bg-rose-500 rounded-full rotate-12" />
                        <div className="absolute inset-x-0 bottom-1 text-center text-[10px] font-bold text-rose-950">
                            Polysiphonia
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MicroscopeView = ({
    selectedClass,
    reproMode,
    isAnimating,
    activeData,
}: {
    selectedClass: AlgaeClass;
    reproMode: ReproMode;
    isAnimating: boolean;
    activeData: AlgaeInfo;
}) => {
    const chamberTone =
        selectedClass === 'Chlorophyceae'
            ? 'from-green-50 via-white to-green-100'
            : selectedClass === 'Phaeophyceae'
                ? 'from-amber-50 via-white to-yellow-100'
                : 'from-rose-50 via-white to-rose-100';

    /* Motility label for the HUD */
    const motilityLabel = selectedClass === 'Chlorophyceae'
        ? 'Active swimming (fast, straight paths)'
        : selectedClass === 'Phaeophyceae'
            ? 'Active swimming (lateral wobble)'
            : 'Non-motile (passive drift only)';

    return (
        <div className={`relative h-[190px] md:h-[210px] rounded-xl border border-slate-200 bg-gradient-to-br ${chamberTone} overflow-hidden`}>
            <style>{`
                /* Green algae: fast, purposeful, straight-line swimming */
                @keyframes algae-swim-apical {
                    0%   { transform: translate(0, 0) rotate(0deg); }
                    15%  { transform: translate(18px, -6px) rotate(2deg); }
                    30%  { transform: translate(34px, 2px) rotate(-1deg); }
                    50%  { transform: translate(14px, 12px) rotate(1deg); }
                    70%  { transform: translate(-8px, 4px) rotate(-2deg); }
                    85%  { transform: translate(-16px, -4px) rotate(1deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }
                /* Brown algae: lateral wobble from unequal lateral flagella */
                @keyframes algae-swim-lateral {
                    0%   { transform: translate(0, 0) rotate(0deg); }
                    12%  { transform: translate(8px, -3px) rotate(8deg); }
                    25%  { transform: translate(16px, 4px) rotate(-6deg); }
                    37%  { transform: translate(10px, 10px) rotate(10deg); }
                    50%  { transform: translate(-2px, 6px) rotate(-8deg); }
                    62%  { transform: translate(-12px, 0px) rotate(6deg); }
                    75%  { transform: translate(-8px, -6px) rotate(-10deg); }
                    87%  { transform: translate(-4px, -2px) rotate(4deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }
                /* Red algae: barely perceptible Brownian drift (non-motile) */
                @keyframes algae-brownian {
                    0%, 100% { transform: translate(0, 0); }
                    25% { transform: translate(1.5px, 1px); }
                    50% { transform: translate(-1px, 2px); }
                    75% { transform: translate(0.5px, -1px); }
                }
                /* Flagella wiggle for green algae */
                @keyframes flagella-wiggle {
                    0%, 100% { transform: translateX(-50%) translateY(-8px) rotate(var(--base-rot)); }
                    25% { transform: translateX(-50%) translateY(-8px) rotate(calc(var(--base-rot) + 12deg)); }
                    50% { transform: translateX(-50%) translateY(-8px) rotate(calc(var(--base-rot) - 8deg)); }
                    75% { transform: translateX(-50%) translateY(-8px) rotate(calc(var(--base-rot) + 6deg)); }
                }
                /* Lateral flagella wave for brown algae */
                @keyframes lateral-flagella-wave {
                    0%, 100% { transform: rotate(var(--base-rot)); }
                    33% { transform: rotate(calc(var(--base-rot) + 15deg)); }
                    66% { transform: rotate(calc(var(--base-rot) - 12deg)); }
                }
                .animate-swim-apical {
                    animation: algae-swim-apical linear infinite;
                }
                .animate-swim-lateral {
                    animation: algae-swim-lateral linear infinite;
                }
                .animate-brownian {
                    animation: algae-brownian ease-in-out infinite;
                }
                .flagella-wiggle {
                    animation: flagella-wiggle 0.3s ease-in-out infinite;
                }
                .lateral-flagella-wave {
                    animation: lateral-flagella-wave 0.5s ease-in-out infinite;
                }
            `}</style>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />

            {reproMode === 'Vegetative' ? (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="max-w-sm rounded-2xl border border-slate-200 bg-white/90 p-5 text-center shadow-sm">
                        <div className="mx-auto mb-3 w-20 h-5 rounded-full bg-slate-300 relative overflow-hidden">
                            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white" />
                        </div>
                        <div className="text-sm font-bold text-slate-700">Vegetative phase — no motile cells</div>
                        <div className="mt-2 text-xs text-slate-500">
                            Switch to <strong>Asexual</strong> or <strong>Sexual</strong> mode to observe motility differences between zoospores and gametes.
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <ParticleItem index={0} selectedClass={selectedClass} reproMode={reproMode} isAnimating={isAnimating} />
                    <ParticleItem index={1} selectedClass={selectedClass} reproMode={reproMode} isAnimating={isAnimating} />
                    <ParticleItem index={2} selectedClass={selectedClass} reproMode={reproMode} isAnimating={isAnimating} />
                    <ParticleItem index={3} selectedClass={selectedClass} reproMode={reproMode} isAnimating={isAnimating} />
                    <ParticleItem index={4} selectedClass={selectedClass} reproMode={reproMode} isAnimating={isAnimating} />
                </>
            )}

            <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span><strong>Shape:</strong> {particleShapeLabel(selectedClass, reproMode)}</span>
                    <span><strong>Flagella:</strong> {activeData.motilitySummary}</span>
                    <span><strong>Motion:</strong> {reproMode === 'Vegetative' ? 'N/A' : motilityLabel}</span>
                </div>
            </div>
        </div>
    );
};

const ParticleItem = ({
    index,
    selectedClass,
    reproMode,
    isAnimating,
}: {
    index: number;
    selectedClass: AlgaeClass;
    reproMode: ReproMode;
    isAnimating: boolean;
}) => {
    const positions = [
        { left: '8%', top: '12%' },
        { left: '24%', top: '36%' },
        { left: '42%', top: '14%' },
        { left: '58%', top: '38%' },
        { left: '74%', top: '10%' },
    ];

    /* Each class uses a totally different animation:
       - Green (Chlorophyceae): fast, purposeful apical swimming
       - Brown (Phaeophyceae): lateral wobble from unequal side flagella
       - Red  (Rhodophyceae): near-stationary Brownian drift (non-motile) */
    const animationClass = selectedClass === 'Chlorophyceae'
        ? 'animate-swim-apical'
        : selectedClass === 'Phaeophyceae'
            ? 'animate-swim-lateral'
            : 'animate-brownian';

    const duration = selectedClass === 'Chlorophyceae'
        ? '3s'    /* fast swimming */
        : selectedClass === 'Phaeophyceae'
            ? '4.5s' /* medium wobble-swim */
            : '12s'; /* very slow, passive drift */

    const style: React.CSSProperties = {
        left: positions[index].left,
        top: positions[index].top,
        animationDelay: `${index * 0.6}s`,
        animationDuration: duration,
        animationPlayState: isAnimating ? 'running' : 'paused',
    };

    return (
        <div className={`absolute ${animationClass}`} style={style}>
            {selectedClass === 'Chlorophyceae' && (
                <GreenParticle flagellaCount={reproMode === 'Asexual' ? 6 : 2 + (index % 3)} isAnimating={isAnimating} />
            )}
            {selectedClass === 'Phaeophyceae' && <BrownParticle isAnimating={isAnimating} />}
            {selectedClass === 'Rhodophyceae' && <RedParticle />}
        </div>
    );
};

/* ── Green Algae Particle ─────────────────────────────────────
   Round cell body with APICAL flagella emerging from the TOP.
   Flagella are equal length and wiggle when animating. */
const GreenParticle = ({ flagellaCount, isAnimating }: { flagellaCount: number; isAnimating: boolean }) => (
    <div className="relative w-12 h-14">
        {/* Flagella — emerge from the TOP (apex) of the cell */}
        {Array.from({ length: flagellaCount }).map((_, idx) => {
            const spread = -25 + idx * (50 / Math.max(1, flagellaCount - 1));
            return (
                <div
                    key={idx}
                    className={`absolute left-1/2 top-0 w-[1.5px] h-5 bg-green-900 origin-bottom rounded-full ${isAnimating ? 'flagella-wiggle' : ''}`}
                    style={{
                        '--base-rot': `${spread}deg`,
                        animationDelay: `${idx * 0.05}s`,
                    } as React.CSSProperties}
                />
            );
        })}
        {/* Cell body */}
        <div className="absolute left-1 right-1 top-4 bottom-0 rounded-full bg-green-500 border-2 border-green-700 shadow-md" />
        {/* Nucleus dot */}
        <div className="absolute left-1/2 top-7 w-2.5 h-2.5 -translate-x-1/2 rounded-full bg-green-900/40" />
        {/* Label: "Apical" pointer */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[7px] font-bold text-green-900 whitespace-nowrap opacity-60">↑ apical</div>
    </div>
);

/* ── Brown Algae Particle ─────────────────────────────────────
   PEAR-SHAPED cell body with TWO UNEQUAL flagella on the SIDE.
   Flagella wave laterally when animating. */
const BrownParticle = ({ isAnimating }: { isAnimating: boolean }) => (
    <div className="relative w-14 h-14">
        {/* Pear-shaped cell body (narrower top, wider bottom) */}
        <div className="absolute left-3 right-3 top-2 bottom-1 bg-amber-700 border-2 border-amber-900 rounded-t-[40%] rounded-b-[55%] shadow-md" />
        {/* Nucleus */}
        <div className="absolute left-1/2 top-5 w-2 h-2 -translate-x-1/2 rounded-full bg-amber-950/40" />
        {/* LATERAL flagellum 1 — LONG (right side, upper) */}
        <div
            className={`absolute top-4 right-0 w-9 h-[1.5px] bg-amber-950 origin-left rounded-full ${isAnimating ? 'lateral-flagella-wave' : ''}`}
            style={{ '--base-rot': '8deg' } as React.CSSProperties}
        />
        {/* LATERAL flagellum 2 — SHORT (right side, lower) */}
        <div
            className={`absolute top-7 right-1 w-5 h-[1.5px] bg-amber-950 origin-left rounded-full ${isAnimating ? 'lateral-flagella-wave' : ''}`}
            style={{ '--base-rot': '-12deg', animationDelay: '0.15s' } as React.CSSProperties}
        />
        {/* Label: "lateral" pointer */}
        <div className="absolute top-2 -right-2 text-[7px] font-bold text-amber-900 whitespace-nowrap opacity-60">← lateral</div>
    </div>
);

/* ── Red Algae Particle ───────────────────────────────────────
   Simple round cell with NO flagella at all.
   Completely non-motile — the parent animation is Brownian drift. */
const RedParticle = () => (
    <div className="relative w-10 h-10">
        {/* Cell body — plain circle, no appendages */}
        <div className="absolute inset-1 rounded-full bg-rose-500 border-2 border-rose-800 shadow-md" />
        {/* Nucleus dot */}
        <div className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-900/40" />
        {/* Label: "no flagella" */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-bold text-rose-900 whitespace-nowrap opacity-60">no flagella</div>
    </div>
);

const CellDetailView = ({
    selectedClass,
    activeData,
}: {
    selectedClass: AlgaeClass;
    activeData: AlgaeInfo;
}) => {
    return (
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-3 items-center">
            <div className="rounded-xl border border-white bg-white/80 p-3 shadow-sm">
                {selectedClass === 'Chlorophyceae' && <GreenCellDiagram />}
                {selectedClass === 'Phaeophyceae' && <BrownCellDiagram />}
                {selectedClass === 'Rhodophyceae' && <RedCellDiagram />}
            </div>
            <div className="space-y-2 text-xs md:text-sm text-slate-600">
                <p><strong className="text-slate-800">Stored food:</strong> {activeData.storage}</p>
                <p><strong className="text-slate-800">Cell wall:</strong> {activeData.cellWall}</p>
                <p><strong className="text-slate-800">Microscope clue:</strong> {activeData.storageVisual}</p>
                <p className="text-xs text-slate-500">This panel helps students connect colour and motility with the internal cell machinery.</p>
            </div>
        </div>
    );
};

const GreenCellDiagram = () => (
    <svg viewBox="0 0 280 150" className="w-full h-[120px] md:h-[135px]">
        <rect x="22" y="24" width="236" height="102" rx="20" fill="#dcfce7" stroke="#22c55e" strokeWidth="4" />
        <ellipse cx="96" cy="75" rx="54" ry="28" fill="#22c55e" opacity="0.95" />
        <ellipse cx="184" cy="75" rx="50" ry="24" fill="#4ade80" opacity="0.95" />
        <circle cx="184" cy="76" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="3" />
        <circle cx="184" cy="76" r="5" fill="#ffffff" />
        <text x="184" y="42" textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534">Pyrenoid</text>
        <text x="68" y="116" textAnchor="middle" fontSize="13" fontWeight="700" fill="#166534">Chloroplast</text>
    </svg>
);

const BrownCellDiagram = () => (
    <svg viewBox="0 0 280 150" className="w-full h-[120px] md:h-[135px]">
        <rect x="22" y="24" width="236" height="102" rx="20" fill="#fef3c7" stroke="#b45309" strokeWidth="4" />
        <ellipse cx="92" cy="75" rx="46" ry="22" fill="#a16207" opacity="0.9" />
        <ellipse cx="164" cy="68" rx="14" ry="14" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
        <ellipse cx="194" cy="88" rx="18" ry="13" fill="#fcd34d" stroke="#b45309" strokeWidth="2" />
        <rect x="208" y="54" width="18" height="28" rx="8" fill="#fef08a" stroke="#a16207" strokeWidth="2" />
        <text x="110" y="116" textAnchor="middle" fontSize="13" fontWeight="700" fill="#78350f">Fucoxanthin-rich plastid</text>
        <text x="190" y="44" textAnchor="middle" fontSize="12" fontWeight="800" fill="#78350f">Mannitol / Laminarin</text>
    </svg>
);

const RedCellDiagram = () => (
    <svg viewBox="0 0 280 150" className="w-full h-[120px] md:h-[135px]">
        <rect x="22" y="24" width="236" height="102" rx="20" fill="#ffe4e6" stroke="#be123c" strokeWidth="4" />
        <ellipse cx="96" cy="75" rx="50" ry="24" fill="#be123c" opacity="0.92" />
        <ellipse cx="168" cy="74" rx="54" ry="26" fill="#fb7185" opacity="0.88" />
        <circle cx="172" cy="68" r="6" fill="#fda4af" />
        <circle cx="190" cy="84" r="5" fill="#fda4af" />
        <circle cx="208" cy="68" r="6" fill="#fecdd3" />
        <text x="168" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#881337">r-Phycoerythrin</text>
        <text x="198" y="116" textAnchor="middle" fontSize="13" fontWeight="700" fill="#881337">Floridean starch</text>
    </svg>
);

const ValueCard = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
        <div className={`mt-1 text-xs md:text-sm font-bold break-words ${tone}`}>{value}</div>
    </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-xs md:text-sm text-slate-600 leading-relaxed min-w-0">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

function particleShapeLabel(selectedClass: AlgaeClass, reproMode: ReproMode) {
    if (reproMode === 'Vegetative') return 'Thallus fragment';
    if (selectedClass === 'Chlorophyceae') return 'Round / oval zoospore';
    if (selectedClass === 'Phaeophyceae') return 'Pear-shaped zoospore';
    return reproMode === 'Sexual' ? 'Non-motile gamete' : 'Non-motile spore';
}

export default AlgaeLab;
