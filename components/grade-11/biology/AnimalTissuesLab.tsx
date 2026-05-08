import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Layers, RefreshCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

// ─── Types ────────────────────────────────────────────────────────────────────

type EpitheliumType = 'Simple' | 'Compound';
type ConnectiveType = 'Cartilage' | 'Bone';
type ActiveTest = 'epithelium' | 'connective';
type ZoomLevel = 'organ' | 'micro';

interface AnimalTissuesLabProps {
    topic: any;
    onExit: () => void;
}

// ─── Main Component ────────────────────────────────────────────────────────────

const AnimalTissuesLab: React.FC<AnimalTissuesLabProps> = ({ topic, onExit }) => {
    const [activeTest, setActiveTest]         = useState<ActiveTest>('epithelium');
    const [epitheliumType, setEpitheliumType] = useState<EpitheliumType>('Simple');
    const [connectiveType, setConnectiveType] = useState<ConnectiveType>('Cartilage');
    const [frictionLevel, setFrictionLevel]   = useState(0);      // 0–100
    const [weightLevel, setWeightLevel]       = useState(0);       // 0–100 kg
    const [zoomLevel, setZoomLevel]           = useState<ZoomLevel>('organ');
    const [chemDropped, setChemDropped]       = useState(false);

    // ── Derived state ──────────────────────────────────────────────────────────

    const epitheliumTorn  = epitheliumType === 'Simple'   && frictionLevel >= 50;
    const epitheliumWorn  = epitheliumType === 'Compound' && frictionLevel >= 80;
    const boneCompression = connectiveType === 'Bone'      ? 0 : Math.min(frictionLevel, weightLevel) * 0.20;
    const cartCompress    = connectiveType === 'Cartilage' ? Math.min(weightLevel * 0.20, 20) : 0;
    const boneCrack       = connectiveType === 'Bone'      && weightLevel >= 90;

    const epitheliumObservation = useMemo(() => {
        if (epitheliumType === 'Simple') {
            if (chemDropped) return 'Acid passes straight through the single-cell layer — the internal organs are exposed. Simple epithelium offers no chemical barrier.';
            if (epitheliumTorn) return 'Gaps have appeared in the single layer. Simple epithelium is not designed for mechanical protection — it is built for diffusion and filtration only.';
            if (frictionLevel > 0) return 'Light friction is already stressing the single-cell layer. Notice how thin and translucent it is.';
            return 'Simple epithelium: one cell thick, translucent. Ideal for diffusion — like in lung alveoli and blood capillary walls.';
        }
        if (chemDropped) return 'The top layers of compound epithelium absorb and neutralise the acid. The bottom layers remain fully intact — this is the protective function.';
        if (epitheliumWorn) return 'Only the topmost layer shows wear. The layers below are completely unaffected. This is why skin can withstand daily mechanical stress.';
        if (frictionLevel > 0) return 'Friction is being absorbed by the outer layers. Compound epithelium is built for exactly this purpose — protection over diffusion.';
        return 'Compound epithelium: two or more cell layers, opaque. Functions as armour — found in skin and the buccal (mouth) cavity.';
    }, [epitheliumType, frictionLevel, chemDropped, epitheliumTorn, epitheliumWorn]);

    const connectiveObservation = useMemo(() => {
        if (connectiveType === 'Cartilage') {
            if (weightLevel >= 90) return `Cartilage compressed by ${cartCompress.toFixed(0)}% under ${weightLevel} kg — and fully springs back when load is removed. Pliable chondroitin salt matrix resists compression without breaking.`;
            if (weightLevel > 0) return `Cartilage compressing slightly (${cartCompress.toFixed(0)}%). The pliable chondroitin matrix is absorbing the shock, like industrial rubber pads at a bridge joint.`;
            return 'Cartilage: solid but pliable matrix. Found at the tip of the nose, outer ear, and between vertebrae. Matrix contains chondroitin salts.';
        }
        if (boneCrack) return 'Bone cracked! Beyond its fracture limit (90+ kg), the rigid calcium-salt matrix fails. This is why bones break rather than compress.';
        if (weightLevel > 0) return `Bone: 0% compression under ${weightLevel} kg. The hard calcium-salt matrix and collagen fibres make it completely non-pliable — ideal for bearing body weight.`;
        return 'Bone: very hard, non-pliable matrix. Rich in calcium salts and collagen fibres. Forms the skeletal frame, protects organs, and anchors muscles.';
    }, [connectiveType, weightLevel, cartCompress, boneCrack]);

    const microViewText = useMemo(() => {
        if (activeTest === 'connective') {
            if (connectiveType === 'Bone') return 'Bone matrix: Dense calcium phosphate crystals (hydroxyapatite) deposited around collagen fibres. This mineral lattice is what makes bone rigid and non-compressible.';
            return 'Cartilage matrix: Long chondroitin sulphate chains form a gel-like network that traps water. This water-rich, pliable structure gives cartilage its shock-absorbing ability.';
        }
        if (epitheliumType === 'Simple') return 'Single layer of tightly packed cells on a basement membrane. Very thin — gases and nutrients can pass through by diffusion. Cells are flat (squamous), cuboidal, or columnar.';
        return 'Multiple stratified layers on a basement membrane. Top layers are flat (squamous). As top cells wear off, the layers beneath regenerate. Acts as a physical and chemical armour.';
    }, [activeTest, connectiveType, epitheliumType]);

    const resetLab = () => {
        setFrictionLevel(0);
        setWeightLevel(0);
        setChemDropped(false);
        setZoomLevel('organ');
    };

    // ── Simulation ─────────────────────────────────────────────────────────────

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-2 gap-3 flex-1 min-h-0">

                {/* Panel 1 — Epithelium */}
                <TissuePanel
                    title="Epithelial Tissue"
                    subtitle="Barrier protection test"
                    accent="sky"
                    headerTag={epitheliumType + ' Epithelium'}
                    active={activeTest === 'epithelium'}
                >
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-2 min-h-[220px]">
                        {zoomLevel === 'organ'
                            ? <EpitheliumSVG type={epitheliumType} friction={frictionLevel} chemDropped={chemDropped} />
                            : <MicroSVG type="epithelium" subtype={epitheliumType} />
                        }
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <MetricCard label="Cell Layers"   value={epitheliumType === 'Simple' ? '1 layer' : '5+ layers'} tone={epitheliumType === 'Simple' ? 'text-sky-700' : 'text-indigo-700'} />
                        <MetricCard label="Function"      value={epitheliumType === 'Simple' ? 'Diffusion' : 'Protection'} tone="text-slate-700" />
                        <MetricCard label="Status"        value={epitheliumTorn ? 'Torn' : epitheliumWorn ? 'Worn' : 'Intact'} tone={epitheliumTorn ? 'text-red-600' : epitheliumWorn ? 'text-amber-600' : 'text-emerald-600'} />
                    </div>
                </TissuePanel>

                {/* Panel 2 — Connective */}
                <TissuePanel
                    title="Connective Tissue"
                    subtitle="Structural integrity test"
                    accent="amber"
                    headerTag={connectiveType}
                    active={activeTest === 'connective'}
                >
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-2 min-h-[220px]">
                        {zoomLevel === 'organ'
                            ? <ConnectiveSVG type={connectiveType} weight={weightLevel} cracked={boneCrack} compression={cartCompress} />
                            : <MicroSVG type="connective" subtype={connectiveType} />
                        }
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <MetricCard label="Matrix"        value={connectiveType === 'Cartilage' ? 'Pliable' : 'Rigid'} tone={connectiveType === 'Cartilage' ? 'text-teal-700' : 'text-slate-700'} />
                        <MetricCard label="Key Salt"      value={connectiveType === 'Cartilage' ? 'Chondroitin' : 'Calcium'} tone="text-amber-700" />
                        <MetricCard label="Compression"   value={connectiveType === 'Bone' ? '0%' : `${cartCompress.toFixed(0)}%`} tone={boneCrack ? 'text-red-600' : 'text-emerald-600'} />
                    </div>
                </TissuePanel>
            </div>

            {/* Info cards */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
                <InfoCard title={activeTest === 'epithelium' ? 'Epithelium Observation' : 'Connective Observation'} icon={<Activity size={16} className="text-teal-600" />}>
                    <p>{activeTest === 'epithelium' ? epitheliumObservation : connectiveObservation}</p>
                </InfoCard>
                <InfoCard title={zoomLevel === 'micro' ? 'Microscopic View' : 'Key Logic'} icon={<Layers size={16} className="text-indigo-600" />}>
                    <p>{zoomLevel === 'micro' ? microViewText : activeTest === 'epithelium'
                        ? 'Simple epithelium is a filter — one cell thick for easy diffusion. Compound epithelium is armour — multiple layers to resist mechanical and chemical attack.'
                        : 'Cartilage is a spring — pliable chondroitin matrix absorbs shock and returns to shape. Bone is a girder — rigid calcium matrix holds permanent structure.'
                    }</p>
                </InfoCard>
                <InfoCard title="Real-World Analogy" icon={<ArrowRight size={16} className="text-amber-600" />}>
                    {activeTest === 'epithelium' ? (
                        <>
                            <p><strong className="text-slate-800">Simple:</strong> A thin glass pane — allows light (gases/nutrients) through easily.</p>
                            <p className="mt-2"><strong className="text-slate-800">Compound:</strong> A thick brick wall — multiple layers stop intruders (mechanical stress).</p>
                        </>
                    ) : (
                        <>
                            <p><strong className="text-slate-800">Cartilage:</strong> Industrial rubber pads / bubble wrap — compresses and bounces back.</p>
                            <p className="mt-2"><strong className="text-slate-800">Bone:</strong> Steel I-beam / wooden crate — rigid, load-bearing, no compression.</p>
                        </>
                    )}
                </InfoCard>
            </div>
        </div>
    );

    // ── Controls ───────────────────────────────────────────────────────────────

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">

                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                    <strong>Experiment Goal:</strong> Test how single-layer vs multi-layer epithelium handles mechanical and chemical stress, and compare how cartilage compresses while bone stays rigid.
                </div>

                {/* Active test selector */}
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Test Station</div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['epithelium', 'connective'] as ActiveTest[]).map((t) => (
                            <button key={t} onClick={() => { setActiveTest(t); resetLab(); }}
                                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all capitalize ${activeTest === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>
                                {t === 'epithelium' ? 'Epithelium' : 'Connective Tissue'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tissue type selector */}
                {activeTest === 'epithelium' ? (
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Epithelium Type</div>
                        <div className="grid grid-cols-2 gap-2">
                            {(['Simple', 'Compound'] as EpitheliumType[]).map((t) => (
                                <button key={t} onClick={() => { setEpitheliumType(t); resetLab(); }}
                                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${epitheliumType === t ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                                    {t} Epithelium
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Connective Tissue Type</div>
                        <div className="grid grid-cols-2 gap-2">
                            {(['Cartilage', 'Bone'] as ConnectiveType[]).map((t) => (
                                <button key={t} onClick={() => { setConnectiveType(t); resetLab(); }}
                                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${connectiveType === t ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Test controls */}
                {activeTest === 'epithelium' ? (
                    <div className="flex flex-col gap-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Friction Slider (Mechanical Scraper)</span>
                                <span className="text-xs font-bold text-slate-700">{frictionLevel}%</span>
                            </div>
                            <input type="range" min={0} max={100} value={frictionLevel}
                                onChange={(e) => setFrictionLevel(Number(e.target.value))}
                                className="w-full accent-sky-600" />
                        </div>
                        <button onClick={() => setChemDropped(p => !p)}
                            className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${chemDropped ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'}`}>
                            {chemDropped ? 'Chemical Dropper: Active' : 'Apply Chemical Dropper (Acid)'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Weight Dial (Hydraulic Press)</span>
                            <span className="text-xs font-bold text-slate-700">{weightLevel} kg</span>
                        </div>
                        <input type="range" min={0} max={100} value={weightLevel}
                            onChange={(e) => setWeightLevel(Number(e.target.value))}
                            className="w-full accent-amber-600" />
                        {boneCrack && (
                            <p className="text-xs font-bold text-red-600 mt-2">Bone fracture threshold exceeded!</p>
                        )}
                    </div>
                )}

                {/* Zoom toggle */}
                <button onClick={() => setZoomLevel(p => p === 'organ' ? 'micro' : 'organ')}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${zoomLevel === 'micro' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'}`}>
                    {zoomLevel === 'organ' ? 'Zoom In: Microscopic Matrix View' : 'Zoom Out: Organ View'}
                </button>

                {/* Fact tiles */}
                <div className="grid md:grid-cols-2 gap-3">
                    <FactTile icon={<Layers size={15} className="text-sky-600" />} title="Epithelium Logic">
                        Simple = filter (thin). Compound = armour (thick).
                    </FactTile>
                    <FactTile icon={<Zap size={15} className="text-amber-600" />} title="Connective Logic">
                        Cartilage = spring (chondroitin). Bone = girder (calcium).
                    </FactTile>
                </div>

                <button onClick={resetLab}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                    <RefreshCcw size={15} /> Reset Lab
                </button>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo} />
    );
};

// ─── SVG: Epithelium ──────────────────────────────────────────────────────────

const EpitheliumSVG: React.FC<{ type: EpitheliumType; friction: number; chemDropped: boolean }> = ({ type, friction, chemDropped }) => {
    const torn  = type === 'Simple'   && friction >= 50;
    const worn  = type === 'Compound' && friction >= 80;
    const acidY = chemDropped ? (type === 'Simple' ? 130 : 100) : -20;

    return (
        <svg viewBox="0 0 340 220" className="w-full h-full" aria-label="Epithelial tissue">
            <rect width="340" height="220" fill={type === 'Simple' ? '#f0f9ff' : '#f5f3ff'} rx="10" />

            {/* Label */}
            <text x="170" y="22" textAnchor="middle" fontSize="13" fontWeight="700" fill={type === 'Simple' ? '#0369a1' : '#5b21b6'}>{type} Epithelium</text>

            {/* Basement membrane */}
            <rect x="40" y="158" width="260" height="8" rx="2" fill="#cbd5e1" />
            <text x="170" y="182" textAnchor="middle" fontSize="11" fill="#64748b">Basement Membrane</text>

            {/* Simple — 1 layer of cells */}
            {type === 'Simple' && (
                <>
                    {[50, 82, 114, 146, 178, 210, 242, 274].map((x, i) => (
                        <React.Fragment key={i}>
                            {(!torn || i !== 3) && (
                                <rect x={x} y="128" width="24" height="28" rx="4"
                                    fill="#bae6fd" stroke="#0369a1" strokeWidth="1.5"
                                    opacity={torn && i > 3 ? 0.3 : 1} />
                            )}
                        </React.Fragment>
                    ))}
                    {torn && (
                        <text x="170" y="120" textAnchor="middle" fontSize="12" fontWeight="700" fill="#dc2626">Gap — torn!</text>
                    )}
                    {/* Nuclei dots */}
                    {[62, 94, 126, 190, 222, 254, 286].map((x, i) => (
                        <circle key={i} cx={x} cy="143" r="4" fill="#0369a1" opacity={torn && i > 2 ? 0.2 : 0.7} />
                    ))}
                    <text x="170" y="110" textAnchor="middle" fontSize="11" fill="#0369a1">1 cell layer — thin &amp; translucent</text>
                </>
            )}

            {/* Compound — 5 layers */}
            {type === 'Compound' && (
                <>
                    {[0, 1, 2, 3, 4].map((layer) => {
                        const y = 68 + layer * 18;
                        const worn_ = worn && layer === 0;
                        const fill = layer === 0 ? (worn_ ? '#fca5a5' : '#e9d5ff') :
                            layer === 1 ? '#ddd6fe' :
                                layer === 2 ? '#c4b5fd' :
                                    layer === 3 ? '#a78bfa' : '#7c3aed';
                        return (
                            <React.Fragment key={layer}>
                                {[50, 82, 114, 146, 178, 210, 242, 274].map((x, ci) => (
                                    <rect key={ci} x={x} y={y} width="24" height="14" rx="2"
                                        fill={fill} stroke="#7c3aed" strokeWidth="1" opacity={0.85} />
                                ))}
                            </React.Fragment>
                        );
                    })}
                    {worn && (
                        <text x="170" y="60" textAnchor="middle" fontSize="12" fontWeight="700" fill="#b45309">Top layer worn — lower layers intact</text>
                    )}
                    <text x="170" y="58" textAnchor="middle" fontSize="11" fill={worn ? 'transparent' : '#5b21b6'}>5 cell layers — opaque &amp; protective</text>
                </>
            )}

            {/* Acid drop animation */}
            {chemDropped && (
                <>
                    <circle cx="170" cy={type === 'Simple' ? 80 : 44} r="10" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
                    <text x="170" cy={type === 'Simple' ? 80 : 44} textAnchor="middle" fontSize="9" fill="#92400e">H⁺</text>
                    {type === 'Simple' && (
                        <text x="170" y="204" textAnchor="middle" fontSize="11" fontWeight="700" fill="#dc2626">Acid reached interior!</text>
                    )}
                    {type === 'Compound' && (
                        <text x="170" y="204" textAnchor="middle" fontSize="11" fontWeight="700" fill="#059669">Acid neutralised by top layers</text>
                    )}
                </>
            )}

            {/* Friction scraper */}
            {friction > 0 && (
                <rect x={40 + friction * 2.2} y={type === 'Simple' ? 122 : 62} width="30" height="8" rx="3"
                    fill="#f97316" opacity="0.7" />
            )}
        </svg>
    );
};

// ─── SVG: Connective ──────────────────────────────────────────────────────────

const ConnectiveSVG: React.FC<{ type: ConnectiveType; weight: number; cracked: boolean; compression: number }> = ({ type, weight, cracked, compression }) => {
    const blockH = 80 - compression;
    const blockY = 120 - blockH + 80;

    return (
        <svg viewBox="0 0 340 220" className="w-full h-full" aria-label="Connective tissue">
            <rect width="340" height="220" fill={type === 'Cartilage' ? '#f0fdf4' : '#f8fafc'} rx="10" />

            <text x="170" y="22" textAnchor="middle" fontSize="13" fontWeight="700"
                fill={type === 'Cartilage' ? '#065f46' : '#334155'}>{type}</text>

            {/* Press piston */}
            {weight > 0 && (
                <>
                    <rect x="115" y={30 + weight * 0.5} width="110" height="16" rx="4"
                        fill="#475569" />
                    <text x="170" y={30 + weight * 0.5 - 4} textAnchor="middle" fontSize="11" fill="#64748b">{weight} kg ↓</text>
                </>
            )}

            {/* Ground */}
            <rect x="60" y="176" width="220" height="8" rx="2" fill="#cbd5e1" />

            {/* Tissue block */}
            {type === 'Cartilage' ? (
                <>
                    <rect x="110" y={blockY} width="120" height={blockH} rx="8"
                        fill="#6ee7b7" stroke="#059669" strokeWidth="2.5" />
                    {/* chondroitin chains — wavy lines inside */}
                    {[120, 140, 160, 180, 200].map((x, i) => (
                        <path key={i}
                            d={`M${x} ${blockY + 10} C${x + 6} ${blockY + 18} ${x - 6} ${blockY + 26} ${x} ${blockY + 34}`}
                            stroke="#059669" strokeWidth="1.5" fill="none" opacity="0.6" />
                    ))}
                    <text x="170" y={blockY + blockH + 16} textAnchor="middle" fontSize="11" fill="#065f46">
                        {compression > 0 ? `Compressed ${compression.toFixed(0)}% — springs back` : 'Pliable matrix'}
                    </text>
                </>
            ) : (
                <>
                    <rect x="110" y="96" width="120" height="80" rx="4"
                        fill={cracked ? '#fca5a5' : '#e2e8f0'} stroke={cracked ? '#dc2626' : '#64748b'} strokeWidth="2.5" />
                    {/* calcium lattice — grid lines */}
                    {[125, 140, 155, 170, 185, 200, 215].map((x, i) => (
                        <line key={`v${i}`} x1={x} y1="96" x2={x} y2="176" stroke={cracked ? '#fca5a5' : '#94a3b8'} strokeWidth="1" />
                    ))}
                    {[110, 126, 142, 158, 174].map((y, i) => (
                        <line key={`h${i}`} x1="110" y1={y} x2="230" y2={y} stroke={cracked ? '#fca5a5' : '#94a3b8'} strokeWidth="1" />
                    ))}
                    {cracked && (
                        <path d="M170 96 L156 130 L174 148 L158 176" stroke="#dc2626" strokeWidth="3" fill="none" />
                    )}
                    <text x="170" y="192" textAnchor="middle" fontSize="11" fill={cracked ? '#dc2626' : '#334155'}>
                        {cracked ? 'Bone cracked!' : weight > 0 ? '0% compression — rigid' : 'Rigid calcium matrix'}
                    </text>
                </>
            )}

            {/* Compression % label */}
            {type === 'Cartilage' && compression > 0 && (
                <text x="250" y="140" fontSize="20" fontWeight="700" fill="#059669">{compression.toFixed(0)}%</text>
            )}
        </svg>
    );
};

// ─── SVG: Microscopic view ────────────────────────────────────────────────────

const MicroSVG: React.FC<{ type: 'epithelium' | 'connective'; subtype: string }> = ({ type, subtype }) => {
    if (type === 'epithelium' && subtype === 'Simple') {
        return (
            <svg viewBox="0 0 340 220" className="w-full h-full">
                <rect width="340" height="220" fill="#f0f9ff" rx="10" />
                <text x="170" y="20" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0369a1">Simple Epithelium — Microscopic</text>
                {/* Single row of cells with nuclei */}
                {[40, 80, 120, 160, 200, 240, 280].map((x, i) => (
                    <React.Fragment key={i}>
                        <rect x={x} y="90" width="32" height="60" rx="4" fill="#bae6fd" stroke="#0369a1" strokeWidth="1.5" />
                        <ellipse cx={x + 16} cy="120" rx="8" ry="10" fill="#0369a1" opacity="0.5" />
                    </React.Fragment>
                ))}
                <rect x="40" y="152" width="272" height="6" rx="2" fill="#94a3b8" />
                <text x="170" y="170" textAnchor="middle" fontSize="11" fill="#475569">Basement Membrane</text>
                <text x="170" y="188" textAnchor="middle" fontSize="11" fill="#0369a1">Single flat squamous cells — ideal for diffusion</text>
            </svg>
        );
    }
    if (type === 'epithelium' && subtype === 'Compound') {
        return (
            <svg viewBox="0 0 340 220" className="w-full h-full">
                <rect width="340" height="220" fill="#f5f3ff" rx="10" />
                <text x="170" y="20" textAnchor="middle" fontSize="12" fontWeight="700" fill="#5b21b6">Compound Epithelium — Microscopic</text>
                {['#ddd6fe', '#c4b5fd', '#a78bfa', '#7c3aed', '#5b21b6'].map((fill, layer) => (
                    [40, 80, 120, 160, 200, 240, 280].map((x, ci) => (
                        <rect key={`${layer}-${ci}`} x={x} y={34 + layer * 24} width="32" height="20" rx="3"
                            fill={fill} stroke="#5b21b6" strokeWidth="0.8" />
                    ))
                ))}
                <rect x="40" y="162" width="272" height="6" rx="2" fill="#94a3b8" />
                <text x="170" y="178" textAnchor="middle" fontSize="11" fill="#475569">Basement Membrane</text>
                <text x="170" y="198" textAnchor="middle" fontSize="11" fill="#5b21b6">5 stratified layers — upper flat, lower cuboidal</text>
            </svg>
        );
    }
    if (type === 'connective' && subtype === 'Bone') {
        return (
            <svg viewBox="0 0 340 220" className="w-full h-full">
                <rect width="340" height="220" fill="#f8fafc" rx="10" />
                <text x="170" y="20" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">Bone Matrix — Microscopic</text>
                {/* Haversian canal circles */}
                {[[110, 110], [230, 110], [170, 160]].map(([cx, cy], i) => (
                    <React.Fragment key={i}>
                        <circle cx={cx} cy={cy} r="44" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                        <circle cx={cx} cy={cy} r="30" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                        <circle cx={cx} cy={cy} r="16" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                        <circle cx={cx} cy={cy} r="6" fill="#64748b" />
                        {/* Calcium deposits */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, j) => {
                            const rad = angle * Math.PI / 180;
                            return <circle key={j} cx={cx + 23 * Math.cos(rad)} cy={cy + 23 * Math.sin(rad)} r="3" fill="#fbbf24" />;
                        })}
                    </React.Fragment>
                ))}
                <text x="170" y="210" textAnchor="middle" fontSize="11" fill="#475569">Haversian canals with calcium crystal deposits</text>
            </svg>
        );
    }
    // Cartilage micro
    return (
        <svg viewBox="0 0 340 220" className="w-full h-full">
            <rect width="340" height="220" fill="#f0fdf4" rx="10" />
            <text x="170" y="20" textAnchor="middle" fontSize="12" fontWeight="700" fill="#065f46">Cartilage Matrix — Microscopic</text>
            {/* Gel-like matrix with chondrocytes */}
            <ellipse cx="170" cy="120" rx="130" ry="80" fill="#bbf7d0" stroke="#059669" strokeWidth="2" />
            {/* Chondrocytes in lacunae */}
            {[[110, 100], [160, 90], [210, 100], [130, 135], [180, 140], [220, 130], [150, 155]].map(([cx, cy], i) => (
                <React.Fragment key={i}>
                    <ellipse cx={cx} cy={cy} rx="14" ry="10" fill="#6ee7b7" stroke="#059669" strokeWidth="1.5" />
                    <ellipse cx={cx} cy={cy} rx="5" ry="4" fill="#059669" opacity="0.6" />
                </React.Fragment>
            ))}
            {/* Chondroitin chains */}
            {[80, 120, 160, 200, 240].map((x, i) => (
                <path key={i} d={`M${x} 70 C${x + 10} 85 ${x - 10} 100 ${x} 115 C${x + 10} 130 ${x - 10} 145 ${x} 160`}
                    stroke="#34d399" strokeWidth="1.5" fill="none" opacity="0.7" />
            ))}
            <text x="170" y="210" textAnchor="middle" fontSize="11" fill="#065f46">Chondrocytes in lacunae — chondroitin matrix</text>
        </svg>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const TissuePanel = ({
    title, subtitle, accent, headerTag, active, children,
}: {
    title: string; subtitle: string; accent: 'sky' | 'amber';
    headerTag: string; active: boolean; children: React.ReactNode;
}) => {
    const chipTone = accent === 'sky' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800';
    const borderTone = active ? (accent === 'sky' ? 'border-sky-400' : 'border-amber-400') : 'border-slate-200';
    return (
        <div className={`rounded-2xl border-2 bg-white p-3 shadow-sm flex flex-col min-h-0 transition-all ${borderTone}`}>
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

export default AnimalTissuesLab;
