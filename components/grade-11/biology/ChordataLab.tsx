import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Heart, RefreshCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

// ─── Types ───────────────────────────────────────────────────────────────────

type Subphylum = 'Urochordata' | 'Cephalochordata' | 'Vertebrata';
type DevStage = 'Embryo' | 'Adult';
type HighlightFeature = 'none' | 'notochord' | 'nerve-cord' | 'gill-slits' | 'post-anal-tail';
type HeartClass = 'Pisces' | 'Amphibia' | 'Mammalia';

interface ChordataLabProps {
    topic: any;
    onExit: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SUBPHYLA: Subphylum[] = ['Urochordata', 'Cephalochordata', 'Vertebrata'];
const DEV_STAGES: DevStage[] = ['Embryo', 'Adult'];
const HEART_CLASSES: HeartClass[] = ['Pisces', 'Amphibia', 'Mammalia'];

const FEATURE_LABELS: { key: HighlightFeature; label: string; color: string }[] = [
    { key: 'notochord',      label: 'Notochord',             color: 'bg-amber-500 text-white border-amber-500' },
    { key: 'nerve-cord',     label: 'Dorsal Nerve Cord',     color: 'bg-sky-500 text-white border-sky-500' },
    { key: 'gill-slits',     label: 'Pharyngeal Gill Slits', color: 'bg-emerald-500 text-white border-emerald-500' },
    { key: 'post-anal-tail', label: 'Post-Anal Tail',        color: 'bg-violet-500 text-white border-violet-500' },
];

const HEART_CHAMBERS: Record<HeartClass, { chambers: number; label: string; color: string }> = {
    Pisces:   { chambers: 2, label: '2-Chambered',  color: '#38bdf8' },
    Amphibia: { chambers: 3, label: '3-Chambered',  color: '#fb923c' },
    Mammalia: { chambers: 4, label: '4-Chambered',  color: '#f87171' },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ChordataLab: React.FC<ChordataLabProps> = ({ topic, onExit }) => {
    const [subphylum, setSubphylum]           = useState<Subphylum>('Vertebrata');
    const [devStage, setDevStage]             = useState<DevStage>('Embryo');
    const [highlight, setHighlight]           = useState<HighlightFeature>('none');
    const [heartClass, setHeartClass]         = useState<HeartClass>('Pisces');

    // ── Derived observations ──────────────────────────────────────────────────

    const bodyObservation = useMemo(() => {
        if (subphylum === 'Urochordata') {
            if (devStage === 'Embryo') return 'In the larval (tadpole) stage of Urochordata, all four chordate features are visible — notochord, nerve cord, gill slits, and post-anal tail.';
            return 'In the adult Urochordata (e.g., Herdmania), the notochord and tail disappear. Only gill slits remain for filter-feeding. The animal becomes sessile.';
        }
        if (subphylum === 'Cephalochordata') {
            return 'Cephalochordata (e.g., Amphioxus / Branchiostoma) retains all four features throughout adult life. The notochord extends from head to tail — hence the name "Cephalochordata".';
        }
        // Vertebrata
        if (devStage === 'Embryo') return 'The embryo shows the notochord (yellow rod) as the primary support axis. The dorsal hollow nerve cord lies above it. Gill slits are visible in the pharynx region.';
        return 'In the adult Vertebrata, the notochord is replaced by a hard vertebral column (grey segments). The nerve cord is now enclosed and protected inside the vertebrae as the spinal cord.';
    }, [subphylum, devStage]);

    const heartObservation = useMemo(() => {
        if (heartClass === 'Pisces')   return 'Fish have a 2-chambered heart (1 Auricle + 1 Ventricle). Blood follows a single circuit — heart → gills → body → heart.';
        if (heartClass === 'Amphibia') return 'Amphibians have a 3-chambered heart (2 Auricles + 1 Ventricle). Some mixing of oxygenated and deoxygenated blood occurs in the single ventricle.';
        return 'Mammals (and birds) have a 4-chambered heart (2 Auricles + 2 Ventricles). Complete separation ensures no mixing — the most efficient circulation system.';
    }, [heartClass]);

    const keyLogic = useMemo(() => {
        if (subphylum === 'Urochordata') return 'Urochordata shows that chordate features can be temporary — present in the larva for locomotion, then lost in the sedentary adult. This is called retrogressive metamorphosis.';
        if (subphylum === 'Cephalochordata') return 'Cephalochordata is considered the closest invertebrate relative of vertebrates, because it keeps all four chordate features in the adult — making it a key reference in evolution.';
        return 'Vertebrata is defined by one key upgrade: the notochord is replaced by a vertebral column in the adult. Every structure that changes (heart, limbs, kidneys) builds on this central axis.';
    }, [subphylum]);

    const resetLab = () => {
        setSubphylum('Vertebrata');
        setDevStage('Embryo');
        setHighlight('none');
        setHeartClass('Pisces');
    };

    // ── Simulation panel ──────────────────────────────────────────────────────

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-2 gap-3 flex-1 min-h-0">

                {/* Panel 1 — Chordate Body */}
                <ChordatePanel title="Chordate Body Structure" subtitle="Longitudinal cross-section view" accent="teal" headerTag={subphylum}>
                    <div className="rounded-2xl border border-teal-200 bg-teal-50 p-2 min-h-[220px]">
                        <ChordateBodySVG subphylum={subphylum} devStage={devStage} highlight={highlight} />
                    </div>
                    <div className="grid sm:grid-cols-4 gap-2 mt-2">
                        <MetricCard label="Notochord"   value={subphylum === 'Urochordata' && devStage === 'Adult' ? 'Absent' : 'Present'}  tone={subphylum === 'Urochordata' && devStage === 'Adult' ? 'text-red-600' : 'text-amber-700'} />
                        <MetricCard label="Nerve Cord"  value="Dorsal"    tone="text-sky-700" />
                        <MetricCard label="Gill Slits"  value={subphylum === 'Vertebrata' && devStage === 'Adult' ? 'Embryonic' : 'Present'}  tone="text-emerald-700" />
                        <MetricCard label="Post-Anal Tail" value={subphylum === 'Urochordata' && devStage === 'Adult' ? 'Absent' : 'Present'} tone={subphylum === 'Urochordata' && devStage === 'Adult' ? 'text-red-600' : 'text-violet-700'} />
                    </div>
                </ChordatePanel>

                {/* Panel 2 — Heart + Subphylum comparison */}
                <ChordatePanel title="Vertebrate Heart" subtitle="Chambers change across vertebrate classes" accent="rose" headerTag={HEART_CHAMBERS[heartClass].label}>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-2 min-h-[220px]">
                        <HeartDiagramSVG heartClass={heartClass} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <MetricCard label="Fish (Pisces)"       value="2 chambers" tone="text-sky-700" />
                        <MetricCard label="Amphibia / Reptilia" value="3 chambers" tone="text-orange-700" />
                        <MetricCard label="Mammalia / Aves"     value="4 chambers" tone="text-red-700" />
                    </div>
                </ChordatePanel>
            </div>

            {/* Info cards row */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
                <InfoCard title="Body Observation" icon={<Activity size={16} className="text-teal-600" />}>
                    <p>{bodyObservation}</p>
                </InfoCard>
                <InfoCard title="Heart Observation" icon={<Heart size={16} className="text-rose-600" />}>
                    <p>{heartObservation}</p>
                </InfoCard>
                <InfoCard title="Key Logic" icon={<ArrowRight size={16} className="text-amber-600" />}>
                    <p>{keyLogic}</p>
                    <p className="mt-2 font-semibold text-slate-700">Remember: All vertebrates are chordates, but not all chordates are vertebrates.</p>
                </InfoCard>
            </div>
        </div>
    );

    // ── Controls panel ────────────────────────────────────────────────────────

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">

                {/* Experiment goal */}
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                    <strong>Experiment Goal:</strong> Understand the four defining chordate features, observe how the notochord is replaced by the vertebral column in vertebrates, and compare heart chambers across vertebrate classes.
                </div>

                {/* Subphylum selector */}
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subphylum Selector</div>
                    <div className="grid grid-cols-3 gap-2">
                        {SUBPHYLA.map((s) => (
                            <button
                                key={s}
                                onClick={() => { setSubphylum(s); setDevStage('Embryo'); }}
                                className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${subphylum === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Development stage toggle (only meaningful for Vertebrata / Urochordata) */}
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Development Stage</div>
                    <div className="grid grid-cols-2 gap-2">
                        {DEV_STAGES.map((stage) => (
                            <button
                                key={stage}
                                onClick={() => setDevStage(stage)}
                                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${devStage === stage ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}
                            >
                                {stage === 'Embryo' ? 'Embryo / Larva' : 'Adult'}
                            </button>
                        ))}
                    </div>
                    {subphylum === 'Cephalochordata' && (
                        <p className="mt-2 text-xs text-slate-500 italic">Cephalochordata retains all features in both stages — stage change has no effect here.</p>
                    )}
                </div>

                {/* Feature Highlighter */}
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Feature Highlighter</div>
                    <div className="grid grid-cols-2 gap-2">
                        {FEATURE_LABELS.map(({ key, label, color }) => (
                            <button
                                key={key}
                                onClick={() => setHighlight(prev => prev === key ? 'none' : key)}
                                className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${highlight === key ? color : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Heart class selector */}
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Heart Class (Vertebrata)</div>
                    <div className="grid grid-cols-3 gap-2">
                        {HEART_CLASSES.map((cls) => (
                            <button
                                key={cls}
                                onClick={() => setHeartClass(cls)}
                                className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${heartClass === cls ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'}`}
                            >
                                {cls}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fact tiles */}
                <div className="grid md:grid-cols-2 gap-3">
                    <FactTile icon={<Zap size={15} className="text-amber-600" />} title="Notochord Status">
                        {subphylum === 'Vertebrata' && devStage === 'Adult'
                            ? 'Replaced by vertebral column (grey segments)'
                            : subphylum === 'Urochordata' && devStage === 'Adult'
                                ? 'Absent in adult — lost during metamorphosis'
                                : 'Present as yellow rod — primary support axis'}
                    </FactTile>
                    <FactTile icon={<Heart size={15} className="text-rose-600" />} title="Heart Complexity">
                        {HEART_CHAMBERS[heartClass].label} heart — {heartClass}
                    </FactTile>
                </div>

                {/* Reset */}
                <button
                    onClick={resetLab}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCcw size={15} />
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

// ─── SVG: Chordate Body ───────────────────────────────────────────────────────

const ChordateBodySVG: React.FC<{
    subphylum: Subphylum;
    devStage: DevStage;
    highlight: HighlightFeature;
}> = ({ subphylum, devStage, highlight }) => {
    const isUroAdult  = subphylum === 'Urochordata'  && devStage === 'Adult';
    const isVertAdult = subphylum === 'Vertebrata'   && devStage === 'Adult';

    // Highlight opacities
    const glowNotochord  = highlight === 'notochord'      ? 1 : highlight === 'none' ? 0.85 : 0.2;
    const glowNerveCord  = highlight === 'nerve-cord'     ? 1 : highlight === 'none' ? 0.85 : 0.2;
    const glowGillSlits  = highlight === 'gill-slits'     ? 1 : highlight === 'none' ? 0.85 : 0.2;
    const glowPostTail   = highlight === 'post-anal-tail' ? 1 : highlight === 'none' ? 0.85 : 0.2;

    // Notochord color: yellow (embryo/cephalochordata) → grey segments (vertebrata adult)
    const notochordColor = isVertAdult ? '#94a3b8' : '#fbbf24';
    const notochordVisible = !isUroAdult;

    // Post-anal tail
    const tailVisible = !isUroAdult;

    // Gill slits: shown as present in embryo & lower chordates; grayed in vertebrata adult
    const gillColor = isVertAdult ? '#94a3b8' : '#34d399';

    return (
        <svg viewBox="0 0 360 220" className="w-full h-full" aria-label="Chordate body cross-section">
            {/* Background */}
            <rect x="0" y="0" width="360" height="220" fill="#f0fdfa" rx="12" />

            {/* Body outline — fish/lancelet shape */}
            <ellipse cx="165" cy="110" rx="130" ry="52" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2.5" />

            {/* ── NOTOCHORD (yellow rod / grey vertebrae) ── */}
            {notochordVisible && (
                <g opacity={glowNotochord}>
                    {isVertAdult ? (
                        /* Vertebral column — segmented grey blocks */
                        <>
                            {[60, 85, 110, 135, 160, 185, 210, 235, 260].map((x, i) => (
                                <rect key={i} x={x} y="103" width="18" height="14" rx="3"
                                    fill={notochordColor} stroke="#64748b" strokeWidth="1.5" />
                            ))}
                            <text x="155" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">Vertebral Column</text>
                        </>
                    ) : (
                        /* Notochord — continuous yellow rod */
                        <>
                            <rect x="48" y="105" width="230" height="10" rx="5"
                                fill={notochordColor} stroke="#d97706" strokeWidth="2" />
                            <text x="163" y="98" textAnchor="middle" fontSize="11" fontWeight="700" fill="#92400e">Notochord</text>
                        </>
                    )}
                </g>
            )}
            {isUroAdult && (
                <text x="163" y="110" textAnchor="middle" fontSize="11" fontWeight="700" fill="#94a3b8">Notochord absent in adult</text>
            )}

            {/* ── DORSAL HOLLOW NERVE CORD (blue tube above notochord) ── */}
            <g opacity={glowNerveCord}>
                {/* Outer tube */}
                <rect x="48" y="85" width="230" height="12" rx="6" fill="#38bdf8" stroke="#0369a1" strokeWidth="2" />
                {/* Hollow centre */}
                <rect x="55" y="89" width="216" height="4" rx="2" fill="#e0f2fe" />
                <text x="163" y="76" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0369a1">Dorsal Hollow Nerve Cord</text>
            </g>

            {/* ── PHARYNGEAL GILL SLITS (pairs of vertical lines in pharynx) ── */}
            <g opacity={glowGillSlits}>
                {[80, 96, 112, 128].map((x, i) => (
                    <React.Fragment key={i}>
                        <line x1={x} y1="126" x2={x} y2="148" stroke={gillColor} strokeWidth="3" strokeLinecap="round" />
                    </React.Fragment>
                ))}
                <text x="104" y="163" textAnchor="middle" fontSize="11" fontWeight="700" fill={isVertAdult ? '#94a3b8' : '#059669'}>
                    {isVertAdult ? 'Gill Slits (embryonic only)' : 'Pharyngeal Gill Slits'}
                </text>
            </g>

            {/* ── POST-ANAL TAIL ── */}
            {tailVisible ? (
                <g opacity={glowPostTail}>
                    {/* Anus marker */}
                    <line x1="270" y1="95" x2="270" y2="130" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 3" />
                    <text x="270" y="145" textAnchor="middle" fontSize="10" fill="#7c3aed" fontWeight="700">Anus</text>
                    {/* Tail beyond anus */}
                    <path d="M275 110 C295 100 318 95 335 110 C318 125 295 120 275 110Z"
                        fill="#c4b5fd" stroke="#7c3aed" strokeWidth="2" />
                    <text x="305" y="88" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5b21b6">Post-Anal Tail</text>
                </g>
            ) : (
                <text x="305" y="110" textAnchor="middle" fontSize="10" fontWeight="700" fill="#94a3b8">Tail absent</text>
            )}

            {/* Head indicator */}
            <text x="38" y="115" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">Head</text>
            <text x="348" y="115" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">→</text>

            {/* Stage badge */}
            <rect x="240" y="6" width="110" height="22" rx="11" fill={devStage === 'Adult' ? '#14b8a6' : '#818cf8'} />
            <text x="295" y="22" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
                {subphylum === 'Urochordata' && devStage === 'Embryo' ? 'Larval Stage' : devStage}
            </text>
        </svg>
    );
};

// ─── SVG: Heart Diagram ───────────────────────────────────────────────────────

const HeartDiagramSVG: React.FC<{ heartClass: HeartClass }> = ({ heartClass }) => {
    const { chambers, color } = HEART_CHAMBERS[heartClass];

    return (
        <svg viewBox="0 0 360 220" className="w-full h-full" aria-label="Vertebrate heart chambers">
            <rect x="0" y="0" width="360" height="220" fill="#fff1f2" rx="12" />

            {/* Title */}
            <text x="180" y="28" textAnchor="middle" fontSize="13" fontWeight="800" fill="#881337">
                {chambers}-Chambered Heart — {heartClass}
            </text>

            {/* ── 2-chambered: 1 Auricle + 1 Ventricle ── */}
            {chambers === 2 && (
                <>
                    {/* Auricle */}
                    <rect x="100" y="50" width="160" height="60" rx="14" fill={color} stroke="#0c4a6e" strokeWidth="2.5" />
                    <text x="180" y="86" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">Auricle (×1)</text>
                    {/* Arrow */}
                    <line x1="180" y1="110" x2="180" y2="128" stroke="#0c4a6e" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    {/* Ventricle */}
                    <path d="M100 130 L260 130 L230 185 L180 200 L130 185 Z" fill={color} stroke="#0c4a6e" strokeWidth="2.5" />
                    <text x="180" y="168" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">Ventricle (×1)</text>
                    {/* Labels */}
                    <text x="180" y="212" textAnchor="middle" fontSize="11" fill="#475569" fontWeight="600">Blood path: Heart → Gills → Body → Heart</text>
                </>
            )}

            {/* ── 3-chambered: 2 Auricles + 1 Ventricle ── */}
            {chambers === 3 && (
                <>
                    {/* Left Auricle */}
                    <rect x="68" y="50" width="100" height="58" rx="14" fill={color} stroke="#7c2d12" strokeWidth="2.5" />
                    <text x="118" y="84" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">L. Auricle</text>
                    {/* Right Auricle */}
                    <rect x="192" y="50" width="100" height="58" rx="14" fill={color} stroke="#7c2d12" strokeWidth="2.5" />
                    <text x="242" y="84" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">R. Auricle</text>
                    {/* Arrows */}
                    <line x1="118" y1="108" x2="155" y2="128" stroke="#7c2d12" strokeWidth="2" />
                    <line x1="242" y1="108" x2="205" y2="128" stroke="#7c2d12" strokeWidth="2" />
                    {/* Ventricle */}
                    <path d="M100 130 L260 130 L230 185 L180 200 L130 185 Z" fill={color} stroke="#7c2d12" strokeWidth="2.5" />
                    <text x="180" y="168" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">Ventricle (×1)</text>
                    {/* Mixing note */}
                    <text x="180" y="212" textAnchor="middle" fontSize="11" fill="#b45309" fontWeight="600">Some mixing of blood in common ventricle</text>
                </>
            )}

            {/* ── 4-chambered: 2 Auricles + 2 Ventricles ── */}
            {chambers === 4 && (
                <>
                    {/* Left Auricle */}
                    <rect x="68" y="44" width="100" height="55" rx="14" fill={color} stroke="#881337" strokeWidth="2.5" />
                    <text x="118" y="77" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">L. Auricle</text>
                    {/* Right Auricle */}
                    <rect x="192" y="44" width="100" height="55" rx="14" fill={color} stroke="#881337" strokeWidth="2.5" />
                    <text x="242" y="77" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">R. Auricle</text>
                    {/* Arrows */}
                    <line x1="118" y1="99" x2="118" y2="118" stroke="#881337" strokeWidth="2" />
                    <line x1="242" y1="99" x2="242" y2="118" stroke="#881337" strokeWidth="2" />
                    {/* Divider line (inter-ventricular septum) */}
                    <line x1="180" y1="120" x2="180" y2="198" stroke="#881337" strokeWidth="2.5" strokeDasharray="5 3" />
                    {/* Left Ventricle */}
                    <path d="M100 120 L180 120 L165 192 L130 202 Z" fill={color} stroke="#881337" strokeWidth="2.5" />
                    <text x="138" y="162" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">L. Ventricle</text>
                    {/* Right Ventricle */}
                    <path d="M180 120 L260 120 L230 202 L195 192 Z" fill={color} stroke="#881337" strokeWidth="2.5" />
                    <text x="222" y="162" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">R. Ventricle</text>
                    {/* No mixing note */}
                    <text x="180" y="214" textAnchor="middle" fontSize="11" fill="#059669" fontWeight="700">Complete separation — no blood mixing</text>
                </>
            )}

            {/* Arrow marker definition */}
            <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#0c4a6e" />
                </marker>
            </defs>
        </svg>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChordatePanel = ({
    title, subtitle, accent, headerTag, children,
}: {
    title: string;
    subtitle: string;
    accent: 'teal' | 'rose';
    headerTag: string;
    children: React.ReactNode;
}) => {
    const chipTone = accent === 'teal'
        ? 'bg-teal-100 text-teal-800'
        : 'bg-rose-100 text-rose-800';
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

export default ChordataLab;
