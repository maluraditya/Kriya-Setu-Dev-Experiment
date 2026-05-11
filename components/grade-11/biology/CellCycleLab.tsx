import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Dna, PauseCircle, RefreshCcw, Wrench, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Phase = 'G1' | 'S' | 'G2' | 'M' | 'G0';
type MitosisSubPhase = 'Prophase' | 'Metaphase' | 'Anaphase' | 'Telophase' | null;

interface CellCycleLabProps {
    topic: any;
    onExit: () => void;
}

const PHASES: Phase[] = ['G1', 'S', 'G2', 'M'];

const CellCycleLab: React.FC<CellCycleLabProps> = ({ topic, onExit }) => {
    const [phase, setPhase] = useState<Phase>('G1');
    const [growthSignal, setGrowthSignal] = useState(false);
    const [nutrientLevel, setNutrientLevel] = useState(72);
    const [dnaIntact, setDnaIntact] = useState(true);
    const [ratio, setRatio] = useState(64);
    const [divisionCount, setDivisionCount] = useState(0);
    const [warning, setWarning] = useState('Cell is in G1. Growth is increasing the nucleo-cytoplasmic ratio.');
    // ISSUE 2: M phase sub-step
    const [mPhaseComplete, setMPhaseComplete] = useState(false);
    // ISSUE 3: Mitosis sub-phases
    const [mitosisSubPhase, setMitosisSubPhase] = useState<MitosisSubPhase>(null);

    // ISSUE 2: DNA content reflects M phase completion state
    const dnaContent = useMemo(() => {
        if (phase === 'M' && mPhaseComplete) return '2C (each daughter)';
        if (phase === 'S' || phase === 'G2' || phase === 'M') return '4C';
        return '2C';
    }, [phase, mPhaseComplete]);

    // ISSUE 5: Chromosome label is contextual
    const chromosomeNumber = useMemo(() => {
        if (phase === 'G1') return '2n (unreplicated)';
        if (phase === 'S') return '2n (replicating)';
        if (phase === 'G2') return '2n (replicated, sister chromatids present)';
        if (phase === 'M') {
            if (mitosisSubPhase === 'Prophase' || mitosisSubPhase === 'Metaphase') return '2n (condensed)';
            if (mitosisSubPhase === 'Anaphase') return '2n (separating)';
            if (mitosisSubPhase === 'Telophase' || mPhaseComplete) return '2n (daughter cells)';
        }
        return '2n';
    }, [phase, mitosisSubPhase, mPhaseComplete]);

    const g1Ready = growthSignal && nutrientLevel >= 65;
    const g2Ready = dnaIntact;
    // ISSUE 3: Gate label shows mitosis sub-phase when in M
    const gateLabel = phase === 'G1'
        ? 'G1/S Gate'
        : phase === 'G2'
            ? 'G2/M Gate'
            : phase === 'G0'
                ? 'G0 Exit'
                : mitosisSubPhase
                    ? `M Phase — ${mitosisSubPhase}`
                    : 'Phase Progress';
    const gateOpen = phase === 'G1' ? g1Ready : phase === 'G2' ? g2Ready : phase !== 'G0';

    // ISSUE 3 + ISSUE 4: statusText covers all sub-phases and uses new terminology
    const statusText = useMemo(() => {
        if (phase === 'G0') return 'The cell is in G0. It remains metabolically active but is not preparing to divide.';
        if (phase === 'G1' && !growthSignal) return 'No growth signal is present. The cell may enter G0 instead of moving toward DNA replication.';
        if (phase === 'G1' && nutrientLevel < 65) return 'Metabolic readiness is not met. The G1/S gate stays closed.';
        if (phase === 'S') return 'DNA replication is underway. DNA content changes from 2C to 4C, but chromosome number remains 2n.';
        if (phase === 'G2' && !dnaIntact) return 'DNA error detected. The G2/M gate stays locked until repair is complete.';
        if (phase === 'G2') return 'The cell is preparing proteins and structures needed for mitosis.';
        if (phase === 'M') {
            if (mitosisSubPhase === 'Prophase') return 'Chromatin condenses into visible chromosomes. Nuclear envelope begins to break down.';
            if (mitosisSubPhase === 'Metaphase') return 'Chromosomes align at the metaphase plate. Spindle fibres attach to centromeres.';
            if (mitosisSubPhase === 'Anaphase') return 'Sister chromatids separate and move to opposite poles.';
            if (mitosisSubPhase === 'Telophase') return 'Nuclear envelope reforms around each set of chromosomes. Cytokinesis begins.';
            return 'M phase distributes duplicated genetic material and restores the nucleo-cytoplasmic ratio by forming daughter cells.';
        }
        return 'All checks are ready.';
    }, [dnaIntact, growthSignal, nutrientLevel, phase, mitosisSubPhase]);

    const proceed = () => {
        if (phase === 'G0') {
            if (!growthSignal) {
                setWarning('G0 cell needs a growth signal before it re-enters G1.');
                return;
            }
            setPhase('G1');
            setWarning('Signal received. Cell re-enters G1.');
            return;
        }
        if (phase === 'G1') {
            if (!growthSignal) {
                setPhase('G0');
                setWarning('No growth signal. Cell exits to G0 quiescent stage.');
                return;
            }
            if (nutrientLevel < 65) {
                setWarning('Metabolic readiness not met. Increase nutrient level before S phase.');
                return;
            }
            setPhase('S');
            setRatio(76);
            setWarning('G1/S checkpoint passed. DNA replication begins.');
            return;
        }
        if (phase === 'S') {
            // ISSUE 1: DNA damage is NOT forced; it stays as-is (true by default)
            setPhase('G2');
            setRatio(86);
            setWarning('S phase completed successfully. DNA content is 4C. Use "Simulate DNA Damage" button to test the G2 checkpoint.');
            return;
        }
        if (phase === 'G2') {
            if (!dnaIntact) {
                setWarning('Genome integrity check failed. Use DNA Repair before M phase.');
                return;
            }
            setPhase('M');
            setMitosisSubPhase('Prophase');
            setWarning('G2/M checkpoint passed. Mitosis begins — Prophase.');
            return;
        }
        if (phase === 'M') {
            // ISSUE 3: advance through mitosis sub-phases
            if (mitosisSubPhase === 'Prophase') {
                setMitosisSubPhase('Metaphase');
                setWarning('Prophase complete. Chromosomes align at the metaphase plate — Metaphase.');
                return;
            }
            if (mitosisSubPhase === 'Metaphase') {
                setMitosisSubPhase('Anaphase');
                setWarning('Metaphase complete. Sister chromatids separating — Anaphase.');
                return;
            }
            if (mitosisSubPhase === 'Anaphase') {
                setMitosisSubPhase('Telophase');
                setMPhaseComplete(true);
                setWarning('Chromosomes separating. DNA content will return to 2C in each daughter cell after cytokinesis.');
                return;
            }
            if (mitosisSubPhase === 'Telophase') {
                // Final step: reset to G1
                setPhase('G1');
                setRatio(48);
                setGrowthSignal(false);
                setDivisionCount(v => v + 1);
                setMitosisSubPhase(null);
                setMPhaseComplete(false);
                setWarning('Mitosis completed. Two daughter cells form and ratio resets.');
                return;
            }
        }
    };

    const repairDna = () => {
        setDnaIntact(true);
        setWarning('DNA repaired. Genome integrity check is green.');
    };

    // ISSUE 1: Separate "Simulate DNA Damage" button handler
    const simulateDnaDamage = () => {
        setDnaIntact(false);
        setWarning('DNA damage simulated. The G2/M gate is now locked. Use DNA Repair to fix it.');
    };

    const resetLab = () => {
        setPhase('G1');
        setGrowthSignal(false);
        setNutrientLevel(72);
        setDnaIntact(true);
        setRatio(64);
        setDivisionCount(0);
        setMPhaseComplete(false);
        setMitosisSubPhase(null);
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
                        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                            {phase}{mitosisSubPhase ? ` — ${mitosisSubPhase}` : ''}
                        </span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2 min-h-[320px]">
                        <CellCycleSVG
                            phase={phase}
                            gateOpen={gateOpen}
                            growthSignal={growthSignal}
                            nutrientLevel={nutrientLevel}
                            dnaIntact={dnaIntact}
                            ratio={ratio}
                            mitosisSubPhase={mitosisSubPhase}
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
                    {/* ISSUE 6: Updated NCERT Logic InfoCard */}
                    <InfoCard title="NCERT Logic" icon={<Dna size={16} className="text-indigo-600" />}>
                        <p>According to NCERT, the cell cycle is divided into two main phases: Interphase (G1 + S + G2, approximately 95% of cycle time) and M phase (mitosis + cytokinesis, approximately 5% of cycle time). In actively dividing human cells, the total cycle time is about 24 hours.</p>
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
                    <strong>Experiment Goal:</strong> Decide whether a growing cell should enter S phase, pause in G0, repair DNA in G2, or proceed through mitosis sub-phases.
                </div>

                {/* ISSUE 4: Renamed to Growth Signal */}
                <button onClick={() => setGrowthSignal(v => !v)}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${growthSignal ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}>
                    Growth Signal: {growthSignal ? 'Present' : 'Absent'}
                </button>

                {/* ISSUE 4: Renamed to Metabolic Readiness */}
                <SliderBlock label="Metabolic Readiness" value={`${nutrientLevel}%`} minLabel="Low" maxLabel="High">
                    <input type="range" min="0" max="100" value={nutrientLevel} onChange={(e) => setNutrientLevel(parseInt(e.target.value, 10))} className="w-full accent-emerald-600" />
                </SliderBlock>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <button onClick={proceed} className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                        Proceed
                    </button>
                    <button onClick={repairDna} className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-900 hover:bg-sky-100 transition-colors flex items-center justify-center gap-2">
                        <Wrench size={15} /> DNA Repair
                    </button>
                    {/* ISSUE 1: Simulate DNA Damage button */}
                    <button onClick={simulateDnaDamage} className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-900 hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                        <Zap size={15} /> Simulate DNA Damage
                    </button>
                    <button onClick={resetLab} className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                        <RefreshCcw size={15} /> Reset
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <FactTile icon={<PauseCircle size={15} className="text-violet-600" />} title="G0 Logic">
                        Without a growth signal, a G1 cell can enter the quiescent G0 stage.
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

// ISSUE 3 + 4: SVG updated with mitosisSubPhase visual cues and NCERT terminology
const CellCycleSVG = ({
    phase,
    gateOpen,
    growthSignal,
    nutrientLevel,
    dnaIntact,
    ratio,
    mitosisSubPhase,
}: {
    phase: Phase;
    gateOpen: boolean;
    growthSignal: boolean;
    nutrientLevel: number;
    dnaIntact: boolean;
    ratio: number;
    mitosisSubPhase: MitosisSubPhase;
}) => {
    const activeIndex = phase === 'G0' ? -1 : PHASES.indexOf(phase);
    const cellScale = 0.82 + ratio / 250;

    // Render different nucleus/chromosome visuals depending on M sub-phase
    const renderMPhaseVisuals = () => {
        if (!mitosisSubPhase) return null;
        if (mitosisSubPhase === 'Prophase') {
            // Condensed chromosomes as scattered dots
            return (
                <>
                    {[100, 115, 130, 108, 122, 138].map((cx, i) => (
                        <circle key={i} cx={cx} cy={100 + (i % 3) * 12} r="5" fill="#4f46e5" opacity="0.85" />
                    ))}
                    <text x="120" y="215" textAnchor="middle" fontSize="11" fontWeight="800" fill="#4338ca">Prophase: Chromatin condensing</text>
                </>
            );
        }
        if (mitosisSubPhase === 'Metaphase') {
            // Chromosomes aligned as a horizontal bar
            return (
                <>
                    <line x1="88" y1="116" x2="152" y2="116" stroke="#4f46e5" strokeWidth="5" strokeLinecap="round" />
                    {[96, 108, 120, 132, 144].map((cx, i) => (
                        <circle key={i} cx={cx} cy="116" r="5" fill="#6366f1" />
                    ))}
                    <text x="120" y="215" textAnchor="middle" fontSize="11" fontWeight="800" fill="#4338ca">Metaphase: Aligned at plate</text>
                </>
            );
        }
        if (mitosisSubPhase === 'Anaphase') {
            // Dots separating to two poles
            return (
                <>
                    {[96, 108, 120].map((cx, i) => (
                        <circle key={`top-${i}`} cx={cx} cy={90 - i * 4} r="5" fill="#4f46e5" opacity="0.9" />
                    ))}
                    {[96, 108, 120].map((cx, i) => (
                        <circle key={`bot-${i}`} cx={cx} cy={142 + i * 4} r="5" fill="#4f46e5" opacity="0.9" />
                    ))}
                    <line x1="120" y1="44" x2="120" y2="188" stroke="#16a34a" strokeWidth="3" strokeDasharray="6 5" />
                    <text x="120" y="215" textAnchor="middle" fontSize="11" fontWeight="800" fill="#166534">Anaphase: Chromatids separating</text>
                </>
            );
        }
        if (mitosisSubPhase === 'Telophase') {
            // Two forming circles
            return (
                <>
                    <ellipse cx="93" cy="116" rx="30" ry="28" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" opacity="0.85" />
                    <ellipse cx="147" cy="116" rx="30" ry="28" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" opacity="0.85" />
                    <line x1="120" y1="70" x2="120" y2="162" stroke="#16a34a" strokeWidth="3" strokeDasharray="6 5" />
                    <text x="120" y="215" textAnchor="middle" fontSize="11" fontWeight="800" fill="#166534">Telophase: Two nuclei forming</text>
                </>
            );
        }
        return null;
    };

    return (
        <svg viewBox="0 0 640 360" className="w-full h-full" aria-label="Cell cycle regulation simulation">
            <rect width="640" height="360" rx="16" fill="#eef2ff" />
            <text x="320" y="30" textAnchor="middle" fontSize="18" fontWeight="800" fill="#312e81">Cell Cycle Gatekeeper</text>

            {/* Phase wheel */}
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

            {/* Cell visual */}
            <g transform="translate(346 84)">
                <ellipse cx="120" cy="116" rx={92 * cellScale} ry={72 * cellScale} fill="#dcfce7" stroke="#16a34a" strokeWidth="5" />
                <circle cx="120" cy="116" r="44" fill="#dbeafe" stroke="#2563eb" strokeWidth="4" />

                {/* ISSUE 3: Show sub-phase visuals in M phase; otherwise show default chromosome strands */}
                {phase === 'M' && mitosisSubPhase ? (
                    renderMPhaseVisuals()
                ) : (
                    <>
                        {phase === 'S' || phase === 'G2' || phase === 'M' ? (
                            <>
                                <path d="M98 99 C118 82 142 82 162 99 C142 116 118 116 98 99Z" fill="none" stroke="#4f46e5" strokeWidth="4" />
                                <path d="M98 132 C118 115 142 115 162 132 C142 149 118 149 98 132Z" fill="none" stroke="#4f46e5" strokeWidth="4" />
                            </>
                        ) : (
                            <path d="M98 116 C118 98 142 98 162 116 C142 134 118 134 98 116Z" fill="none" stroke="#4f46e5" strokeWidth="4" />
                        )}
                    </>
                )}

                <text x="120" y="20" textAnchor="middle" fontSize="13" fontWeight="900" fill="#166534">Transparent cell</text>
            </g>

            {/* Metabolic readiness bar */}
            <g transform="translate(70 278)">
                <rect x="0" y="0" width="150" height="18" rx="9" fill="#e2e8f0" />
                <rect x="0" y="0" width={nutrientLevel * 1.5} height="18" rx="9" fill={nutrientLevel >= 65 ? '#22c55e' : '#ef4444'} />
                <text x="0" y="-8" fontSize="12" fontWeight="900" fill="#475569">Metabolic readiness</text>
            </g>

            {/* Nucleo-cytoplasmic ratio bar */}
            <g transform="translate(254 278)">
                <rect x="0" y="0" width="150" height="18" rx="9" fill="#e2e8f0" />
                <rect x="0" y="0" width={ratio * 1.5} height="18" rx="9" fill={ratio > 80 ? '#f97316' : '#38bdf8'} />
                <text x="0" y="-8" fontSize="12" fontWeight="900" fill="#475569">Nucleo-cytoplasmic ratio</text>
            </g>

            {/* Gate status */}
            <g transform="translate(438 266)">
                <rect x="0" y="0" width="144" height="40" rx="14" fill={gateOpen ? '#dcfce7' : '#fee2e2'} stroke={gateOpen ? '#16a34a' : '#dc2626'} strokeWidth="3" />
                <text x="72" y="25" textAnchor="middle" fontSize="13" fontWeight="900" fill={gateOpen ? '#166534' : '#991b1b'}>{gateOpen ? 'Gate Open' : 'Gate Locked'}</text>
            </g>

            {/* ISSUE 4: Renamed Growth Signal label */}
            <text x="70" y="332" fontSize="12" fontWeight="800" fill={growthSignal ? '#166534' : '#7c2d12'}>
                Growth signal: {growthSignal ? 'present' : 'absent'}
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
