import React, { useMemo, useState } from 'react';
import { ArrowRight, Droplets, Eye, Leaf, MoveVertical, RefreshCcw, Trees } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type FocusPlant = 'Bryophyte' | 'Pteridophyte';
type LifeStage = 'Spore' | 'Gametophyte' | 'Fertilisation' | 'Sporophyte';

interface BryophytesPteridophytesLabProps {
    topic: any;
    onExit: () => void;
}

const STAGES: LifeStage[] = ['Spore', 'Gametophyte', 'Fertilisation', 'Sporophyte'];

const stageDescriptions: Record<LifeStage, string> = {
    Spore: 'The haploid spores germinate to form the gametophyte. In bryophytes, spores form the protonema first. In pteridophytes, each spore directly forms the prothallus.',
    Gametophyte: 'Bryophytes have a large, visible gametophyte (dominant phase). In pteridophytes, the gametophyte is a small, inconspicuous, heart-shaped structure called the prothallus (independent, free-living, photosynthetic).',
    Fertilisation: 'Water is essential for fertilisation in both groups: male gametes (antherozoids) must swim through a film of water to reach the archegonium.',
    Sporophyte: 'The sporophyte is dependent on gametophyte in bryophytes. In pteridophytes, the sporophyte is the dominant, independent plant body. Some pteridophytes (e.g., Selaginella) produce two kinds of spores — microspores and megaspores — a phenomenon called heterospory.',
};

