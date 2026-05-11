import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, BatteryCharging, Droplets, RefreshCcw, Shuffle, SlidersHorizontal } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type MoleculeType = 'Neutral' | 'Polar' | 'Ion';
type ProteinMode = 'Simple Bilayer' | 'Carrier Protein' | 'Active Pump';

interface CellMembraneLabProps {
    topic: any;
    onExit: () => void;
}

const CellMembraneLab: React.FC<CellMembraneLabProps> = ({ topic, onExit }) => {
    const [molecule, setMolecule] = useState<MoleculeType>('Neutral');
    const [proteinMode, setProteinMode] = useState<ProteinMode>('Simple Bilayer');
    const [outsideCount, setOutsideCount] = useState(8);
    const [insideCount, setInsideCount] = useState(3);
    const [fluidity, setFluidity] = useState(55);
    const [atp, setAtp] = useState(4);

    const gradient = outsideCount > insideCount ? 'outside to inside' : outsideCount < insideCount ? 'inside to outside' : 'balanced';
    const activePossible = proteinMode === 'Active Pump' && molecule === 'Ion' && atp > 0;
    // NCERT: active transport moves ions against gradient (from low to high concentration)
    const pumpDirection = insideCount >= outsideCount ? 'outward' : 'inward'; // against gradient means pumping to the already-higher side

    const transportStatus = useMemo(() => {
        if (molecule === 'Neutral' && proteinMode === 'Simple Bilayer') {
            return 'Neutral solutes such as O2 and CO2 can pass directly through the lipid bilayer by simple diffusion.';
        }
        if (molecule === 'Polar' && proteinMode !== 'Carrier Protein') {
            return 'Polar molecules bounce off the hydrophobic core. They need a carrier protein for facilitated diffusion.';
        }
        if (molecule === 'Polar' && proteinMode === 'Carrier Protein') {
            return 'The carrier protein binds the polar molecule, changes shape, and releases it on the other side without ATP.';
        }
        if (molecule === 'Ion' && proteinMode !== 'Active Pump') {
            return 'Charged ions cannot cross the non-polar lipid core on their own. They need a membrane pump or channel.';
        }
        if (activePossible) {
            return `ATP powers the pump: ions move against the concentration gradient — from lower concentration (outside: ${outsideCount}) to higher concentration (inside: ${insideCount}). This is active transport.`;
        }
        return 'The pump is present, but it cannot run without ATP energy.';
    }, [activePossible, molecule, proteinMode]);

    const resetLab = () => {
        setMolecule('Neutral');
        setProteinMode('Simple Bilayer');
        setOutsideCount(8);
        setInsideCount(3);
        setFluidity(55);
        setAtp(4);
    };

    const runTransport = () => {
        if (molecule === 'Neutral' && outsideCount !== insideCount) {
            outsideCount > insideCount ? setOutsideCount(v => v - 1) : setOutsideCount(v => v + 1);
            outsideCount > insideCount ? setInsideCount(v => v + 1) : setInsideCount(v => v - 1);
            return;
        }
        if (molecule === 'Polar' && proteinMode === 'Carrier Protein' && outsideCount !== insideCount) {
            outsideCount > insideCount ? setOutsideCount(v => v - 1) : setOutsideCount(v => v + 1);
            outsideCount > insideCount ? setInsideCount(v => v + 1) : setInsideCount(v => v - 1);
            return;
        }
        if (molecule === 'Ion' && proteinMode === 'Active Pump' && atp > 0) {
            // NCERT: Active transport moves ions AGAINST the gradient (low → high)
            // We pump from outside into inside to raise inside concentration (against gradient)
            // even if inside is already higher — that is the defining property of active transport
            if (outsideCount > 0) {
                setOutsideCount(v => Math.max(0, v - 1));
                setInsideCount(v => v + 1);
            } else {
                // Pump in reverse when outside is empty — demonstrate bidirectionality
                setInsideCount(v => Math.max(0, v - 1));
                setOutsideCount(v => v + 1);
            }
            setAtp(v => Math.max(0, v - 1));
        }
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-[1.25fr_0.75fr] gap-3 flex-1 min-h-0">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Fluid Mosaic Membrane</div>
                            <div className="text-xs text-slate-500">Section 8.5.1 - transport across membrane</div>
                        </div>
                        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">{proteinMode}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2 min-h-[320px]">
                        <MembraneSVG
                            molecule={molecule}
                            proteinMode={proteinMode}
                            outsideCount={outsideCount}
                            insideCount={insideCount}
                            fluidity={fluidity}
                            activePossible={activePossible}
                        />
                    </div>
                    <div className="grid sm:grid-cols-4 gap-2 mt-2">
                        <MetricCard label="Outside" value={`${outsideCount} particles`} tone="text-sky-700" />
                        <MetricCard label="Inside" value={`${insideCount} particles`} tone="text-emerald-700" />
                        <MetricCard label="Gradient" value={gradient} tone="text-slate-700" />
                        <MetricCard label="ATP" value={atp > 0 ? `${atp} units` : 'Depleted'} tone={atp > 0 ? 'text-amber-700' : 'text-red-600'} />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-3 min-h-0">
                    <InfoCard title="Live Observation" icon={<Activity size={16} className="text-indigo-600" />}>
                        <p>{transportStatus}</p>
                    </InfoCard>
                    <InfoCard title="Membrane Logic" icon={<Droplets size={16} className="text-sky-600" />}>
                        <p>Hydrophilic heads face water. Hydrophobic tails hide inside. This makes the bilayer stable, but it also blocks polar and charged substances.</p>
                    </InfoCard>
                    <InfoCard title="Daily Analogy" icon={<ArrowRight size={16} className="text-amber-600" />}>
                        <p>Simple diffusion is like walking through an open metro passage. Facilitated diffusion is like using a gate. Active transport is like a powered gate pushing people against the crowd flow.</p>
                    </InfoCard>
                </div>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
                    <strong>Experiment Goal:</strong> Test which molecules cross a quasi-fluid phospholipid bilayer and when proteins or ATP are required.
                </div>

                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Molecule Selector</div>
                    <div className="grid grid-cols-3 gap-2">
                        {(['Neutral', 'Polar', 'Ion'] as MoleculeType[]).map((type) => (
                            <button key={type} onClick={() => setMolecule(type)}
                                className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${molecule === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Protein Toggle</div>
                    <div className="grid grid-cols-3 gap-2">
                        {(['Simple Bilayer', 'Carrier Protein', 'Active Pump'] as ProteinMode[]).map((mode) => (
                            <button key={mode} onClick={() => setProteinMode(mode)}
                                className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${proteinMode === mode ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'}`}>
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <SliderBlock label="Outside Concentration" value={`${outsideCount}`} minLabel="Low" maxLabel="High">
                    <input type="range" min="0" max="12" value={outsideCount} onChange={(e) => setOutsideCount(parseInt(e.target.value, 10))} className="w-full accent-sky-600" />
                </SliderBlock>

                <SliderBlock label="Inside Concentration" value={`${insideCount}`} minLabel="Low" maxLabel="High">
                    <input type="range" min="0" max="12" value={insideCount} onChange={(e) => setInsideCount(parseInt(e.target.value, 10))} className="w-full accent-emerald-600" />
                </SliderBlock>

                {/* Fluidity slider removed — not in NCERT Class 11 scope */}
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800">
                    <strong>NCERT Note:</strong> The cell membrane is described as a <em>quasi-fluid</em> structure (Fluid Mosaic Model by Singer and Nicolson, 1972). Phospholipids can move laterally, allowing proteins to be embedded and move within the bilayer.
                </div>

                <div className="grid sm:grid-cols-3 gap-2">
                    <button onClick={runTransport} className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                        Run Transport
                    </button>
                    <button onClick={() => setAtp(v => Math.min(6, v + 1))} className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 hover:bg-amber-100 transition-colors flex items-center justify-center gap-2">
                        <BatteryCharging size={15} /> ATP Injector
                    </button>
                    <button onClick={resetLab} className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                        <RefreshCcw size={15} /> Reset
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <FactTile icon={<Shuffle size={15} className="text-violet-600" />} title="Fluid Mosaic Model">
                        Singer &amp; Nicolson (1972): Proteins float like icebergs in a quasi-fluid phospholipid sea.
                    </FactTile>
                    <FactTile icon={<SlidersHorizontal size={15} className="text-teal-600" />} title="Selective Permeability">
                        Neutral molecules pass easily; polar molecules and ions need help.
                    </FactTile>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

const MembraneSVG: React.FC<{
    molecule: MoleculeType;
    proteinMode: ProteinMode;
    outsideCount: number;
    insideCount: number;
    fluidity: number;
    activePossible: boolean;
}> = ({ molecule, proteinMode, outsideCount, insideCount, fluidity, activePossible }) => {
    const moleculeColor = molecule === 'Neutral' ? '#22c55e' : molecule === 'Polar' ? '#ec4899' : '#f59e0b';
    const wobble = fluidity / 12;
    const showCarrier = proteinMode === 'Carrier Protein' || proteinMode === 'Active Pump';
    const proteinColor = proteinMode === 'Active Pump' ? '#7c3aed' : '#6366f1';

    return (
        <svg viewBox="0 0 640 360" className="w-full h-full" aria-label="Cell membrane transport simulation">
            <rect width="640" height="360" rx="16" fill="#eff6ff" />
            <rect x="0" y="0" width="640" height="120" fill="#dbeafe" opacity="0.65" />
            <rect x="0" y="240" width="640" height="120" fill="#dcfce7" opacity="0.72" />
            <text x="24" y="34" fontSize="13" fontWeight="800" fill="#1d4ed8">Outside cell: watery environment</text>
            <text x="24" y="333" fontSize="13" fontWeight="800" fill="#166534">Inside cell: cytoplasm</text>

            {/* molecules */}
            {Array.from({ length: outsideCount }).map((_, i) => (
                <circle key={`out-${i}`} cx={78 + (i % 6) * 76} cy={64 + Math.floor(i / 6) * 32} r={molecule === 'Ion' ? 10 : molecule === 'Polar' ? 12 : 8} fill={moleculeColor} stroke="#0f172a" strokeWidth="1.5" opacity="0.9" />
            ))}
            {Array.from({ length: insideCount }).map((_, i) => (
                <circle key={`in-${i}`} cx={92 + (i % 6) * 76} cy={294 - Math.floor(i / 6) * 32} r={molecule === 'Ion' ? 10 : molecule === 'Polar' ? 12 : 8} fill={moleculeColor} stroke="#0f172a" strokeWidth="1.5" opacity="0.9" />
            ))}

            {/* phospholipid bilayer */}
            <g>
                {Array.from({ length: 18 }).map((_, i) => {
                    const x = 38 + i * 33;
                    const shift = Math.sin(i * 1.7) * wobble;
                    return (
                        <g key={`top-${i}`}>
                            <line x1={x} y1={144 + shift} x2={x - 7} y2={177 + shift} stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                            <line x1={x} y1={144 + shift} x2={x + 7} y2={177 + shift} stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                            <circle cx={x} cy={135 + shift} r="12" fill="#38bdf8" stroke="#0369a1" strokeWidth="2" />
                        </g>
                    );
                })}
                {Array.from({ length: 18 }).map((_, i) => {
                    const x = 38 + i * 33;
                    const shift = Math.cos(i * 1.5) * wobble;
                    return (
                        <g key={`bottom-${i}`}>
                            <line x1={x} y1={216 + shift} x2={x - 7} y2={183 + shift} stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                            <line x1={x} y1={216 + shift} x2={x + 7} y2={183 + shift} stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                            <circle cx={x} cy={225 + shift} r="12" fill="#38bdf8" stroke="#0369a1" strokeWidth="2" />
                        </g>
                    );
                })}
            </g>

            <rect x="26" y="171" width="588" height="18" rx="9" fill="#334155" opacity="0.18" />
            <text x="320" y="184" textAnchor="middle" fontSize="12" fontWeight="800" fill="#334155">Hydrophobic tail zone blocks polar molecules and ions</text>

            {showCarrier && (
                <g>
                    <path d="M300 125 C268 145 268 215 300 235 L340 235 C372 215 372 145 340 125 Z" fill={proteinColor} opacity="0.92" stroke="#312e81" strokeWidth="4" />
                    <ellipse cx="320" cy="180" rx="19" ry="54" fill="#eef2ff" opacity="0.86" />
                    <text x="320" y="122" textAnchor="middle" fontSize="12" fontWeight="800" fill="#312e81">
                        {proteinMode === 'Active Pump' ? 'ATP Pump' : 'Carrier'}
                    </text>
                    {activePossible && (
                        <path d="M354 180 C398 188 426 168 454 146" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" markerEnd="url(#arrow)" />
                    )}
                </g>
            )}

            {/* transport path hints */}
            {molecule === 'Neutral' && proteinMode === 'Simple Bilayer' && (
                <path d="M186 92 C205 129 208 206 236 265" fill="none" stroke="#22c55e" strokeWidth="5" strokeDasharray="8 7" markerEnd="url(#greenArrow)" />
            )}
            {molecule === 'Polar' && proteinMode !== 'Carrier Protein' && (
                <text x="320" y="111" textAnchor="middle" fontSize="13" fontWeight="800" fill="#be185d">Polar molecule blocked by hydrophobic core</text>
            )}
            {molecule === 'Ion' && proteinMode !== 'Active Pump' && (
                <text x="320" y="111" textAnchor="middle" fontSize="13" fontWeight="800" fill="#b45309">Ion needs a powered pump</text>
            )}

            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#f59e0b" />
                </marker>
                <marker id="greenArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#22c55e" />
                </marker>
            </defs>
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

export default CellMembraneLab;
