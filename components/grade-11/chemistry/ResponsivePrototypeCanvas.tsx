import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RotateCw, Eye, Zap, Play, Pause, RefreshCcw, Maximize2, Minimize2, ArrowLeft, Menu, X, Info } from 'lucide-react';

const ResponsivePrototypeCanvas: React.FC = () => {
    // ---- Simulation State (Copied from EthaneConformations) ----
    const [dihedralAngle, setDihedralAngle] = useState(60); // degrees
    const [viewMode, setViewMode] = useState<'newman' | 'sawhorse' | '3d'>('newman');
    const [showElectronClouds, setShowElectronClouds] = useState(false);
    const [autoRotate, setAutoRotate] = useState(false);
    const [trailPoints, setTrailPoints] = useState<{ x: number; y: number }[]>([]);
    const animRef = useRef<number | null>(null);

    // ---- New Responsive UI State ----
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

    // Energy calculation: E = (12.5/2) * (1 - cos(3θ))
    const potentialEnergy = useMemo(() => {
        const rad = (dihedralAngle * Math.PI) / 180;
        return (12.5 / 2) * (1 - Math.cos(3 * rad));
    }, [dihedralAngle]);

    const conformationType = useMemo(() => {
        const norm = ((dihedralAngle % 360) + 360) % 360;
        const eclipsedAngles = [0, 120, 240, 360];
        const staggeredAngles = [60, 180, 300];
        const threshold = 5;
        for (const a of eclipsedAngles) {
            if (Math.abs(norm - a) < threshold || Math.abs(norm - a + 360) < threshold) return 'eclipsed';
        }
        for (const a of staggeredAngles) {
            if (Math.abs(norm - a) < threshold) return 'staggered';
        }
        return 'skew';
    }, [dihedralAngle]);

    const systemMessage = useMemo(() => {
        if (conformationType === 'staggered') {
            return 'Staggered Conformation — Minimum torsional strain. Maximum stability!';
        } else if (conformationType === 'eclipsed') {
            return `Eclipsed Conformation! Maximum torsional strain (${potentialEnergy.toFixed(1)} kJ/mol). Least stable.`;
        } else {
            return `Skew Conformation (${dihedralAngle.toFixed(0)}°). Intermediate torsional strain.`;
        }
    }, [conformationType, dihedralAngle, potentialEnergy]);

    useEffect(() => {
        if (autoRotate) {
            const animate = () => {
                setDihedralAngle(prev => (prev + 0.5) % 360);
                animRef.current = requestAnimationFrame(animate);
            };
            animRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [autoRotate]);

    useEffect(() => {
        const norm = ((dihedralAngle % 360) + 360) % 360;
        const energy = (12.5 / 2) * (1 - Math.cos(3 * (norm * Math.PI) / 180));
        setTrailPoints(prev => {
            const updated = [...prev, { x: norm, y: energy }];
            return updated.slice(-720);
        });
    }, [dihedralAngle]);

    // ---- Rendering Functions (Simplified for prototype) ----
    const renderNewman = () => {
        const cx = 250, cy = 250;
        const bondLen = 120;
        const circleR = 100;
        const atomR = 22;
        const hAtomR = 16;
        const frontAngles = [90, 210, 330];
        const rearOffset = dihedralAngle;
        const rearAngles = frontAngles.map(a => a + rearOffset);

        return (
            <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-2xl">
                <defs>
                    <radialGradient id="carbonGradFront" cx="40%" cy="35%"><stop offset="0%" stopColor="#6b7280" /><stop offset="100%" stopColor="#1f2937" /></radialGradient>
                    <radialGradient id="carbonGradRear" cx="40%" cy="35%"><stop offset="0%" stopColor="#9ca3af" /><stop offset="100%" stopColor="#4b5563" /></radialGradient>
                    <radialGradient id="hydrogenGrad" cx="35%" cy="30%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#d1d5db" /></radialGradient>
                    <radialGradient id="electronCloud" cx="50%" cy="50%"><stop offset="0%" stopColor="rgba(59,130,246,0.25)" /><stop offset="100%" stopColor="rgba(59,130,246,0)" /></radialGradient>
                    <radialGradient id="electronCloudRepel" cx="50%" cy="50%"><stop offset="0%" stopColor="rgba(239,68,68,0.4)" /><stop offset="100%" stopColor="rgba(239,68,68,0)" /></radialGradient>
                </defs>

                {/* Back Carbon H bonds */}
                {rearAngles.map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const x = cx + Math.cos(rad) * bondLen;
                    const y = cy + Math.sin(rad) * bondLen;
                    const isEclipsed = conformationType === 'eclipsed';
                    return (
                        <g key={`rear-${i}`}>
                            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#4b5563" strokeWidth="6" />
                            {showElectronClouds && <circle cx={x} cy={y} r={hAtomR * 3} fill={isEclipsed ? "url(#electronCloudRepel)" : "url(#electronCloud)"} />}
                            <circle cx={x} cy={y} r={hAtomR} fill="url(#hydrogenGrad)" stroke="#4b5563" strokeWidth="1.5" />
                            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" className="text-[14px] font-bold fill-slate-600 select-none">H</text>
                        </g>
                    );
                })}

                <circle cx={cx} cy={cy} r={circleR} fill="none" stroke="#6b7280" strokeWidth="8" />
                <circle cx={cx} cy={cy} r={atomR} fill="url(#carbonGradRear)" stroke="#111827" strokeWidth="2" />

                {/* Front Carbon H bonds */}
                {frontAngles.map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const x = cx + Math.cos(rad) * bondLen;
                    const y = cy + Math.sin(rad) * bondLen;
                    return (
                        <g key={`front-${i}`}>
                            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#f3f4f6" strokeWidth="8" strokeLinecap="round" />
                            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
                            {showElectronClouds && <circle cx={x} cy={y} r={hAtomR * 3} fill={conformationType === 'eclipsed' ? "url(#electronCloudRepel)" : "url(#electronCloud)"} />}
                            <circle cx={x} cy={y} r={hAtomR} fill="url(#hydrogenGrad)" stroke="#6b7280" strokeWidth="2" />
                            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" className="text-[14px] font-bold fill-slate-700 select-none">H</text>
                        </g>
                    );
                })}

                <circle cx={cx} cy={cy} r={atomR} fill="url(#carbonGradFront)" stroke="#111827" strokeWidth="2" />
                <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="central" className="text-[16px] font-bold fill-white select-none">C</text>
            </svg>
        );
    };

    // Dummy Data for the prototype to render native textbook content and a video
    const dummyTopic = {
        id: 'responsive-prototype',
        title: '🧪 RESPONSIVE UI PROTOTYPE',
        description: 'A sandbox testing environment for a new full-screen, mobile-first, glassmorphism UI container.',
        youtubeVideoIds: ['92X-lU9WnZk'] // Random educational video id
    };

    return (
        <div className="absolute inset-0 bg-[#0f172a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black text-slate-100 font-sans overflow-hidden flex flex-col lg:flex-row">

            {/* 1. Main Interaction Area (Left Side Desktop / Top Half Mobile) */}
            <div className="relative flex-1 h-[55vh] lg:h-full flex items-center justify-center shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden">
                {/* Visual Canvas containing the 3D element */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-10 p-4 pb-16 lg:p-12 xl:p-24 lg:pb-12 xl:pb-24">
                    <div className="w-full h-full max-w-[1200px] xl:max-w-none max-h-[1200px] xl:max-h-none relative flex items-center justify-center">
                        {viewMode === 'newman' && renderNewman()}
                        {viewMode !== 'newman' && (
                            <div className="text-slate-500 font-mono text-center">
                                [{viewMode} view omitted in prototype]
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Top Nav (View Modes) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto">
                    {(['newman', 'sawhorse', '3d'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${viewMode === mode
                                ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                {/* Floating Status Warning */}
                <div className="absolute top-20 lg:top-4 lg:right-4 left-1/2 -translate-x-1/2 lg:translate-x-0 z-20 pointer-events-auto">
                    <div className={`px-4 py-2 rounded-2xl backdrop-blur-xl border flex items-center gap-2 text-sm font-bold shadow-2xl transition-all duration-300 ${conformationType === 'eclipsed'
                        ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-red-500/10'
                        : conformationType === 'staggered'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-emerald-500/10'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300'
                        }`}>
                        <ActivityIcon type={conformationType} />
                        <span className="uppercase tracking-wider text-[11px]">{conformationType}</span>
                    </div>
                </div>

                {/* Bottom Control Bar / Overlay inside the canvas view */}
                <div className="absolute bottom-4 left-4 right-4 lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 lg:w-[500px] xl:w-[600px] 2xl:w-[700px] z-30 bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl p-4 flex flex-col gap-4 pointer-events-auto">
                    {/* Dihedral Slider */}
                    <div className="flex items-center gap-4">
                        <input
                            type="range" min="0" max="360" step="1"
                            value={dihedralAngle}
                            onChange={e => { setDihedralAngle(Number(e.target.value)); setAutoRotate(false); }}
                            className="flex-1 h-2 bg-slate-950 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="w-16 text-right font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                            {dihedralAngle.toFixed(0)}°
                        </div>
                    </div>
                    {/* Action Buttons row */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setAutoRotate(!autoRotate)}
                            className={`flex-[2] py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${autoRotate
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                : 'bg-slate-800 text-slate-300 border border-transparent hover:bg-slate-700'
                                }`}
                        >
                            {autoRotate ? <Pause size={14} /> : <Play size={14} />} {autoRotate ? 'Pause' : 'Auto Rotate'}
                        </button>
                        <button
                            onClick={() => setShowElectronClouds(!showElectronClouds)}
                            className={`flex-[3] py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${showElectronClouds
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                : 'bg-slate-800 text-slate-300 border border-transparent hover:bg-slate-700'
                                }`}
                        >
                            <Eye size={14} /> {showElectronClouds ? 'Hide Cloud' : 'Show Electron Cloud'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Content Explorer Panel (Right Side Desktop / Bottom Half Mobile) */}
            <div className="w-full lg:w-[450px] xl:w-[500px] 2xl:w-[600px] shrink-0 bg-slate-50 lg:bg-white overflow-y-auto custom-scrollbar lg:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 relative">

                {/* Header Section inside content pane */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-6">
                    <h1 className="font-display text-2xl lg:text-3xl font-bold text-brand-primary flex items-center gap-3">
                        <Info className="text-brand-secondary" size={28} />
                        {dummyTopic.title}
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm lg:text-base leading-relaxed">
                        {dummyTopic.description} Note: In the actual implementation, the back button is overlaid on top of this or handled via App navigation state.
                    </p>
                </div>

                {/* Main Content Body */}
                <div className="p-8 pb-32 flex flex-col gap-12">

                    {/* Explanation Section */}
                    <div className="prose prose-slate prose-lg max-w-none font-sans">
                        <h3 className="font-display font-bold text-slate-800 border-b-2 border-brand-secondary inline-block pb-1">Conformational Isomerism</h3>
                        <p>
                            Alkanes contain carbon-carbon single bonds. Electron charge distribution of the sigma molecular orbital is symmetrical around the internuclear axis of the C-C bond. This means free rotation is possible about the C-C single bond. This rotation results in different spatial arrangements of atoms in space which can change into one another.
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                            <p className="m-0 text-sm text-blue-900 font-medium">✨ <strong>Key Concept:</strong> Spatial arrangements of atoms which can be converted into one another by rotation around a C-C single bond are called <em>conformations</em> or <em>conformers</em>.</p>
                        </div>
                    </div>

                    {/* Analogy Section inserted nativly */}
                    <div>
                        <h3 className="font-display font-bold text-slate-800 border-b-2 border-brand-secondary inline-block pb-1 mb-4">Real-World Analogy</h3>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200 shadow-sm flex flex-col lg:flex-row gap-6 items-center">
                            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-4xl">🎡</span>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-amber-900 mb-2">The Ferris Wheel Cars</h4>
                                <p className="text-amber-800 text-sm leading-relaxed">
                                    Imagine two Ferris wheels connected by a spinning axle. If both wheels spin independently, the cars on them constantly change positions relative to one another. Sometimes cars on opposite wheels line up perfectly (eclipsed), causing the riders to feel cramped (torsional strain). Most of the time, they are staggered, which is much more comfortable!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Video Section integrated nicely */}
                    <div>
                        <h3 className="font-display font-bold text-slate-800 border-b-2 border-brand-secondary inline-block pb-1 mb-4">Video Summary</h3>
                        <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black aspect-video relative group">
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity z-10">
                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Play className="text-white ml-1" fill="currentColor" />
                                </div>
                            </div>
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={`https://www.youtube-nocookie.com/embed/${dummyTopic.youtubeVideoIds[0]}?rel=0&modestbranding=1`}
                                title="Educational Video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// Helper component
const ActivityIcon = ({ type }: { type: string }) => {
    if (type === 'eclipsed') return <Zap size={14} />;
    if (type === 'staggered') return <RefreshCcw size={14} />;
    return <RotateCw size={14} className="animate-spin-slow" />;
};

export default ResponsivePrototypeCanvas;