const BryophytesPteridophytesLab: React.FC<BryophytesPteridophytesLabProps> = ({ topic, onExit }) => {
    const [focusPlant, setFocusPlant] = useState<FocusPlant>('Bryophyte');
    const [targetHeight, setTargetHeight] = useState(70);
    const [soilMoisture, setSoilMoisture] = useState(65);
    const [showVascularView, setShowVascularView] = useState(true);
    const [stageIndex, setStageIndex] = useState(1);

    const stage = STAGES[stageIndex];
    // NCERT: Bryophytes have no vascular tissue so water cannot be transported efficiently at height.
    // The simulation shows this qualitatively — bryophytes always stay shorter than pteridophytes.
    const bryophyteActualHeight = Math.min(targetHeight, Math.round(targetHeight * 0.45)); // always cap at ~45% of target to show height limit
    const pteridophyteActualHeight = targetHeight;
    const bryophyteWilts = targetHeight > 60; // arbitrary threshold removed — wilts whenever height is significant
    const waterReady = soilMoisture >= 45;

    const focusSummary = useMemo(() => {
        if (focusPlant === 'Bryophyte') {
            return {
                title: 'Bryophyte Focus',
                dominantPhase: 'Dominant phase: Gametophyte (n)',
                transport: bryophyteWilts
                    ? 'Bryophytes cannot grow tall because they lack vascular tissue (xylem and phloem). Water cannot be transported efficiently over long distances in the plant body.'
                    : 'The short plant body survives because water can move over the small distances involved without needing vascular tissue.',
                structure: 'No true roots, stems, or leaves. Rhizoids are present instead of true roots.',
            };
        }

        return {
            title: 'Pteridophyte Focus',
            dominantPhase: 'Dominant phase: Sporophyte (2n)',
            transport: 'Xylem and phloem help water and minerals move up to taller leaves.',
            structure: 'True roots, stem, and leaves are present along with vascular tissues.',
        };
    }, [bryophyteWilts, focusPlant]);

    const resetSimulation = () => {
        setFocusPlant('Bryophyte');
        setTargetHeight(70);
        setSoilMoisture(65);
        setShowVascularView(true);
        setStageIndex(1);
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-3 flex-1 min-h-0 auto-rows-fr">
                <PlantPanel
                    title="Bryophyte"
                    subtitle="Moss / Funaria type body"
                    dominantLabel="Large visible gametophyte"
                    waterLabel={bryophyteWilts ? 'Water stream stops early' : 'Water reaches the top'}
                    accent="emerald"
                    stage={stage}
                    actualHeight={bryophyteActualHeight}
                    targetHeight={targetHeight}
                    soilMoisture={soilMoisture}
                    showVascularView={showVascularView}
                    waterReady={waterReady}
                    isWilting={bryophyteWilts}
                    focus={focusPlant === 'Bryophyte'}
                    onFocus={() => setFocusPlant('Bryophyte')}
                    renderScene={() => (
                        <BryophyteScene
                            stage={stage}
                            actualHeight={bryophyteActualHeight}
                            targetHeight={targetHeight}
                            showVascularView={showVascularView}
                            waterReady={waterReady}
                            isWilting={bryophyteWilts}
                        />
                    )}
                />

                <PlantPanel
                    title="Pteridophyte"
                    subtitle="Fern / Dryopteris type body"
                    dominantLabel="Large visible sporophyte"
                    waterLabel="Water stream reaches the top"
                    accent="sky"
                    stage={stage}
                    actualHeight={pteridophyteActualHeight}
                    targetHeight={targetHeight}
                    soilMoisture={soilMoisture}
                    showVascularView={showVascularView}
                    waterReady={waterReady}
                    isWilting={false}
                    focus={focusPlant === 'Pteridophyte'}
                    onFocus={() => setFocusPlant('Pteridophyte')}
                    renderScene={() => (
                        <PteridophyteScene
                            stage={stage}
                            actualHeight={pteridophyteActualHeight}
                            showVascularView={showVascularView}
                            waterReady={waterReady}
                        />
                    )}
                />
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
                <InfoCard title={focusSummary.title} icon={<Leaf size={16} className="text-emerald-600" />}>
                    <p>{focusSummary.dominantPhase}</p>
                    <p className="mt-2">{focusSummary.structure}</p>
                </InfoCard>
                <InfoCard title="Stage Note" icon={<ArrowRight size={16} className="text-sky-600" />}>
                    <p className="font-semibold text-slate-800">{stage}</p>
                    <p className="mt-2">{stageDescriptions[stage]}</p>
                </InfoCard>
                <InfoCard title="Main Observation" icon={<Eye size={16} className="text-amber-600" />}>
                    <p>{focusSummary.transport}</p>
                    <p className="mt-2">{waterReady ? 'Soil moisture is enough for fertilisation.' : 'Low moisture makes fertilisation difficult in both groups.'}</p>
                </InfoCard>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full h-full">
            <div className="p-4 md:p-5 flex flex-col gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                    <strong>Core Idea:</strong> Bryophytes lack vascular tissue and stay short (called the "amphibians of the plant kingdom"). Pteridophytes have xylem and phloem and grow taller.
                </div>

                {/* Row 1: Focus buttons + Vascular + Reset */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                        onClick={() => setFocusPlant('Bryophyte')}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${focusPlant === 'Bryophyte' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}
                    >
                        Focus Bryophyte
                    </button>
                    <button
                        onClick={() => setFocusPlant('Pteridophyte')}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${focusPlant === 'Pteridophyte' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'}`}
                    >
                        Focus Pteridophyte
                    </button>
                    <button
                        onClick={() => setShowVascularView((prev) => !prev)}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${showVascularView ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                        {showVascularView ? 'Vascular: ON' : 'Vascular: OFF'}
                    </button>
                    <button
                        onClick={resetSimulation}
                        className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                    >
                        <RefreshCcw size={13} />
                        Reset
                    </button>
                </div>

                {/* Row 2: Sliders side by side */}
                <div className="grid md:grid-cols-2 gap-3">
                    <SliderBlock
                        label="Height Challenge"
                        value={`${targetHeight} cm`}
                        icon={<MoveVertical size={14} className="text-slate-500" />}
                        minLabel="20 cm"
                        maxLabel="150 cm"
                    >
                        <input
                            type="range"
                            min="20"
                            max="150"
                            step="1"
                            value={targetHeight}
                            onChange={(e) => setTargetHeight(parseInt(e.target.value, 10))}
                            className="w-full accent-emerald-600"
                        />
                    </SliderBlock>

                    <SliderBlock
                        label="Soil Moisture"
                        value={`${soilMoisture}%`}
                        icon={<Droplets size={14} className="text-slate-500" />}
                        minLabel="Dry"
                        maxLabel="Very Moist"
                    >
                        <input
                            type="range"
                            min="20"
                            max="100"
                            step="1"
                            value={soilMoisture}
                            onChange={(e) => setSoilMoisture(parseInt(e.target.value, 10))}
                            className="w-full accent-sky-600"
                        />
                    </SliderBlock>
                </div>

                {/* Row 3: Life Cycle Stages – all horizontal */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-700 shrink-0">Life Cycle:</span>
                    {STAGES.map((item, index) => (
                        <button
                            key={item}
                            onClick={() => setStageIndex(index)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${index === stageIndex ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                        >
                            {item}
                        </button>
                    ))}
                    <button
                        onClick={() => setStageIndex((prev) => (prev + 1) % STAGES.length)}
                        className="rounded-lg bg-indigo-100 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-200 transition-colors ml-auto"
                    >
                        Next →
                    </button>
                </div>

                {/* Row 4: Quick facts side by side */}
                <div className="grid md:grid-cols-2 gap-2">
                    <MiniFact icon={<Trees size={14} className="text-emerald-600" />} title="Bryophytes">
                        Gametophyte is dominant and the sporophyte remains attached for nutrition.
                    </MiniFact>
                    <MiniFact icon={<Trees size={14} className="text-sky-600" />} title="Pteridophytes">
                        Sporophyte is dominant and has true roots, stem, leaves, xylem, and phloem.
                    </MiniFact>
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

const PlantPanel = ({
    title,
    subtitle,
    dominantLabel,
    waterLabel,
    accent,
    actualHeight,
    targetHeight,
    soilMoisture,
    stage,
    showVascularView,
    waterReady,
    isWilting,
    focus,
    onFocus,
    renderScene,
}: {
    title: string;
    subtitle: string;
    dominantLabel: string;
    waterLabel: string;
    accent: 'emerald' | 'sky';
    actualHeight: number;
    targetHeight: number;
    soilMoisture: number;
    stage: LifeStage;
    showVascularView: boolean;
    waterReady: boolean;
    isWilting: boolean;
    focus: boolean;
    onFocus: () => void;
    renderScene: () => React.ReactNode;
}) => {
    const tone = accent === 'emerald'
        ? {
              chip: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              border: focus ? 'border-emerald-400' : 'border-slate-200',
              ring: focus ? 'ring-2 ring-emerald-200' : '',
          }
        : {
              chip: 'bg-sky-100 text-sky-800 border-sky-200',
              border: focus ? 'border-sky-400' : 'border-slate-200',
              ring: focus ? 'ring-2 ring-sky-200' : '',
          };

    return (
        <div className={`bg-white rounded-2xl border ${tone.border} ${tone.ring} shadow-sm p-3 flex flex-col min-h-0 overflow-hidden`}>
            <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                    <div className="text-base lg:text-lg font-bold text-slate-900">{title}</div>
                    <div className="text-xs text-slate-500">{subtitle}</div>
                </div>
                <button
                    onClick={onFocus}
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${tone.chip}`}
                >
                    {focus ? 'Focused' : 'Focus'}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2 shrink-0">
                <MetricBadge label="Requested Height" value={`${targetHeight} cm`} />
                <MetricBadge label="Visible Height" value={`${Math.round(actualHeight)} cm`} />
                <MetricBadge label="Life Stage" value={stage} />
                <MetricBadge label="Soil Moisture" value={`${soilMoisture}%`} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50 via-white to-emerald-50 p-2 flex-1 min-h-[200px] lg:min-h-[220px]">
                {renderScene()}
            </div>

            <div className="grid sm:grid-cols-2 gap-2 mt-2 shrink-0">
                <div className={`rounded-xl border px-3 py-2 text-xs ${tone.chip}`}>
                    <div className="font-bold">Dominance</div>
                    <div className="mt-1">{dominantLabel}</div>
                </div>
                <div className={`rounded-xl border px-3 py-2 text-xs ${isWilting ? 'bg-amber-100 text-amber-900 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    <div className="font-bold">Water Transport</div>
                    <div className="mt-1">{waterLabel}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    <div className="font-bold">Vascular View</div>
                    <div className="mt-1">{showVascularView ? 'Visible in the diagram' : 'Hidden for a clean external view'}</div>
                </div>
                <div className={`rounded-xl border px-3 py-2 text-xs ${waterReady ? 'bg-sky-100 text-sky-900 border-sky-200' : 'bg-rose-100 text-rose-900 border-rose-200'}`}>
                    <div className="font-bold">Fertilisation</div>
                    <div className="mt-1">{waterReady ? 'Water is available for gamete movement.' : 'Low moisture reduces chances of fertilisation.'}</div>
                </div>
            </div>
        </div>
    );
};

const BryophyteScene = ({
    stage,
    actualHeight,
    targetHeight,
    showVascularView,
    waterReady,
    isWilting,
}: {
    stage: LifeStage;
    actualHeight: number;
    targetHeight: number;
    showVascularView: boolean;
    waterReady: boolean;
    isWilting: boolean;
}) => {
    const actualPx = 55 + actualHeight * 1.1;
    const targetPx = 55 + targetHeight * 1.1;
    const capY = 250 - actualPx;
    const targetY = 250 - targetPx;

    return (
        <svg viewBox="0 0 320 320" className="w-full h-full">
            <rect x="18" y="240" width="284" height="48" rx="12" fill="#8b5a3c" />
            <rect x="18" y="252" width="284" height="36" rx="10" fill="#6f4a32" opacity="0.6" />

            <line x1="88" y1="250" x2="88" y2={capY} stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" opacity="0.9" />
            <circle cx="88" cy={capY} r="7" fill="#7dd3fc" />

            {stage === 'Spore' && (
                <>
                    <circle cx="150" cy="220" r="10" fill="#a16207" />
                    <circle cx="170" cy="214" r="8" fill="#ca8a04" />
                    <circle cx="190" cy="224" r="9" fill="#d97706" />
                    <text x="160" y="195" textAnchor="middle" fontSize="15" fontWeight="700" fill="#475569">Spores</text>
                </>
            )}

            {stage !== 'Spore' && (
                <>
                    <ellipse cx="150" cy={250 - actualPx * 0.28} rx="60" ry="30" fill="#22c55e" />
                    <ellipse cx="110" cy={250 - actualPx * 0.24} rx="24" ry="18" fill="#16a34a" />
                    <ellipse cx="190" cy={250 - actualPx * 0.22} rx="28" ry="19" fill="#16a34a" />
                    <ellipse cx="150" cy={250 - actualPx * 0.38} rx="38" ry="18" fill="#4ade80" />
                    <text x="150" y={250 - actualPx * 0.24} textAnchor="middle" fontSize="18" fontWeight="700" fill="#064e3b">(n)</text>
                </>
            )}

            {stage === 'Fertilisation' && (
                <>
                    <circle cx="230" cy="105" r="10" fill={waterReady ? '#60a5fa' : '#fca5a5'} />
                    <path d="M230 88 C224 98 220 104 230 115 C240 104 236 98 230 88Z" fill={waterReady ? '#60a5fa' : '#fca5a5'} />
                    <text x="230" y="130" textAnchor="middle" fontSize="13" fontWeight="700" fill="#475569">
                        {waterReady ? 'Water present' : 'Too dry'}
                    </text>
                </>
            )}

            {stage === 'Sporophyte' && (
                <>
                    <line x1="150" y1={250 - actualPx * 0.48} x2="150" y2={250 - actualPx * 0.92} stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" />
                    <ellipse cx="150" cy={250 - actualPx * 0.98} rx="18" ry="12" fill="#f59e0b" />
                    <text x="182" y={250 - actualPx * 0.92} fontSize="16" fontWeight="700" fill="#6d28d9">(2n)</text>
                </>
            )}

            {isWilting && (
                <>
                    <line x1="230" y1="250" x2="230" y2={targetY} stroke="#cbd5e1" strokeWidth="3" strokeDasharray="8 6" />
                    <path d={`M230 ${targetY} C244 ${targetY - 8} 258 ${targetY + 18} 240 ${targetY + 32}`} fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
                    <text x="242" y={targetY - 10} fontSize="13" fontWeight="700" fill="#b45309">Wilting</text>
                </>
            )}

            {showVascularView && (
                <g>
                    <rect x="15" y="15" width="60" height="75" rx="10" fill="#f8fafc" stroke="#cbd5e1" />
                    <text x="45" y="32" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f172a">Internal View</text>
                    <text x="45" y="52" textAnchor="middle" fontSize="9" fill="#475569">No xylem</text>
                    <text x="45" y="65" textAnchor="middle" fontSize="9" fill="#475569">No phloem</text>
                </g>
            )}
        </svg>
    );
};

const PteridophyteScene = ({
    stage,
    actualHeight,
    showVascularView,
    waterReady,
}: {
    stage: LifeStage;
    actualHeight: number;
    showVascularView: boolean;
    waterReady: boolean;
}) => {
    const plantPx = 70 + actualHeight * 1.1;
    const stemTopY = 250 - plantPx;

    return (
        <svg viewBox="0 0 320 320" className="w-full h-full">
            <rect x="18" y="240" width="284" height="48" rx="12" fill="#8b5a3c" />
            <rect x="18" y="252" width="284" height="36" rx="10" fill="#6f4a32" opacity="0.6" />

            <line x1="160" y1="250" x2="160" y2={stemTopY} stroke="#0f766e" strokeWidth="10" strokeLinecap="round" />
            <line x1="118" y1="250" x2="118" y2={stemTopY + 20} stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" opacity="0.9" />
            <circle cx="118" cy={stemTopY + 20} r="7" fill="#7dd3fc" />

            {stage === 'Spore' && (
                <>
                    <circle cx="148" cy="212" r="8" fill="#92400e" />
                    <circle cx="164" cy="220" r="7" fill="#b45309" />
                    <circle cx="180" cy="214" r="8" fill="#d97706" />
                    <text x="164" y="194" textAnchor="middle" fontSize="15" fontWeight="700" fill="#475569">Spores</text>
                </>
            )}

            {stage === 'Gametophyte' && (
                <>
                    <path d="M160 225 C145 205 118 216 126 238 C134 256 153 255 160 243 C167 255 186 256 194 238 C202 216 175 205 160 225Z" fill="#86efac" stroke="#16a34a" strokeWidth="3" />
                    <text x="160" y="208" textAnchor="middle" fontSize="16" fontWeight="700" fill="#166534">(n)</text>
                    <text x="160" y="268" textAnchor="middle" fontSize="13" fill="#475569">Prothallus</text>
                </>
            )}

            {(stage === 'Fertilisation' || stage === 'Sporophyte') && (
                <>
                    <path d={`M160 ${stemTopY + 22} C128 ${stemTopY + 48} 112 ${stemTopY + 78} 104 ${stemTopY + 106}`} fill="none" stroke="#16a34a" strokeWidth="8" strokeLinecap="round" />
                    <path d={`M160 ${stemTopY + 40} C194 ${stemTopY + 58} 210 ${stemTopY + 88} 220 ${stemTopY + 116}`} fill="none" stroke="#16a34a" strokeWidth="8" strokeLinecap="round" />
                    <path d={`M160 ${stemTopY + 74} C132 ${stemTopY + 94} 122 ${stemTopY + 126} 116 ${stemTopY + 144}`} fill="none" stroke="#22c55e" strokeWidth="7" strokeLinecap="round" />
                    <path d={`M160 ${stemTopY + 86} C188 ${stemTopY + 102} 206 ${stemTopY + 132} 214 ${stemTopY + 150}`} fill="none" stroke="#22c55e" strokeWidth="7" strokeLinecap="round" />
                    <text x="178" y={stemTopY + 16} fontSize="18" fontWeight="700" fill="#0f766e">(2n)</text>
                </>
            )}

            {stage === 'Fertilisation' && (
                <>
                    <circle cx="240" cy="98" r="10" fill={waterReady ? '#60a5fa' : '#fca5a5'} />
                    <path d="M240 81 C234 91 230 97 240 108 C250 97 246 91 240 81Z" fill={waterReady ? '#60a5fa' : '#fca5a5'} />
                </>
            )}

            {showVascularView && (
                <g>
                    <rect x="15" y="15" width="65" height="95" rx="10" fill="#f8fafc" stroke="#cbd5e1" />
                    <text x="47.5" y="32" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f172a">Vascular View</text>
                    <rect x="30" y="45" width="10" height="38" rx="5" fill="#38bdf8" />
                    <rect x="55" y="45" width="10" height="38" rx="5" fill="#f59e0b" />
                    <text x="35" y="98" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a">X</text>
                    <text x="60" y="98" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a">P</text>
                </g>
            )}
        </svg>
    );
};

const SliderBlock = ({
    label,
    value,
    icon,
    minLabel,
    maxLabel,
    children,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    minLabel: string;
    maxLabel: string;
    children: React.ReactNode;
}) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                {icon}
                {label}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-mono text-slate-700">{value}</div>
        </div>
        {children}
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
        </div>
    </div>
);

const MetricBadge = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
        <div className="mt-1 text-xs md:text-sm font-bold text-slate-800 break-words">{value}</div>
    </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-xs md:text-sm text-slate-600 leading-relaxed h-full min-w-0">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

const MiniFact = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

export default BryophytesPteridophytesLab;
