import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Eye, Gauge, Leaf, RefreshCcw, ScanEye, Trees } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type GrowthMode = 'Primary Growth' | 'Secondary Growth';

interface AnatomyFloweringPlantsLabProps {
    topic: any;
    onExit: () => void;
}

const AnatomyFloweringPlantsLab: React.FC<AnatomyFloweringPlantsLabProps> = ({ topic, onExit }) => {
    const [ageYears, setAgeYears] = useState(8);
    const [growthMode, setGrowthMode] = useState<GrowthMode>('Secondary Growth');
    const [activityLevel, setActivityLevel] = useState(2);
    const [xrayOn, setXrayOn] = useState(true);

    const activityFactor = activityLevel === 1 ? 0.75 : activityLevel === 2 ? 1 : 1.3;
    const diameterCm = useMemo(() => {
        if (growthMode === 'Primary Growth') return 1.2 + ageYears * 0.05;
        return 1.4 + ageYears * 0.18 * activityFactor;
    }, [activityFactor, ageYears, growthMode]);

    const secondaryXylemBand = useMemo(() => {
        if (growthMode === 'Primary Growth') return 16;
        return 16 + ageYears * 1.1 * activityFactor;
    }, [activityFactor, ageYears, growthMode]);

    const secondaryPhloemBand = useMemo(() => {
        if (growthMode === 'Primary Growth') return 10;
        return 10 + ageYears * 0.32 * activityFactor;
    }, [activityFactor, ageYears, growthMode]);

    const growthSummary = useMemo(() => {
        if (growthMode === 'Primary Growth') {
            return 'Primary growth increases length through apical meristems at the root and shoot tips.';
        }
        return 'Secondary growth increases girth through vascular cambium, which adds secondary xylem inside and secondary phloem outside.';
    }, [growthMode]);

    const cambiumSummary = useMemo(() => {
        if (activityLevel === 1) return 'Cambium is dividing slowly, so girth increases gently.';
        if (activityLevel === 2) return 'Cambium is dividing at a moderate rate, producing steady secondary tissues.';
        return 'Cambium is highly active, so secondary xylem accumulates quickly and wood formation becomes obvious.';
    }, [activityLevel]);

    const resetLab = () => {
        setAgeYears(8);
        setGrowthMode('Secondary Growth');
        setActivityLevel(2);
        setXrayOn(true);
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-2 gap-3 flex-1 min-h-0">
                <TissuePanel title="Tissue Systems" subtitle="Epidermal, ground and vascular tissues" accent="emerald">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-2 min-h-[220px]">
                        <PrimaryStemScene xrayOn={xrayOn} growthMode={growthMode} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <MetricCard label="Epidermal" value="Cuticle, epidermis, stomata, hairs" tone="text-emerald-700" />
                        <MetricCard label="Ground" value="Parenchyma, collenchyma, sclerenchyma" tone="text-slate-700" />
                        <MetricCard label="Vascular" value="Xylem + phloem + cambium" tone="text-slate-700" />
                    </div>
                </TissuePanel>

                <TissuePanel title="Secondary Growth" subtitle="Cambium activity and wood formation" accent="sky">
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-2 min-h-[220px]">
                        <SecondaryGrowthScene
                            ageYears={ageYears}
                            xrayOn={xrayOn}
                            secondaryXylemBand={secondaryXylemBand}
                            secondaryPhloemBand={secondaryPhloemBand}
                        />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <MetricCard label="Age" value={`${ageYears} years`} tone="text-sky-700" />
                        <MetricCard label="Diameter" value={`${diameterCm.toFixed(1)} cm`} tone="text-slate-700" />
                        <MetricCard label="Wood meter" value={`${Math.round(secondaryXylemBand)} units`} tone="text-slate-700" />
                    </div>
                </TissuePanel>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
                <InfoCard title="Growth Focus" icon={<Leaf size={16} className="text-emerald-600" />}>
                    <p>{growthSummary}</p>
                    <p className="mt-2">Meristematic cells divide first and then differentiate into permanent tissues with special structure and function.</p>
                </InfoCard>
                <InfoCard title="Cambium Activity" icon={<Gauge size={16} className="text-sky-600" />}>
                    <p>{cambiumSummary}</p>
                    <p className="mt-2">Secondary xylem is produced in larger quantity than secondary phloem, so wood accumulates toward the inside.</p>
                </InfoCard>
                <InfoCard title="Differentiation Lens" icon={<ScanEye size={16} className="text-amber-600" />}>
                    <DifferentiationStrip />
                </InfoCard>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-brand-primary/20 bg-brand-light/30 p-4 text-sm text-slate-800">
                    <strong>Experiment Goal:</strong> See how a young primary stem contains three tissue systems, and how vascular cambium gradually adds new permanent tissue to increase girth.
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {(['Primary Growth', 'Secondary Growth'] as GrowthMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setGrowthMode(mode)}
                            className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${growthMode === mode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                <SliderBlock label="Time Slider (Age)" value={`${ageYears} years`} minLabel="Year 1" maxLabel="Year 50">
                    <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={ageYears}
                        onChange={(e) => setAgeYears(parseInt(e.target.value, 10))}
                        className="w-full accent-sky-600"
                    />
                </SliderBlock>

                <SliderBlock label="Activity Dial" value={activityLevel === 1 ? 'Low' : activityLevel === 2 ? 'Medium' : 'High'} minLabel="Low" maxLabel="High">
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="1"
                        value={activityLevel}
                        onChange={(e) => setActivityLevel(parseInt(e.target.value, 10))}
                        className="w-full accent-violet-600"
                    />
                </SliderBlock>

                <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                    <button
                        onClick={() => setXrayOn((prev) => !prev)}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${xrayOn ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                        {xrayOn ? 'X-Ray Toggle: ON' : 'X-Ray Toggle: OFF'}
                    </button>
                    <button
                        onClick={resetLab}
                        className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={15} />
                        Reset
                    </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-800 mb-3 text-sm">Step-by-Step Observation Flow</h4>
                    <ol className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span><span>Start with the young stem and identify epidermal tissue, ground tissue, and open vascular bundles.</span></li>
                        <li className="flex items-start gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span><span>Switch focus to <strong>Secondary Growth</strong> and move the age slider forward.</span></li>
                        <li className="flex items-start gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span><span>Increase the activity dial and notice how the cambium adds more secondary xylem than phloem.</span></li>
                        <li className="flex items-start gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">4</span><span>Use the X-ray view to see older outer tissues pushed outward while wood accumulates inward.</span></li>
                    </ol>
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

const TissuePanel = ({
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

const PrimaryStemScene = ({
    xrayOn,
    growthMode,
}: {
    xrayOn: boolean;
    growthMode: GrowthMode;
}) => (
    <svg viewBox="0 0 340 240" className="w-full h-full">
        <rect x="0" y="0" width="340" height="240" fill="#ecfdf5" />
        <circle cx="170" cy="120" r="82" fill={xrayOn ? '#dcfce7' : '#bbf7d0'} stroke="#16a34a" strokeWidth="4" />
        <circle cx="170" cy="120" r="58" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" />
        <circle cx="170" cy="120" r="30" fill="#fecaca" stroke="#dc2626" strokeWidth="4" />

        <rect x="160" y="38" width="20" height="164" rx="10" fill="none" stroke={growthMode === 'Primary Growth' ? '#7c3aed' : '#cbd5e1'} strokeWidth="5" strokeDasharray="8 6" />
        <text x="248" y="52" fontSize="12" fontWeight="700" fill="#7c3aed">Apical direction</text>

        <g fill="#3b82f6">
            <ellipse cx="132" cy="96" rx="10" ry="16" />
            <ellipse cx="208" cy="96" rx="10" ry="16" />
            <ellipse cx="132" cy="144" rx="10" ry="16" />
            <ellipse cx="208" cy="144" rx="10" ry="16" />
        </g>
        <g fill="#f97316">
            <ellipse cx="148" cy="96" rx="8" ry="16" />
            <ellipse cx="192" cy="96" rx="8" ry="16" />
            <ellipse cx="148" cy="144" rx="8" ry="16" />
            <ellipse cx="192" cy="144" rx="8" ry="16" />
        </g>

        <text x="170" y="28" textAnchor="middle" fontSize="13" fontWeight="700" fill="#166534">Epidermal tissue</text>
        <text x="170" y="210" textAnchor="middle" fontSize="13" fontWeight="700" fill="#92400e">Ground tissue</text>
        <text x="170" y="124" textAnchor="middle" fontSize="13" fontWeight="700" fill="#991b1b">Pith</text>
    </svg>
);

const SecondaryGrowthScene = ({
    ageYears,
    xrayOn,
    secondaryXylemBand,
    secondaryPhloemBand,
}: {
    ageYears: number;
    xrayOn: boolean;
    secondaryXylemBand: number;
    secondaryPhloemBand: number;
}) => {
    const outerOpacity = xrayOn ? 0.35 : 1;
    const outerRadius = 84 + ageYears * 0.35;
    const phloemRadius = outerRadius - secondaryPhloemBand;
    const cambiumRadius = phloemRadius - 6;
    const xylemRadius = Math.max(28, cambiumRadius - secondaryXylemBand * 0.45);

    return (
        <svg viewBox="0 0 340 240" className="w-full h-full">
            <rect x="0" y="0" width="340" height="240" fill="#eff6ff" />
            <circle cx="170" cy="120" r={outerRadius} fill="#fde68a" opacity={outerOpacity} />
            <circle cx="170" cy="120" r={phloemRadius} fill="#93c5fd" />
            <circle cx="170" cy="120" r={cambiumRadius} fill="none" stroke="#22c55e" strokeWidth="6" strokeDasharray="7 6" />
            <circle cx="170" cy="120" r={xylemRadius} fill="#ef4444" opacity="0.82" />
            <circle cx="170" cy="120" r="22" fill="#fef2f2" stroke="#991b1b" strokeWidth="3" />

            <text x="170" y="34" textAnchor="middle" fontSize="13" fontWeight="700" fill="#166534">Cambium ring</text>
            <text x="256" y="88" fontSize="12" fontWeight="700" fill="#1d4ed8">Secondary phloem</text>
            <text x="248" y="132" fontSize="12" fontWeight="700" fill="#dc2626">Secondary xylem</text>
            <text x="70" y="204" fontSize="12" fontWeight="700" fill="#92400e">{xrayOn ? 'Outer tissues transparent' : 'Outer tissues visible'}</text>
        </svg>
    );
};

const DifferentiationStrip = () => (
    <div className="space-y-2">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 border-violet-400 bg-violet-100" />
            <ArrowRight size={14} className="text-slate-400" />
            <div className="w-10 h-10 rounded border-2 border-amber-500 bg-amber-100" />
            <ArrowRight size={14} className="text-slate-400" />
            <div className="w-10 h-10 rounded border-[4px] border-rose-700 bg-rose-100" />
        </div>
        <p>Meristematic cell divides first, then differentiates into a permanent cell with thickened wall.</p>
        <p className="mt-1">This is how new cambial cells become tracheary elements and add to wood.</p>
    </div>
);

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

export default AnatomyFloweringPlantsLab;
