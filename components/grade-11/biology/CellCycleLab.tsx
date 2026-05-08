import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Dna, PauseCircle, RefreshCcw, Wrench } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Phase = 'G1' | 'S' | 'G2' | 'M' | 'G0';

interface CellCycleLabProps {
    topic: any;
    onExit: () => void;
}

const PHASES: Phase[] = ['G1', 'S', 'G2', 'M'];

const CellCycleLab: React.FC<CellCycleLabProps> = ({ topic, onExit }) => {
    const [phase, setPhase] = useState<Phase>('G1');
    const [environmentRequest, setEnvironmentRequest] = useState(false);
    const [nutrientLevel, setNutrientLevel] = useState(72);
    const [dnaIntact, setDnaIntact] = useState(true);
    const [ratio, setRatio] = useState(64);
    const [divisionCount, setDivisionCount] = useState(0);
    const [warning, setWarning] = useState('Cell is in G1. Growth is increasing the nucleo-cytoplasmic ratio.');

    const dnaContent = phase === 'S' || phase === 'G2' || phase === 'M' ? '4C' : '2C';
    const chromosomeNumber = '2n';
    const g1Ready = environmentRequest && nutrientLevel >= 65;
    const g2Ready = dnaIntact;
    const gateLabel = phase === 'G1' ? 'G1/S Gate' : phase === 'G2' ? 'G2/M Gate' : phase === 'G0' ? 'G0 Exit' : 'Phase Progress';
    const gateOpen = phase === 'G1' ? g1Ready : phase === 'G2' ? g2Ready : phase !== 'G0';

    const statusText = useMemo(() => {
        if (phase === 'G0') return 'The cell is in G0. It remains metabolically active but is not preparing to divide.';
        if (phase === 'G1' && !environmentRequest) return 'No division signal is present. The cell may enter G0 instead of moving toward DNA replication.';
        if (phase === 'G1' && nutrientLevel < 65) return 'Metabolic requirement is not met. The G1/S gate stays closed.';
        if (phase === 'S') return 'DNA replication is underway. DNA content changes from 2C to 4C, but chromosome number remains 2n.';
        if (phase === 'G2' && !dnaIntact) return 'DNA error detected. The G2/M gate stays locked until repair is complete.';
        if (phase === 'G2') return 'The cell is preparing proteins and structures needed for mitosis.';
        if (phase === 'M') return 'M phase distributes duplicated genetic material and restores the nucleo-cytoplasmic ratio by forming daughter cells.';
        return 'All checks are ready.';
    }, [dnaIntact, environmentRequest, nutrientLevel, phase]);

    const proceed = () => {
        if (phase === 'G0') {
            if (!environmentRequest) {
                setWarning('G0 cell needs an environment request before it re-enters G1.');
                return;
            }
            setPhase('G1');
            setWarning('Signal received. Cell re-enters G1.');
            return;
        }
        if (phase === 'G1') {
            if (!environmentRequest) {
                setPhase('G0');
                setWarning('No division signal. Cell exits to G0 quiescent stage.');
                return;
            }
            if (nutrientLevel < 65) {
                setWarning('Metabolic requirement not met. Increase nutrient level before S phase.');
                return;
            }
            setPhase('S');
            setRatio(76);
            setWarning('G1/S checkpoint passed. DNA replication begins.');
            return;
        }
        if (phase === 'S') {
            setPhase('G2');
            setRatio(86);
            setDnaIntact(false);
            setWarning('S phase completed. DNA content is 4C; a DNA error is detected for G2 check.');
            return;
        }
        if (phase === 'G2') {
            if (!dnaIntact) {
                setWarning('Genome integrity check failed. Use DNA Repair before M phase.');
                return;
            }
            setPhase('M');
            setWarning('G2/M checkpoint passed. Dramatic reorganisation of M phase begins.');
            return;
        }
        if (phase === 'M') {
            setPhase('G1');
            setRatio(48);
            setEnvironmentRequest(false);
            setDivisionCount(v => v + 1);
            setWarning('Mitosis completed. Two daughter cells form and ratio resets.');
        }
    };

    const repairDna = () => {
        setDnaIntact(true);
        setWarning('DNA repaired. Genome integrity check is green.');
    };

    const resetLab = () => {
        setPhase('G1');
        setEnvironmentRequest(false);
        setNutrientLevel(72);
        setDnaIntact(true);
        setRatio(64);
        setDivisionCount(0);
        setWarning('Cell is in G1. Growth is increasing the nucleo-cytoplasmic ratio.');
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-[1.12fr_0.88fr] gap-3 flex-1 min-h-0">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Cell Control Room</div>
                            <div className="text-xs text-slate-500">G1/S and G2/M checkpoint logic</div>
                        </div>
                        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">{phase}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2 min-h-[320px]">
                        <CellCycleSVG
                            phase={phase}
                            gateOpen={gateOpen}
                            environmentRequest={environmentRequest}
                            nutrientLevel={nutrientLevel}
                            dnaIntact={dnaIntact}
                            ratio={ratio}
                        />
                    </div>
                    <div className="grid sm:grid-cols-4 gap-2 mt-2">
                        <MetricCard label="DNA Content" value={dnaContent} tone="text-indigo-700" />
                        <MetricCard label="Chromosomes" value={chromosomeNumber} tone="text-slate-700" />
                        <MetricCard label="Ratio" value={`${ratio}%`} tone={ratio > 80 ? 'text-red-700' : 'text-emerald-700'} />
                        <MetricCard label="Divisions" value={`${divisionCount}`} tone="text-amber-700" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-3 min-h-0">
                    <InfoCard title={gateLabel} icon={gateOpen ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-red-600" />}>
                        <p>{statusText}</p>
                    </InfoCard>
                    <InfoCard title="NCERT Logic" icon={<Dna size={16} className="text-indigo-600" />}>
                        <p>Cell-cycle events are genetically controlled and coordinated so the genome is duplicated and distributed correctly.</p>
                    </InfoCard>
                    <InfoCard title="Last Action" icon={<Activity size={16} className="text-amber-600" />}>
                        <p>{warning}</p>
                    </InfoCard>
                </div>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
                    <strong>Experiment Goal:</strong> Decide whether a growing cell should enter S phase, pause in G0, repair DNA in G2, or proceed to mitosis.
                </div>

                <button onClick={() => setEnvironmentRequest(v => !v)}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${environmentRequest ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}>
                    Environment Request: {environmentRequest ? 'ON' : 'OFF'}
                </button>

                <SliderBlock label="Nutrient / Metabolic Fuel" value={`${nutrientLevel}%`} minLabel="Low" maxLabel="High">
                    <input type="range" min="0" max="100" value={nutrientLevel} onChange={(e) => setNutrientLevel(parseInt(e.target.value, 10))} className="w-full accent-emerald-600" />
                </SliderBlock>

                <div className="grid sm:grid-cols-3 gap-2">
                    <button onClick={proceed} className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                        Pull Proceed Lever
                    </button>
                    <button onClick={repairDna} className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-900 hover:bg-sky-100 transition-colors flex items-center justify-center gap-2">
                        <Wrench size={15} /> DNA Repair
                    </button>
                    <button onClick={resetLab} className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                        <RefreshCcw size={15} /> Reset
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <FactTile icon={<PauseCircle size={15} className="text-violet-600" />} title="G0 Logic">
                        Without a division signal, a G1 cell can enter the quiescent G0 stage.
                    </FactTile>
                    <FactTile icon={<Dna size={15} className="text-indigo-600" />} title="S Phase Logic">
                        DNA content doubles from 2C to 4C, but chromosome number stays 2n.
                    </FactTile>
                </div>
            </div>
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />;
};

const CellCycleSVG = ({
    phase,
    gateOpen,
    environmentRequest,
    nutrientLevel,
    dnaIntact,
    ratio,
}: {
    phase: Phase;
    gateOpen: boolean;
    environmentRequest: boolean;
    nutrientLevel: number;
    dnaIntact: boolean;
    ratio: number;
}) => {
    const activeIndex = phase === 'G0' ? -1 : PHASES.indexOf(phase);
    const cellScale = 0.82 + ratio / 250;
    return (
        <svg viewBox="0 0 640 360" className="w-full h-full" aria-label="Cell cycle regulation simulation">
            <rect width="640" height="360" rx="16" fill="#eef2ff" />
            <text x="320" y="30" textAnchor="middle" fontSize="18" fontWeight="800" fill="#312e81">Cell Cycle Gatekeeper</text>

            <g transform="translate(112 78)">
                <circle cx="96" cy="96" r="86" fill="white" stroke="#c7d2fe" strokeWidth="4" />
                {PHASES.map((p, i) => {
                    const angle = (-90 + i * 90) * Math.PI / 180;
                    const x = 96 + Math.cos(angle) * 58;
                    const y = 96 + Math.sin(angle) * 58;
                    const active = activeIndex === i;
                    return (
                        <g key={p}>
                            <circle cx={x} cy={y} r="28" fill={active ? '#4f46e5' : '#e0e7ff'} stroke="#6366f1" strokeWidth="3" />
                            <text x={x} y={y + 6} textAnchor="middle" fontSize="16" fontWeight="900" fill={active ? 'white' : '#3730a3'}>{p}</text>
                        </g>
                    );
                })}
                <path d="M160 44 C204 44 218 78 218 96 C218 114 204 148 160 148" fill="none" stroke="#94a3b8" strokeWidth="4" strokeDasharray="7 6" />
                <text x="232" y="102" fontSize="14" fontWeight="900" fill={phase === 'G0' ? '#7c3aed' : '#64748b'}>G0</text>
            </g>

            <g transform="translate(346 84)">
                <ellipse cx="120" cy="116" rx={92 * cellScale} ry={72 * cellScale} fill="#dcfce7" stroke="#16a34a" strokeWidth="5" />
                <circle cx="120" cy="116" r="44" fill="#dbeafe" stroke="#2563eb" strokeWidth="4" />
                {phase === 'S' || phase === 'G2' || phase === 'M' ? (
                    <>
                        <path d="M98 99 C118 82 142 82 162 99 C142 116 118 116 98 99Z" fill="none" stroke="#4f46e5" strokeWidth="4" />
                        <path d="M98 132 C118 115 142 115 162 132 C142 149 118 149 98 132Z" fill="none" stroke="#4f46e5" strokeWidth="4" />
                    </>
                ) : (
                    <path d="M98 116 C118 98 142 98 162 116 C142 134 118 134 98 116Z" fill="none" stroke="#4f46e5" strokeWidth="4" />
                )}
                {phase === 'M' && (
                    <>
                        <line x1="120" y1="44" x2="120" y2="188" stroke="#16a34a" strokeWidth="4" strokeDasharray="8 6" />
                        <text x="120" y="210" textAnchor="middle" fontSize="13" fontWeight="900" fill="#166534">Two daughter cells forming</text>
                    </>
                )}
                <text x="120" y="20" textAnchor="middle" fontSize="13" fontWeight="900" fill="#166534">Transparent cell</text>
            </g>

            <g transform="translate(70 278)">
                <rect x="0" y="0" width="150" height="18" rx="9" fill="#e2e8f0" />
                <rect x="0" y="0" width={nutrientLevel * 1.5} height="18" rx="9" fill={nutrientLevel >= 65 ? '#22c55e' : '#ef4444'} />
                <text x="0" y="-8" fontSize="12" fontWeight="900" fill="#475569">Metabolic fuel</text>
            </g>
            <g transform="translate(254 278)">
                <rect x="0" y="0" width="150" height="18" rx="9" fill="#e2e8f0" />
                <rect x="0" y="0" width={ratio * 1.5} height="18" rx="9" fill={ratio > 80 ? '#f97316' : '#38bdf8'} />
                <text x="0" y="-8" fontSize="12" fontWeight="900" fill="#475569">Nucleo-cytoplasmic ratio</text>
            </g>
            <g transform="translate(438 266)">
                <rect x="0" y="0" width="144" height="40" rx="14" fill={gateOpen ? '#dcfce7' : '#fee2e2'} stroke={gateOpen ? '#16a34a' : '#dc2626'} strokeWidth="3" />
                <text x="72" y="25" textAnchor="middle" fontSize="13" fontWeight="900" fill={gateOpen ? '#166534' : '#991b1b'}>{gateOpen ? 'Gate Open' : 'Gate Locked'}</text>
            </g>
            <text x="70" y="332" fontSize="12" fontWeight="800" fill={environmentRequest ? '#166534' : '#7c2d12'}>
                Environment request: {environmentRequest ? 'division needed' : 'not requested'}
            </text>
            <text x="438" y="332" fontSize="12" fontWeight="800" fill={dnaIntact ? '#166534' : '#991b1b'}>
                DNA scanner: {dnaIntact ? 'intact genome' : 'error detected'}
            </text>
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

export default CellCycleLab;
