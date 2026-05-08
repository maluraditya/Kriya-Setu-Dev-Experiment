import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Beaker, FlaskConical, RefreshCcw, ScanEye } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type LabMode = 'Amino Acid' | 'Lipid';
type RGroup = 'H' | 'CH3' | 'CH2OH';

interface BiomoleculesLabProps {
    topic: any;
    onExit: () => void;
}

const R_GROUP_INFO: Record<RGroup, { name: string; label: string; color: string }> = {
    H: { name: 'Glycine', label: '-H', color: '#38bdf8' },
    CH3: { name: 'Alanine', label: '-CH3', color: '#f59e0b' },
    CH2OH: { name: 'Serine', label: '-CH2OH', color: '#22c55e' },
};

const BiomoleculesLab: React.FC<BiomoleculesLabProps> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<LabMode>('Amino Acid');
    const [rGroup, setRGroup] = useState<RGroup>('CH3');
    const [pH, setPH] = useState(7);
    const [fattyAcids, setFattyAcids] = useState(1);

    const aminoCharge = useMemo(() => {
        if (pH <= 3) return { amino: 'NH3+', carboxyl: 'COOH', status: 'Acidic form: amino group is protonated.' };
        if (pH >= 10) return { amino: 'NH2', carboxyl: 'COO-', status: 'Basic form: carboxyl group has lost a proton.' };
        return { amino: 'NH3+', carboxyl: 'COO-', status: 'Zwitterion: the molecule has both positive and negative charges.' };
    }, [pH]);

    const lipidName = fattyAcids === 0 ? 'Glycerol' : fattyAcids === 1 ? 'Monoglyceride' : fattyAcids === 2 ? 'Diglyceride' : 'Triglyceride';

    const observation = useMemo(() => {
        if (mode === 'Amino Acid') {
            return `The R group is ${R_GROUP_INFO[rGroup].label}, so the amino acid is identified as ${R_GROUP_INFO[rGroup].name}. At pH ${pH}, ${aminoCharge.status}`;
        }
        if (fattyAcids === 3) return 'Three fatty acids are esterified with glycerol. The final molecule is a triglyceride, a water-insoluble lipid used for energy storage.';
        return `${fattyAcids} fatty acid chain${fattyAcids === 1 ? '' : 's'} attached. Add ${3 - fattyAcids} more to complete triglyceride formation. Each ester bond releases one water molecule.`;
    }, [aminoCharge.status, fattyAcids, mode, pH, rGroup]);

    const resetLab = () => {
        setMode('Amino Acid');
        setRGroup('CH3');
        setPH(7);
        setFattyAcids(1);
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-[1.25fr_0.75fr] gap-3 flex-1 min-h-0">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Molecular Assembly Dock</div>
                            <div className="text-xs text-slate-500">Chapter 9 - amino acids and lipids</div>
                        </div>
                        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">{mode}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2 min-h-[320px]">
                        {mode === 'Amino Acid' ? (
                            <AminoAcidSVG rGroup={rGroup} amino={aminoCharge.amino} carboxyl={aminoCharge.carboxyl} pH={pH} />
                        ) : (
                            <LipidSVG fattyAcids={fattyAcids} />
                        )}
                    </div>
                    <div className="grid sm:grid-cols-4 gap-2 mt-2">
                        <MetricCard label="Mode" value={mode} tone="text-emerald-700" />
                        <MetricCard label="Molecule" value={mode === 'Amino Acid' ? R_GROUP_INFO[rGroup].name : lipidName} tone="text-indigo-700" />
                        <MetricCard label="pH" value={`${pH}`} tone={pH < 5 ? 'text-red-700' : pH > 9 ? 'text-violet-700' : 'text-teal-700'} />
                        <MetricCard label="Water Released" value={mode === 'Lipid' ? `${fattyAcids} H2O` : '0'} tone="text-sky-700" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-3 min-h-0">
                    <InfoCard title="Live Observation" icon={<ScanEye size={16} className="text-indigo-600" />}>
                        <p>{observation}</p>
                    </InfoCard>
                    <InfoCard title="NCERT Logic" icon={<Activity size={16} className="text-teal-600" />}>
                        <p>Amino acids follow substituted methane logic around the alpha-carbon. Lipids form triglycerides when three fatty acids esterify with glycerol.</p>
                    </InfoCard>
                    <InfoCard title="Classroom Analogy" icon={<ArrowRight size={16} className="text-amber-600" />}>
                        <p>Monomers are like Lego bricks. Change the small R group or the sequence of units, and the final biological molecule changes its identity and function.</p>
                    </InfoCard>
                </div>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <strong>Experiment Goal:</strong> Build amino acids by changing the R group, then assemble a triglyceride by attaching fatty acids to glycerol.
                </div>

                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assembly Mode</div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['Amino Acid', 'Lipid'] as LabMode[]).map((item) => (
                            <button key={item} onClick={() => setMode(item)}
                                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${mode === item ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}>
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                {mode === 'Amino Acid' ? (
                    <>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">R-Group Toggle</div>
                            <div className="grid grid-cols-3 gap-2">
                                {(['H', 'CH3', 'CH2OH'] as RGroup[]).map((group) => (
                                    <button key={group} onClick={() => setRGroup(group)}
                                        className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${rGroup === group ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>
                                        {R_GROUP_INFO[group].name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <SliderBlock label="pH Adjustment" value={`pH ${pH}`} minLabel="Acidic" maxLabel="Basic">
                            <input type="range" min="1" max="14" value={pH} onChange={(e) => setPH(parseInt(e.target.value, 10))} className="w-full accent-violet-600" />
                        </SliderBlock>
                    </>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fatty Acid Chains</span>
                            <span className="text-xs font-bold text-slate-700">{fattyAcids}/3 attached</span>
                        </div>
                        <input type="range" min="0" max="3" value={fattyAcids} onChange={(e) => setFattyAcids(parseInt(e.target.value, 10))} className="w-full accent-amber-600" />
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-3">
                    <FactTile icon={<Beaker size={15} className="text-indigo-600" />} title="Amino Acid Rule">
                        Same alpha-carbon pattern; R group decides whether it is glycine, alanine, or serine.
                    </FactTile>
                    <FactTile icon={<FlaskConical size={15} className="text-amber-600" />} title="Lipid Rule">
                        Glycerol plus three fatty acids forms a triglyceride by esterification.
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

const AminoAcidSVG = ({ rGroup, amino, carboxyl, pH }: { rGroup: RGroup; amino: string; carboxyl: string; pH: number }) => {
    const isZwitterion = pH > 3 && pH < 10;
    const info = R_GROUP_INFO[rGroup];
    return (
        <svg viewBox="0 0 640 360" className="w-full h-full" aria-label="Amino acid molecular assembly">
            <rect width="640" height="360" rx="16" fill="#f8fafc" />
            <text x="320" y="34" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">{info.name}: substituted methane pattern</text>
            <circle cx="320" cy="178" r="34" fill="#111827" />
            <text x="320" y="186" textAnchor="middle" fontSize="20" fontWeight="900" fill="white">C</text>
            <Bond x1={320} y1={144} x2={320} y2={82} />
            <Bond x1={320} y1={212} x2={320} y2={278} />
            <Bond x1={286} y1={178} x2={166} y2={178} />
            <Bond x1={354} y1={178} x2={474} y2={178} />
            <GroupBubble x={320} y={72} text="-H" color="#64748b" />
            <GroupBubble x={320} y={292} text={info.label} color={info.color} />
            <GroupBubble x={142} y={178} text={`-${amino}`} color="#0ea5e9" />
            <GroupBubble x={498} y={178} text={`-${carboxyl}`} color="#ef4444" />
            {isZwitterion && <text x="320" y="334" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0f766e">Zwitterion: positive and negative charges present together</text>}
            <text x="320" y="122" textAnchor="middle" fontSize="12" fontWeight="700" fill="#475569">alpha-carbon</text>
        </svg>
    );
};

const LipidSVG = ({ fattyAcids }: { fattyAcids: number }) => (
    <svg viewBox="0 0 640 360" className="w-full h-full" aria-label="Triglyceride assembly">
        <rect width="640" height="360" rx="16" fill="#fffbeb" />
        <text x="320" y="34" textAnchor="middle" fontSize="18" fontWeight="800" fill="#78350f">Glycerol + fatty acids = triglyceride</text>
        {[110, 180, 250].map((y, i) => (
            <g key={y}>
                <rect x="120" y={y - 18} width="110" height="36" rx="12" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
                <text x="175" y={y + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#92400e">C{i + 1}-OH</text>
                {i < fattyAcids ? (
                    <>
                        <line x1="230" y1={y} x2="285" y2={y} stroke="#92400e" strokeWidth="5" />
                        <path d={`M285 ${y} C340 ${y - 28} 395 ${y + 28} 450 ${y} S535 ${y - 12} 580 ${y}`} fill="none" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
                        <circle cx="266" cy={y - 22} r="13" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />
                        <text x="266" y={y - 18} textAnchor="middle" fontSize="10" fontWeight="800" fill="#075985">H2O</text>
                    </>
                ) : (
                    <text x="360" y={y + 5} fontSize="13" fontWeight="800" fill="#94a3b8">Attach fatty acid here</text>
                )}
            </g>
        ))}
        <text x="320" y="326" textAnchor="middle" fontSize="15" fontWeight="800" fill="#92400e">
            {fattyAcids === 3 ? 'Triglyceride complete: three ester bonds formed' : `${fattyAcids}/3 fatty acids attached`}
        </text>
    </svg>
);

const Bond = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="5" strokeLinecap="round" />
);

const GroupBubble = ({ x, y, text, color }: { x: number; y: number; text: string; color: string }) => (
    <g>
        <rect x={x - 48} y={y - 22} width="96" height="44" rx="16" fill="white" stroke={color} strokeWidth="3" />
        <text x={x} y={y + 6} textAnchor="middle" fontSize="17" fontWeight="900" fill={color}>{text}</text>
    </g>
);

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

export default BiomoleculesLab;
