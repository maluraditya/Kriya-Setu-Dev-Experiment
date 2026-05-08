import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Droplets, Eye, Fish, Gauge, RefreshCcw, ScissorsLineDashed, Waves } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type ObeliaStage = 'Polyp Colony' | 'Asexual Budding' | 'Free Medusa' | 'Sexual Fusion';

interface AnimalKingdomLabProps {
    topic: any;
    onExit: () => void;
}

const STAGES: ObeliaStage[] = ['Polyp Colony', 'Asexual Budding', 'Free Medusa', 'Sexual Fusion'];

const AnimalKingdomLab: React.FC<AnimalKingdomLabProps> = ({ topic, onExit }) => {
    const [pumpOn, setPumpOn] = useState(false);
    const [particleInjected, setParticleInjected] = useState(false);
    const [showCutaway, setShowCutaway] = useState(true);
    const [stageIndex, setStageIndex] = useState(0);

    const currentStage = STAGES[stageIndex];
    const spongeActive = pumpOn;
    const speedReading = pumpOn ? 'High choanocyte beating' : 'No choanocyte beating';

    const spongeSummary = useMemo(() => {
        if (!pumpOn && !particleInjected) {
            return 'Particles stay outside because the choanocyte pump is off.';
        }
        if (!pumpOn && particleInjected) {
            return 'Food particles drift near the sponge, but they do not enter because water current is absent.';
        }
        return 'Water enters through ostia, moves into the spongocoel, and exits through the osculum with trapped food and oxygen moving inward.';
    }, [particleInjected, pumpOn]);

    const obeliaSummary = useMemo(() => {
        if (currentStage === 'Polyp Colony') return 'The cylindrical polyp is sessile and forms the attached colonial stage.';
        if (currentStage === 'Asexual Budding') return 'The polyp buds off tiny medusae asexually.';
        if (currentStage === 'Free Medusa') return 'Umbrella-shaped medusae swim freely and represent the sexual form.';
        return 'Medusae release gametes, fertilisation occurs, and a new polyp starts the colony again.';
    }, [currentStage]);

    const resetLab = () => {
        setPumpOn(false);
        setParticleInjected(false);
        setShowCutaway(true);
        setStageIndex(0);
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-2 gap-3 flex-1 min-h-0">
                <MarinePanel
                    title="Porifera: Sycon Sponge"
                    subtitle="Canal system and choanocyte pump"
                    accent="emerald"
                    headerTag={pumpOn ? 'Pump ON' : 'Pump OFF'}
                >
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-2 min-h-[220px]">
                        <SpongeScene pumpOn={pumpOn} particleInjected={particleInjected} showCutaway={showCutaway} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <MetricCard label="Entry" value="Ostia" tone="text-emerald-700" />
                        <MetricCard label="Central cavity" value="Spongocoel" tone="text-slate-700" />
                        <MetricCard label="Exit" value="Osculum" tone="text-slate-700" />
                    </div>
                </MarinePanel>

                <MarinePanel
                    title="Cnidaria: Obelia Cycle"
                    subtitle="Polymorphism and metagenesis"
                    accent="sky"
                    headerTag={currentStage}
                >
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-2 min-h-[220px]">
                        <ObeliaScene stage={currentStage} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <MetricCard label="Sessile form" value="Polyp" tone="text-sky-700" />
                        <MetricCard label="Free form" value="Medusa" tone="text-slate-700" />
                        <MetricCard label="Cycle" value="Metagenesis" tone="text-slate-700" />
                    </div>
                </MarinePanel>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
                <InfoCard title="Sponge Observation" icon={<Droplets size={16} className="text-emerald-600" />}>
                    <p>{spongeSummary}</p>
                    <p className="mt-2">This single water current helps in food intake, respiration, and waste removal.</p>
                </InfoCard>
                <InfoCard title="Obelia Observation" icon={<Fish size={16} className="text-sky-600" />}>
                    <p>{obeliaSummary}</p>
                    <p className="mt-2">The form changes because the asexual polyp and sexual medusa perform different roles.</p>
                </InfoCard>
                <InfoCard title="Key Logic" icon={<ArrowRight size={16} className="text-amber-600" />}>
                    <p><strong className="text-slate-800">Porifera:</strong> Form follows function through a canal system.</p>
                    <p className="mt-2"><strong className="text-slate-800">Cnidaria:</strong> Form switching allows both fixed growth and mobile reproduction.</p>
                </InfoCard>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                    <strong>Experiment Goal:</strong> Understand how sponges survive using a water canal system and how Obelia switches between the polyp and medusa forms.
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <button
                        onClick={() => setPumpOn((prev) => !prev)}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${pumpOn ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}
                    >
                        {pumpOn ? 'Choanocyte Pump: ON' : 'Choanocyte Pump: OFF'}
                    </button>
                    <button
                        onClick={() => setParticleInjected((prev) => !prev)}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${particleInjected ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'}`}
                    >
                        {particleInjected ? 'Food Particles Released' : 'Inject Food Particles'}
                    </button>
                </div>

                <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                    <button
                        onClick={() => setShowCutaway((prev) => !prev)}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${showCutaway ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                        {showCutaway ? 'Cut-away View: ON' : 'Cut-away View: OFF'}
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
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="text-sm font-bold text-slate-800">Obelia Life-Cycle Advance</div>
                        <button
                            onClick={() => setStageIndex((prev) => (prev + 1) % STAGES.length)}
                            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
                        >
                            Advance Stage
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {STAGES.map((stage, index) => (
                            <button
                                key={stage}
                                onClick={() => setStageIndex(index)}
                                className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${index === stageIndex ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                            >
                                {stage}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <FactTile icon={<Gauge size={15} className="text-emerald-600" />} title="Flagella Speedometer">
                        {speedReading}
                    </FactTile>
                    <FactTile icon={<Waves size={15} className="text-sky-600" />} title="Current Stage">
                        {obeliaSummary}
                    </FactTile>
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

const MarinePanel = ({
    title,
    subtitle,
    accent,
    headerTag,
    children,
}: {
    title: string;
    subtitle: string;
    accent: 'emerald' | 'sky';
    headerTag: string;
    children: React.ReactNode;
}) => {
    const chipTone = accent === 'emerald' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800';
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                    <div className="text-base md:text-lg font-bold text-slate-900">{title}</div>
                    <div className="text-xs text-slate-500">{subtitle}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${chipTone}`}>{headerTag}</span>
            </div>
            {children}
        </div>
    );
};

const SpongeScene = ({
    pumpOn,
    particleInjected,
    showCutaway,
}: {
    pumpOn: boolean;
    particleInjected: boolean;
    showCutaway: boolean;
}) => (
    <svg viewBox="0 0 340 240" className="w-full h-full">
        <rect x="0" y="0" width="340" height="240" fill="#f0fdfa" />
        <rect x="0" y="178" width="340" height="62" fill="#c4b5a5" />
        <ellipse cx="120" cy="116" rx="48" ry="70" fill={pumpOn ? '#f59e0b' : '#cbd5e1'} stroke="#7c2d12" strokeWidth="4" />
        <ellipse cx="120" cy="52" rx="16" ry="9" fill="#f8fafc" stroke="#7c2d12" strokeWidth="3" />
        <text x="120" y="38" textAnchor="middle" fontSize="13" fontWeight="700" fill="#7c2d12">Osculum</text>

        <circle cx="78" cy="92" r="4" fill="#ffffff" />
        <circle cx="74" cy="118" r="4" fill="#ffffff" />
        <circle cx="80" cy="142" r="4" fill="#ffffff" />
        <circle cx="162" cy="98" r="4" fill="#ffffff" />
        <circle cx="166" cy="126" r="4" fill="#ffffff" />
        <circle cx="160" cy="150" r="4" fill="#ffffff" />
        <text x="48" y="162" fontSize="13" fontWeight="700" fill="#0f172a">Ostia</text>

        {showCutaway && (
            <>
                <path d="M120 60 L146 82 L146 160 L120 182" fill="#fde68a" opacity="0.55" />
                <line x1="146" y1="82" x2="146" y2="160" stroke="#7c2d12" strokeDasharray="6 5" strokeWidth="2" />
                <text x="186" y="92" fontSize="13" fontWeight="700" fill="#0f172a">Spongocoel</text>
                <text x="188" y="118" fontSize="12" fill="#475569">Choanocytes line the wall</text>
                <g fill="#0ea5e9">
                    <circle cx="132" cy="98" r="4" />
                    <circle cx="134" cy="122" r="4" />
                    <circle cx="132" cy="146" r="4" />
                </g>
            </>
        )}

        {particleInjected && (
            <>
                <circle cx="36" cy="88" r="6" fill="#22c55e" />
                <circle cx="28" cy="122" r="6" fill="#22c55e" />
                <circle cx="38" cy="148" r="6" fill="#22c55e" />
            </>
        )}

        {pumpOn && particleInjected && (
            <>
                <circle cx="66" cy="92" r="5" fill="#22c55e" />
                <circle cx="94" cy="114" r="5" fill="#22c55e" />
                <circle cx="120" cy="84" r="5" fill="#22c55e" />
                <circle cx="120" cy="56" r="5" fill="#22c55e" />
                <circle cx="120" cy="24" r="5" fill="#22c55e" />
                <path d="M26 88 C42 88 56 90 66 92" stroke="#22c55e" strokeWidth="3" strokeDasharray="5 5" fill="none" />
                <path d="M66 92 C84 100 95 110 108 116" stroke="#22c55e" strokeWidth="3" strokeDasharray="5 5" fill="none" />
                <path d="M120 116 C120 96 120 76 120 56" stroke="#22c55e" strokeWidth="3" strokeDasharray="5 5" fill="none" />
                <path d="M120 56 C120 40 120 32 120 24" stroke="#22c55e" strokeWidth="3" strokeDasharray="5 5" fill="none" />
            </>
        )}

        {!pumpOn && (
            <text x="212" y="170" fontSize="14" fontWeight="700" fill="#64748b">No water current</text>
        )}

        {pumpOn && (
            <text x="212" y="170" fontSize="14" fontWeight="700" fill="#0f766e">Flow: Ostia to Osculum</text>
        )}
    </svg>
);

const ObeliaScene = ({ stage }: { stage: ObeliaStage }) => (
    <svg viewBox="0 0 340 240" className="w-full h-full">
        <rect x="0" y="0" width="340" height="240" fill="#eff6ff" />
        <rect x="0" y="182" width="340" height="58" fill="#cbd5e1" />

        <path d="M84 184 C84 144 76 120 64 92" stroke="#0f766e" strokeWidth="6" fill="none" />
        <path d="M116 184 C116 150 126 122 138 92" stroke="#0f766e" strokeWidth="6" fill="none" />
        <path d="M100 184 C100 152 100 126 100 86" stroke="#0f766e" strokeWidth="7" fill="none" />
        <circle cx="64" cy="92" r="13" fill="#86efac" stroke="#166534" strokeWidth="3" />
        <circle cx="100" cy="86" r="14" fill="#86efac" stroke="#166534" strokeWidth="3" />
        <circle cx="138" cy="92" r="13" fill="#86efac" stroke="#166534" strokeWidth="3" />
        <text x="100" y="58" textAnchor="middle" fontSize="13" fontWeight="700" fill="#166534">Polyp Colony</text>

        {(stage === 'Asexual Budding' || stage === 'Free Medusa' || stage === 'Sexual Fusion') && (
            <>
                <path d="M164 102 C180 90 190 88 206 96" stroke="#6366f1" strokeWidth="3" fill="none" strokeDasharray="6 5" />
                <path d="M204 118 C194 96 178 96 170 118 C178 130 194 130 204 118Z" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="3" />
                <path d="M232 132 C222 110 206 110 198 132 C206 144 222 144 232 132Z" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="3" />
                <text x="216" y="82" textAnchor="middle" fontSize="13" fontWeight="700" fill="#4338ca">Asexual budding</text>
            </>
        )}

        {(stage === 'Free Medusa' || stage === 'Sexual Fusion') && (
            <>
                <path d="M246 96 C232 64 204 64 190 96 C202 114 234 114 246 96Z" fill="#7dd3fc" stroke="#0369a1" strokeWidth="4" />
                <line x1="204" y1="96" x2="196" y2="120" stroke="#0369a1" strokeWidth="3" />
                <line x1="218" y1="98" x2="216" y2="126" stroke="#0369a1" strokeWidth="3" />
                <line x1="232" y1="96" x2="238" y2="120" stroke="#0369a1" strokeWidth="3" />
                <text x="218" y="50" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0369a1">Medusa</text>
            </>
        )}

        {stage === 'Sexual Fusion' && (
            <>
                <circle cx="256" cy="138" r="5" fill="#f472b6" />
                <circle cx="276" cy="148" r="5" fill="#60a5fa" />
                <path d="M256 138 C262 142 266 144 270 145" stroke="#a855f7" strokeWidth="2" fill="none" />
                <circle cx="292" cy="160" r="7" fill="#c084fc" />
                <path d="M294 166 C270 180 244 190 226 202" stroke="#6366f1" strokeWidth="3" strokeDasharray="5 5" fill="none" />
                <circle cx="214" cy="208" r="9" fill="#86efac" stroke="#166534" strokeWidth="3" />
                <text x="278" y="122" fontSize="13" fontWeight="700" fill="#9333ea">Gametes</text>
                <text x="232" y="226" fontSize="13" fontWeight="700" fill="#166534">New Polyp</text>
            </>
        )}
    </svg>
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

export default AnimalKingdomLab;
