import React, { useMemo, useState } from 'react';
import { ArrowRight, Leaf, RotateCcw, Shield, Sprout, Trees, Waves } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type SeedType = 'Mustard' | 'Wheat';
type PhyllotaxyType = 'Alternate' | 'Opposite' | 'Whorled';
type ScenarioType = 'None' | 'Goat' | 'Trellis';
type ModificationType = 'Natural' | 'Climb Mode' | 'Protect Mode';

interface MorphologyFloweringPlantsLabProps {
    topic: any;
    onExit: () => void;
}

const MorphologyFloweringPlantsLab: React.FC<MorphologyFloweringPlantsLabProps> = ({ topic, onExit }) => {
    const [selectedSeed, setSelectedSeed] = useState<SeedType>('Mustard');
    const [growthLevel, setGrowthLevel] = useState(65);
    const [phyllotaxy, setPhyllotaxy] = useState<PhyllotaxyType>('Alternate');
    const [scenario, setScenario] = useState<ScenarioType>('None');
    const [modification, setModification] = useState<ModificationType>('Natural');

    const rootLength = useMemo(() => 8 + growthLevel * 0.8, [growthLevel]);
    const rootLogic = selectedSeed === 'Mustard'
        ? 'The radicle persists and forms a tap root. It grows deeper with lateral branches. This is the tap root system characteristic of dicotyledons like Mustard.'
        : 'The primary root is short-lived. Many adventitious roots arise from the base of the stem, forming a fibrous root system. This is characteristic of monocotyledons like Wheat.';

    const shadowScore = useMemo(() => {
        if (phyllotaxy === 'Alternate') return 'Low overlap, good light exposure';
        if (phyllotaxy === 'Opposite') return 'Balanced light capture in paired leaves';
        return 'Circular arrangement gives full spread around the node';
    }, [phyllotaxy]);

    const modificationResult = useMemo(() => {
        if (scenario === 'Goat' && modification === 'Protect Mode') {
            return 'Spines protect the plant and reduce easy grazing.';
        }
        if (scenario === 'Goat') {
            return 'The goat can damage the soft leaves because no defensive modification is active.';
        }
        if (scenario === 'Trellis' && modification === 'Climb Mode') {
            return 'Tendrils coil around the support and help the weak stem climb upward.';
        }
        if (scenario === 'Trellis') {
            return 'Without tendrils, the weak stem cannot hold onto the support properly.';
        }
        if (modification === 'Climb Mode') {
            return 'Leaves are modified into tendrils for support and climbing.';
        }
        if (modification === 'Protect Mode') {
            return 'Leaves or stems are modified into spines for protection and reduced water loss.';
        }
        return 'Natural vegetative organs mainly perform ordinary growth, support, and photosynthesis.';
    }, [modification, scenario]);

    const resetLab = () => {
        setSelectedSeed('Mustard');
        setGrowthLevel(65);
        setPhyllotaxy('Alternate');
        setScenario('None');
        setModification('Natural');
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-2 gap-3 flex-1 min-h-0">
                <Panel title="Below Ground: Root System" subtitle="Tap root vs fibrous root" accent="emerald">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-2 min-h-[220px]">
                        <RootScene selectedSeed={selectedSeed} growthLevel={growthLevel} rootLength={rootLength} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <MetricCard label="Seed" value={selectedSeed} tone="text-emerald-700" />
                        <MetricCard label="Growth pattern" value={selectedSeed === 'Mustard' ? 'Tap root' : 'Fibrous root'} tone="text-slate-700" />
                        <MetricCard label="Root length" value={`${Math.round(rootLength)} cm`} tone="text-slate-700" />
                    </div>
                </Panel>

                <Panel title="Above Ground: Stem and Leaves" subtitle="Phyllotaxy and light exposure" accent="sky">
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-2 min-h-[220px]">
                        <StemScene phyllotaxy={phyllotaxy} modification={modification} scenario={scenario} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <MetricCard label="Phyllotaxy" value={phyllotaxy} tone="text-sky-700" />
                        <MetricCard label="Leaf logic" value={shadowScore} tone="text-slate-700" />
                        <MetricCard label="Modification" value={modification} tone="text-slate-700" />
                    </div>
                </Panel>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
                <InfoCard title="Root Observation" icon={<Sprout size={16} className="text-emerald-600" />}>
                    <p>{rootLogic}</p>
                    <p className="mt-2">Tap roots go deeper, while fibrous roots spread from the stem base over a wider surface zone.</p>
                </InfoCard>
                <InfoCard title="Leaf Observation" icon={<Leaf size={16} className="text-sky-600" />}>
                    <p>{shadowScore}</p>
                    <p className="mt-2">Phyllotaxy helps leaves receive better sunlight by avoiding unnecessary crowding on the stem.</p>
                </InfoCard>
                <InfoCard title="Modification Response" icon={<Shield size={16} className="text-amber-600" />}>
                    <p>{modificationResult}</p>
                    <p className="mt-2">Tendrils support climbing, while spines provide protection and reduce water loss.</p>
                </InfoCard>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-brand-primary/20 bg-brand-light/30 p-4 text-sm text-slate-800">
                    <strong>Experiment Goal:</strong> Compare root systems, change leaf arrangement on the stem, and test how tendrils or spines help the plant survive.
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Seed</div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['Mustard', 'Wheat'] as SeedType[]).map((seed) => (
                            <button
                                key={seed}
                                onClick={() => setSelectedSeed(seed)}
                                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${selectedSeed === seed ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}
                            >
                                {seed}
                            </button>
                        ))}
                    </div>
                </div>

                <SliderBlock label="Growth Level" value={`${growthLevel}%`} minLabel="Seedling" maxLabel="Mature">
                    <input
                        type="range"
                        min="20"
                        max="100"
                        step="1"
                        value={growthLevel}
                        onChange={(e) => setGrowthLevel(parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-600"
                    />
                </SliderBlock>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phyllotaxy Dial</div>
                    <div className="grid grid-cols-3 gap-2">
                        {(['Alternate', 'Opposite', 'Whorled'] as PhyllotaxyType[]).map((item) => (
                            <button
                                key={item}
                                onClick={() => setPhyllotaxy(item)}
                                className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${phyllotaxy === item ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'}`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Stress Icon</div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['None', 'Goat', 'Trellis'] as ScenarioType[]).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setScenario(item)}
                                    className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${scenario === item ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Toggle Modification</div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Natural', 'Climb Mode', 'Protect Mode'] as ModificationType[]).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setModification(item)}
                                    className={`rounded-xl border px-2 py-3 text-xs font-bold transition-all ${modification === item ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-800 mb-3 text-sm">Step-by-Step Observation Flow</h4>
                    <ol className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span><span>Select <strong>Mustard</strong> to observe a tap root with lateral branches.</span></li>
                        <li className="flex items-start gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span><span>Select <strong>Wheat</strong> to observe a fibrous root system arising from the stem base.</span></li>
                        <li className="flex items-start gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span><span>Turn the <strong>Phyllotaxy Dial</strong> to compare alternate, opposite, and whorled leaf arrangement.</span></li>
                        <li className="flex items-start gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">4</span><span>Place a <strong>Trellis</strong> or <strong>Goat</strong> and activate tendrils or spines to observe how structure supports survival.</span></li>
                    </ol>
                </div>

                <button
                    onClick={resetLab}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                    <RotateCcw size={15} />
                    Reset Lab
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

const Panel = ({
    title,
    subtitle,
    accent,
    children,
}: {
    title: string;
    subtitle: string;
    accent: 'emerald' | 'sky';
    children: React.ReactNode;
}) => {
    const tone = accent === 'emerald' ? 'text-emerald-700' : 'text-sky-700';
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-0">
            <div className="mb-2">
                <div className={`text-base md:text-lg font-bold ${tone}`}>{title}</div>
                <div className="text-xs text-slate-500">{subtitle}</div>
            </div>
            {children}
        </div>
    );
};

const RootScene = ({
    selectedSeed,
    growthLevel,
    rootLength,
}: {
    selectedSeed: SeedType;
    growthLevel: number;
    rootLength: number;
}) => {
    const mainRootY = 80 + rootLength * 1.1;
    return (
        <svg viewBox="0 0 340 240" className="w-full h-full">
            <rect x="0" y="0" width="340" height="240" fill="#f0fdf4" />
            <rect x="0" y="70" width="340" height="170" fill="#d6b38a" />
            <line x1="0" y1="70" x2="340" y2="70" stroke="#65a30d" strokeWidth="3" />
            <line x1="170" y1="26" x2="170" y2="70" stroke="#16a34a" strokeWidth="8" strokeLinecap="round" />
            <ellipse cx="170" cy="18" rx="34" ry="14" fill="#22c55e" />

            {selectedSeed === 'Mustard' ? (
                <>
                    <path d={`M170 70 C170 110 170 ${140 + growthLevel * 0.2} 170 ${mainRootY}`} stroke="#8b5a2b" strokeWidth="8" fill="none" strokeLinecap="round" />
                    <path d="M170 110 C150 126 140 138 132 154" stroke="#8b5a2b" strokeWidth="5" fill="none" strokeLinecap="round" />
                    <path d="M170 126 C192 140 204 156 212 176" stroke="#8b5a2b" strokeWidth="5" fill="none" strokeLinecap="round" />
                    <path d="M170 154 C148 172 136 188 128 210" stroke="#8b5a2b" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <path d="M170 166 C194 182 206 196 214 216" stroke="#8b5a2b" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <text x="190" y="120" fontSize="13" fontWeight="700" fill="#5b3716">Primary root</text>
                    <text x="224" y="182" fontSize="12" fontWeight="700" fill="#5b3716">Lateral roots</text>
                </>
            ) : (
                <>
                    <path d="M170 70 C170 98 170 112 170 122" stroke="#8b5a2b" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="5 4" />
                    {[-42, -24, -8, 8, 24, 42].map((offset, index) => (
                        <path
                            key={offset}
                            d={`M${170 + offset} 70 C${170 + offset + (offset < 0 ? -10 : 10)} 110 ${170 + offset + (offset < 0 ? -20 : 20)} ${146 + index * 4} ${170 + offset + (offset < 0 ? -26 : 26)} ${202 + index * 2}`}
                            stroke="#8b5a2b"
                            strokeWidth="5"
                            fill="none"
                            strokeLinecap="round"
                        />
                    ))}
                    <text x="112" y="116" fontSize="12" fontWeight="700" fill="#5b3716">Primary root short-lived</text>
                    <text x="194" y="172" fontSize="12" fontWeight="700" fill="#5b3716">Adventitious roots from stem base</text>
                </>
            )}
        </svg>
    );
};

const StemScene = ({
    phyllotaxy,
    modification,
    scenario,
}: {
    phyllotaxy: PhyllotaxyType;
    modification: ModificationType;
    scenario: ScenarioType;
}) => {
    return (
        <svg viewBox="0 0 340 240" className="w-full h-full">
            <rect x="0" y="0" width="340" height="240" fill="#eff6ff" />
            <rect x="0" y="196" width="340" height="44" fill="#d9f99d" />
            <line x1="170" y1="196" x2="170" y2="36" stroke="#15803d" strokeWidth="8" strokeLinecap="round" />

            {phyllotaxy === 'Alternate' && (
                <>
                    <LeafPair x={170} y={164} left right={false} modification={modification} />
                    <LeafPair x={170} y={128} left={false} right modification={modification} />
                    <LeafPair x={170} y={92} left right={false} modification={modification} />
                    <LeafPair x={170} y={58} left={false} right modification={modification} />
                </>
            )}

            {phyllotaxy === 'Opposite' && (
                <>
                    <LeafPair x={170} y={160} left right modification={modification} />
                    <LeafPair x={170} y={112} left right modification={modification} />
                    <LeafPair x={170} y={64} left right modification={modification} />
                </>
            )}

            {phyllotaxy === 'Whorled' && (
                <>
                    <LeafPair x={170} y={158} left right modification={modification} extra />
                    <LeafPair x={170} y={104} left right modification={modification} extra />
                </>
            )}

            {scenario === 'Goat' && (
                <>
                    <rect x="22" y="150" width="74" height="38" rx="16" fill="#d6d3d1" stroke="#78716c" strokeWidth="3" />
                    <circle cx="86" cy="146" r="14" fill="#d6d3d1" stroke="#78716c" strokeWidth="3" />
                    <text x="33" y="144" fontSize="16">🐐</text>
                    {modification !== 'Protect Mode' && <path d="M104 150 C124 142 142 136 154 130" stroke="#ef4444" strokeWidth="3" strokeDasharray="6 5" />}
                </>
            )}

            {scenario === 'Trellis' && (
                <>
                    <line x1="286" y1="26" x2="286" y2="194" stroke="#64748b" strokeWidth="5" />
                    <line x1="304" y1="26" x2="304" y2="194" stroke="#64748b" strokeWidth="5" />
                    <line x1="286" y1="58" x2="304" y2="58" stroke="#94a3b8" strokeWidth="3" />
                    <line x1="286" y1="96" x2="304" y2="96" stroke="#94a3b8" strokeWidth="3" />
                    <line x1="286" y1="134" x2="304" y2="134" stroke="#94a3b8" strokeWidth="3" />
                    <line x1="286" y1="172" x2="304" y2="172" stroke="#94a3b8" strokeWidth="3" />
                    {modification === 'Climb Mode' ? (
                        <path d="M206 132 C230 120 244 106 254 96 C264 86 272 84 286 92" stroke="#16a34a" strokeWidth="4" fill="none" />
                    ) : (
                        <path d="M170 96 C200 100 220 112 238 140" stroke="#ef4444" strokeWidth="4" fill="none" strokeDasharray="6 5" />
                    )}
                </>
            )}
        </svg>
    );
};

const LeafPair = ({
    x,
    y,
    left,
    right,
    extra,
    modification,
}: {
    x: number;
    y: number;
    left?: boolean;
    right?: boolean;
    extra?: boolean;
    modification: ModificationType;
}) => {
    const renderLeaf = (dx: number, rotate: number, key: string) => {
        if (modification === 'Protect Mode') {
            return <path key={key} d={`M${x} ${y} L${x + dx} ${y - 10} L${x + dx * 0.85} ${y + 10} Z`} fill="#7c2d12" />;
        }
        if (modification === 'Climb Mode' && dx > 0) {
            return <path key={key} d={`M${x} ${y} C${x + dx * 0.4} ${y - 14} ${x + dx * 0.7} ${y + 10} ${x + dx} ${y - 6}`} stroke="#16a34a" strokeWidth="4" fill="none" />;
        }
        return <ellipse key={key} cx={x + dx} cy={y} rx="26" ry="11" fill="#4ade80" transform={`rotate(${rotate} ${x + dx} ${y})`} />;
    };

    return (
        <>
            {left && renderLeaf(-34, -25, `left-${x}-${y}`)}
            {right && renderLeaf(34, 25, `right-${x}-${y}`)}
            {extra && renderLeaf(0, 90, `extra-${x}-${y}`)}
        </>
    );
};

const SliderBlock = ({
    label,
    value,
    minLabel,
    maxLabel,
    children,
}: {
    label: string;
    value: string;
    minLabel: string;
    maxLabel: string;
    children: React.ReactNode;
}) => (
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
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

const FactTile = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

export default MorphologyFloweringPlantsLab;
