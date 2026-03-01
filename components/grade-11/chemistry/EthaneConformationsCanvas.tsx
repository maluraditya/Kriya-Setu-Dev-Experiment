import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RotateCw, Eye, Zap, Play, Pause, RefreshCcw } from 'lucide-react';

const EthaneConformationsCanvas: React.FC = () => {
    const [dihedralAngle, setDihedralAngle] = useState(60); // degrees
    const [viewMode, setViewMode] = useState<'newman' | 'sawhorse' | '3d'>('newman');
    const [showElectronClouds, setShowElectronClouds] = useState(false);
    const [autoRotate, setAutoRotate] = useState(false);
    const [trailPoints, setTrailPoints] = useState<{ x: number; y: number }[]>([]);
    const animRef = useRef<number | null>(null);
    const energyCanvasRef = useRef<HTMLCanvasElement>(null);

    // Energy calculation: E = (12.5/2) * (1 - cos(3θ))
    const potentialEnergy = useMemo(() => {
        const rad = (dihedralAngle * Math.PI) / 180;
        return (12.5 / 2) * (1 - Math.cos(3 * rad));
    }, [dihedralAngle]);

    // Determine conformation type
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
            return 'Staggered Conformation — Hydrogen atoms are as far apart as possible. Minimum torsional strain. Maximum stability!';
        } else if (conformationType === 'eclipsed') {
            return `Eclipsed Conformation! Maximum torsional strain (${potentialEnergy.toFixed(1)} kJ/mol). The H atoms are directly behind each other — least stable shape.`;
        } else {
            return `Skew Conformation (${dihedralAngle.toFixed(0)}°). Intermediate torsional strain = ${potentialEnergy.toFixed(1)} kJ/mol. Drag the slider to explore!`;
        }
    }, [conformationType, dihedralAngle, potentialEnergy]);

    // Auto-rotate
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

    // Build energy graph trail
    useEffect(() => {
        const norm = ((dihedralAngle % 360) + 360) % 360;
        const energy = (12.5 / 2) * (1 - Math.cos(3 * (norm * Math.PI) / 180));
        setTrailPoints(prev => {
            const updated = [...prev, { x: norm, y: energy }];
            // Keep last 720 points for auto-rotate full cycle
            return updated.slice(-720);
        });
    }, [dihedralAngle]);

    const resetTrail = useCallback(() => {
        setTrailPoints([]);
    }, []);

    // Newman projection rendering
    const renderNewman = () => {
        const cx = 250, cy = 250;
        const bondLen = 120;
        const circleR = 100;
        const atomR = 22;
        const hAtomR = 16;
        const frontAngles = [90, 210, 330]; // fixed front H positions (degrees, 0 = right)
        const rearOffset = dihedralAngle;
        const rearAngles = frontAngles.map(a => a + rearOffset);

        return (
            <svg viewBox="0 0 500 500" className="w-full h-full">
                <defs>
                    <radialGradient id="carbonGradFront" cx="40%" cy="35%">
                        <stop offset="0%" stopColor="#6b7280" />
                        <stop offset="100%" stopColor="#1f2937" />
                    </radialGradient>
                    <radialGradient id="carbonGradRear" cx="40%" cy="35%">
                        <stop offset="0%" stopColor="#9ca3af" />
                        <stop offset="100%" stopColor="#4b5563" />
                    </radialGradient>
                    <radialGradient id="hydrogenGrad" cx="35%" cy="30%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#d1d5db" />
                    </radialGradient>
                    <radialGradient id="electronCloud" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="rgba(59,130,246,0.35)" />
                        <stop offset="70%" stopColor="rgba(59,130,246,0.08)" />
                        <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Rear circle (rear carbon) */}
                <circle cx={cx} cy={cy} r={circleR} fill="none" stroke="#6b7280" strokeWidth="3" opacity="0.5" />

                {/* Rear H bonds (drawn first, behind front) */}
                {rearAngles.map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const hx = cx + Math.cos(rad) * bondLen;
                    const hy = cy - Math.sin(rad) * bondLen;
                    const edgeX = cx + Math.cos(rad) * circleR;
                    const edgeY = cy - Math.sin(rad) * circleR;
                    return (
                        <g key={`rear-${i}`}>
                            <line x1={edgeX} y1={edgeY} x2={hx} y2={hy} stroke="#9ca3af" strokeWidth="5" strokeLinecap="round" />
                            {showElectronClouds && (
                                <circle cx={hx} cy={hy} r={35} fill="url(#electronCloud)" className="animate-pulse" />
                            )}
                            <circle cx={hx} cy={hy} r={hAtomR} fill="url(#hydrogenGrad)" stroke="#9ca3af" strokeWidth="1.5" />
                            <text x={hx} y={hy + 2} textAnchor="middle" dominantBaseline="central" className="text-[14px] font-bold fill-slate-600 select-none pointer-events-none">H</text>
                        </g>
                    );
                })}

                {/* Front H bonds */}
                {frontAngles.map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const hx = cx + Math.cos(rad) * bondLen;
                    const hy = cy - Math.sin(rad) * bondLen;
                    return (
                        <g key={`front-${i}`}>
                            <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#374151" strokeWidth="6" strokeLinecap="round" />
                            {showElectronClouds && (
                                <circle cx={hx} cy={hy} r={35} fill="url(#electronCloud)" className="animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                            )}
                            <circle cx={hx} cy={hy} r={hAtomR} fill="url(#hydrogenGrad)" stroke="#374151" strokeWidth="2" />
                            <text x={hx} y={hy + 2} textAnchor="middle" dominantBaseline="central" className="text-[14px] font-bold fill-slate-800 select-none pointer-events-none">H</text>
                        </g>
                    );
                })}

                {/* Front carbon (dot) */}
                <circle cx={cx} cy={cy} r={atomR} fill="url(#carbonGradFront)" stroke="#111827" strokeWidth="2" filter="url(#glow)" />
                <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="central" className="text-[16px] font-bold fill-white select-none pointer-events-none">C</text>

                {/* Labels */}
                <text x={cx} y={cy + circleR + 30} textAnchor="middle" className="text-[16px] fill-slate-400 select-none">Front C (fixed)</text>
                <text x={cx} y={25} textAnchor="middle" className="text-[16px] fill-slate-500 select-none">Rear C (rotates)</text>

                {/* Dihedral angle arc */}
                {(() => {
                    const startAngle = frontAngles[0]; // 90 deg
                    const endAngle = startAngle + dihedralAngle;
                    const arcR = 45;
                    const start = ((startAngle) * Math.PI) / 180;
                    const end = ((endAngle) * Math.PI) / 180;
                    const largeArc = dihedralAngle > 180 ? 1 : 0;
                    const sx = cx + Math.cos(start) * arcR;
                    const sy = cy - Math.sin(start) * arcR;
                    const ex = cx + Math.cos(end) * arcR;
                    const ey = cy - Math.sin(end) * arcR;
                    return (
                        <g>
                            <path d={`M ${sx} ${sy} A ${arcR} ${arcR} 0 ${largeArc} 0 ${ex} ${ey}`}
                                fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.8" />
                            <text x={cx + Math.cos((start + end) / 2) * (arcR + 18)} y={cy - Math.sin((start + end) / 2) * (arcR + 18)}
                                textAnchor="middle" dominantBaseline="central" className="text-[16px] font-bold fill-amber-400 select-none">{dihedralAngle.toFixed(0)}°</text>
                        </g>
                    );
                })()}
            </svg>
        );
    };

    // Sawhorse projection rendering
    const renderSawhorse = () => {
        // Front carbon at lower-left, rear at upper-right
        const fcx = 170, fcy = 340;
        const rcx = 330, rcy = 160;
        const bondLen = 90;
        const hAtomR = 14;

        const frontAngles = [150, 210, 270]; // pointing down-left area
        const rearOffset = dihedralAngle;
        const rearAngles = [30, 330, 270].map(a => a + rearOffset);

        // Project with slight perspective
        const projH = (cx: number, cy: number, angle: number, len: number, perspectiveFactor = 1) => {
            const rad = (angle * Math.PI) / 180;
            return {
                x: cx + Math.cos(rad) * len * perspectiveFactor,
                y: cy - Math.sin(rad) * len * 0.6 * perspectiveFactor // foreshorten Y
            };
        };

        return (
            <svg viewBox="0 0 500 500" className="w-full h-full">
                <defs>
                    <radialGradient id="hGradSaw" cx="35%" cy="30%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#d1d5db" />
                    </radialGradient>
                </defs>

                {/* C-C bond */}
                <line x1={fcx} y1={fcy} x2={rcx} y2={rcy} stroke="#4b5563" strokeWidth="7" strokeLinecap="round" />

                {/* Front H bonds */}
                {frontAngles.map((angle, i) => {
                    const h = projH(fcx, fcy, angle, bondLen);
                    return (
                        <g key={`sf-${i}`}>
                            <line x1={fcx} y1={fcy} x2={h.x} y2={h.y} stroke="#374151" strokeWidth="5" strokeLinecap="round" />
                            {showElectronClouds && <circle cx={h.x} cy={h.y} r={30} fill="rgba(59,130,246,0.15)" className="animate-pulse" />}
                            <circle cx={h.x} cy={h.y} r={hAtomR} fill="url(#hGradSaw)" stroke="#374151" strokeWidth="1.5" />
                            <text x={h.x} y={h.y + 2} textAnchor="middle" dominantBaseline="central" className="text-[13px] font-bold fill-slate-700 select-none pointer-events-none">H</text>
                        </g>
                    );
                })}

                {/* Rear H bonds */}
                {rearAngles.map((angle, i) => {
                    const h = projH(rcx, rcy, angle, bondLen, 0.85);
                    return (
                        <g key={`sr-${i}`}>
                            <line x1={rcx} y1={rcy} x2={h.x} y2={h.y} stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
                            {showElectronClouds && <circle cx={h.x} cy={h.y} r={30} fill="rgba(59,130,246,0.12)" className="animate-pulse" />}
                            <circle cx={h.x} cy={h.y} r={hAtomR} fill="url(#hGradSaw)" stroke="#9ca3af" strokeWidth="1.5" />
                            <text x={h.x} y={h.y + 2} textAnchor="middle" dominantBaseline="central" className="text-[13px] font-bold fill-slate-500 select-none pointer-events-none">H</text>
                        </g>
                    );
                })}

                {/* Carbon atoms */}
                <circle cx={fcx} cy={fcy} r={18} fill="#374151" stroke="#111827" strokeWidth="2" />
                <text x={fcx} y={fcy + 2} textAnchor="middle" dominantBaseline="central" className="text-[15px] font-bold fill-white select-none pointer-events-none">C</text>
                <circle cx={rcx} cy={rcy} r={18} fill="#6b7280" stroke="#374151" strokeWidth="2" />
                <text x={rcx} y={rcy + 2} textAnchor="middle" dominantBaseline="central" className="text-[15px] font-bold fill-white select-none pointer-events-none">C</text>

                {/* Labels */}
                <text x={fcx - 5} y={fcy + 35} textAnchor="middle" className="text-[15px] fill-slate-400 select-none">Front C</text>
                <text x={rcx + 5} y={rcy - 28} textAnchor="middle" className="text-[15px] fill-slate-500 select-none">Rear C</text>
            </svg>
        );
    };

    // 3D-like ball-and-stick projection
    const render3D = () => {
        const cx = 210, cy = 270;
        const ccBondLen = 110;
        const chBondLen = 80;
        const atomR = 20;
        const hR = 14;

        // Camera: slightly above and to the right
        const camAngle = 25 * Math.PI / 180;
        const camTilt = 15 * Math.PI / 180;

        // Front carbon at center, rear offset
        const rcx3d = cx + ccBondLen * Math.cos(camAngle);
        const rcy3d = cy - ccBondLen * Math.sin(camTilt) * 0.5;

        const frontAngles3D = [150, 270, 30];
        const rearAngles3D = frontAngles3D.map(a => a + dihedralAngle);

        const projAtom = (basex: number, basey: number, angle: number, len: number, depth = 0) => {
            const rad = (angle * Math.PI) / 180;
            return {
                x: basex + Math.cos(rad) * len * (1 - depth * 0.15),
                y: basey - Math.sin(rad) * len * 0.65
            };
        };

        return (
            <svg viewBox="0 0 500 500" className="w-full h-full">
                {/* C-C bond */}
                <line x1={cx} y1={cy} x2={rcx3d} y2={rcy3d} stroke="#4b5563" strokeWidth="8" strokeLinecap="round" />

                {/* Rear H bonds + atoms (behind) */}
                {rearAngles3D.map((angle, i) => {
                    const h = projAtom(rcx3d, rcy3d, angle, chBondLen, 0.3);
                    return (
                        <g key={`r3d-${i}`}>
                            <line x1={rcx3d} y1={rcy3d} x2={h.x} y2={h.y} stroke="#9ca3af" strokeWidth="5" strokeLinecap="round" />
                            {showElectronClouds && <circle cx={h.x} cy={h.y} r={30} fill="rgba(59,130,246,0.12)" className="animate-pulse" />}
                            <circle cx={h.x} cy={h.y} r={hR} fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
                            <text x={h.x} y={h.y + 2} textAnchor="middle" dominantBaseline="central" className="text-[13px] font-bold fill-slate-500 select-none pointer-events-none">H</text>
                        </g>
                    );
                })}

                {/* Rear carbon */}
                <circle cx={rcx3d} cy={rcy3d} r={atomR} fill="#6b7280" stroke="#4b5563" strokeWidth="2" />
                <text x={rcx3d} y={rcy3d + 2} textAnchor="middle" dominantBaseline="central" className="text-[15px] font-bold fill-white select-none pointer-events-none">C</text>

                {/* Front H bonds + atoms (in front) */}
                {frontAngles3D.map((angle, i) => {
                    const h = projAtom(cx, cy, angle, chBondLen);
                    return (
                        <g key={`f3d-${i}`}>
                            <line x1={cx} y1={cy} x2={h.x} y2={h.y} stroke="#374151" strokeWidth="6" strokeLinecap="round" />
                            {showElectronClouds && <circle cx={h.x} cy={h.y} r={30} fill="rgba(59,130,246,0.2)" className="animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />}
                            <circle cx={h.x} cy={h.y} r={hR} fill="#f3f4f6" stroke="#374151" strokeWidth="2" />
                            <text x={h.x} y={h.y + 2} textAnchor="middle" dominantBaseline="central" className="text-[13px] font-bold fill-slate-700 select-none pointer-events-none">H</text>
                        </g>
                    );
                })}

                {/* Front carbon */}
                <circle cx={cx} cy={cy} r={atomR} fill="#374151" stroke="#111827" strokeWidth="2" />
                <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="central" className="text-[15px] font-bold fill-white select-none pointer-events-none">C</text>
            </svg>
        );
    };

    // Energy graph
    const renderEnergyGraph = () => {
        const gw = 280, gh = 120;
        const padL = 35, padR = 10, padT = 15, padB = 25;
        const plotW = gw - padL - padR;
        const plotH = gh - padT - padB;

        // Generate sine curve points
        const curvePoints: string[] = [];
        for (let deg = 0; deg <= 360; deg += 2) {
            const e = (12.5 / 2) * (1 - Math.cos(3 * (deg * Math.PI) / 180));
            const x = padL + (deg / 360) * plotW;
            const y = padT + plotH - (e / 14) * plotH;
            curvePoints.push(`${x},${y}`);
        }

        // Fill area
        const fillPath = `M ${padL},${padT + plotH} ` + curvePoints.map((p, i) => `L ${p}`).join(' ') + ` L ${padL + plotW},${padT + plotH} Z`;

        // Current position
        const norm = ((dihedralAngle % 360) + 360) % 360;
        const curX = padL + (norm / 360) * plotW;
        const curY = padT + plotH - (potentialEnergy / 14) * plotH;

        return (
            <svg viewBox={`0 0 ${gw} ${gh}`} className="w-full h-full">
                {/* Grid lines */}
                {[0, 60, 120, 180, 240, 300, 360].map(deg => {
                    const x = padL + (deg / 360) * plotW;
                    return <line key={deg} x1={x} y1={padT} x2={x} y2={padT + plotH} stroke="#334155" strokeWidth="0.5" />;
                })}
                {[0, 6.25, 12.5].map(e => {
                    const y = padT + plotH - (e / 14) * plotH;
                    return <line key={e} x1={padL} y1={y} x2={padL + plotW} y2={y} stroke="#334155" strokeWidth="0.5" />;
                })}

                {/* Fill */}
                <path d={fillPath} fill="url(#energyGradient)" opacity="0.3" />

                {/* Gradient def */}
                <defs>
                    <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                </defs>

                {/* Curve */}
                <polyline points={curvePoints.join(' ')} fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />

                {/* Axis labels */}
                <text x={padL - 3} y={padT + 3} textAnchor="end" className="text-[6px] fill-slate-500 select-none">12.5</text>
                <text x={padL - 3} y={padT + plotH / 2 + 2} textAnchor="end" className="text-[6px] fill-slate-500 select-none">6.25</text>
                <text x={padL - 3} y={padT + plotH + 3} textAnchor="end" className="text-[6px] fill-slate-500 select-none">0</text>

                {[0, 60, 120, 180, 240, 300, 360].map(deg => (
                    <text key={`xl-${deg}`} x={padL + (deg / 360) * plotW} y={padT + plotH + 12} textAnchor="middle" className="text-[5px] fill-slate-500 select-none">{deg}°</text>
                ))}

                {/* Y-axis label */}
                <text x={5} y={padT + plotH / 2} textAnchor="middle" dominantBaseline="central" className="text-[5px] fill-slate-400 select-none" transform={`rotate(-90, 5, ${padT + plotH / 2})`}>
                    PE (kJ/mol)
                </text>

                {/* Current position marker */}
                <line x1={curX} y1={padT} x2={curX} y2={padT + plotH} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
                <circle cx={curX} cy={curY} r={4} fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" className={conformationType === 'eclipsed' ? 'animate-ping' : ''}>
                    <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
                </circle>

                {/* Energy readout */}
                <rect x={curX - 18} y={curY - 16} width="36" height="12" rx="3" fill="#0f172a" opacity="0.85" />
                <text x={curX} y={curY - 9} textAnchor="middle" className="text-[6px] font-bold fill-amber-400 select-none">{potentialEnergy.toFixed(1)}</text>

                {/* Staggered / Eclipsed markers */}
                {[60, 180, 300].map(deg => {
                    const x = padL + (deg / 360) * plotW;
                    return <text key={`s-${deg}`} x={x} y={padT + plotH + 20} textAnchor="middle" className="text-[4px] fill-emerald-500 select-none">S</text>;
                })}
                {[0, 120, 240, 360].map(deg => {
                    const x = padL + (deg / 360) * plotW;
                    return <text key={`e-${deg}`} x={x} y={padT + plotH + 20} textAnchor="middle" className="text-[4px] fill-red-400 select-none">E</text>;
                })}
            </svg>
        );
    };

    const conformationColor = conformationType === 'staggered' ? 'text-emerald-400' : conformationType === 'eclipsed' ? 'text-red-400' : 'text-amber-400';
    const conformationBg = conformationType === 'staggered' ? 'bg-emerald-500/10 border-emerald-500/30' : conformationType === 'eclipsed' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30';

    return (
        <div className="w-full h-full flex flex-col text-slate-100 font-sans bg-slate-900 absolute inset-0">
            {/* Top Bar */}
            <div className="flex items-center gap-2 p-3 bg-slate-950 border-b border-slate-800 shrink-0 overflow-x-auto">
                {/* View mode buttons */}
                {[
                    { mode: 'newman' as const, label: 'Newman' },
                    { mode: 'sawhorse' as const, label: 'Sawhorse' },
                    { mode: '3d' as const, label: '3D Model' }
                ].map(({ mode, label }) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${viewMode === mode ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}>
                        {label}
                    </button>
                ))}

                <div className="w-px h-5 bg-slate-700 mx-1" />

                {/* Toggles */}
                <button onClick={() => setShowElectronClouds(!showElectronClouds)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${showElectronClouds ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}>
                    <Eye size={12} /> e⁻ Clouds
                </button>

                <button onClick={() => { setAutoRotate(!autoRotate); if (!autoRotate) resetTrail(); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${autoRotate ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}>
                    {autoRotate ? <Pause size={12} /> : <Play size={12} />} Auto-Rotate
                </button>
            </div>

            {/* System Message */}
            <div className={`p-3 border-b backdrop-blur-sm z-10 transition-all duration-300 ${conformationBg}`}>
                <p className={`text-xs md:text-sm font-medium text-center leading-relaxed ${conformationColor}`}>
                    {systemMessage}
                </p>
            </div>

            {/* Main Content: Molecule + Energy Graph */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Molecule Viewer */}
                <div className="flex-1 flex items-center justify-center relative min-h-0 overflow-hidden">
                    {/* Strain vibration effect */}
                    <div className={`w-full h-full flex items-center justify-center transition-all duration-200 ${conformationType === 'eclipsed' ? 'animate-pulse' : ''}`}
                        style={{ transform: conformationType === 'eclipsed' ? `rotate(${Math.random() * 2 - 1}deg)` : 'none' }}>
                        {viewMode === 'newman' && renderNewman()}
                        {viewMode === 'sawhorse' && renderSawhorse()}
                        {viewMode === '3d' && render3D()}
                    </div>

                    {/* Conformation badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${conformationBg} ${conformationColor}`}>
                        {conformationType}
                    </div>

                    {/* Newman projection mini-label */}
                    <div className="absolute bottom-2 left-3 text-[9px] text-slate-600 uppercase tracking-widest font-bold">
                        {viewMode === 'newman' ? 'Newman Projection' : viewMode === 'sawhorse' ? 'Sawhorse Projection' : '3D Ball-and-Stick'}
                    </div>
                </div>

                {/* Energy Graph Panel */}
                <div className="lg:w-[35%] w-full h-[140px] lg:h-full bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 p-3 flex flex-col shrink-0">
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
                        <Zap size={10} /> Potential Energy vs Dihedral Angle
                    </div>
                    <div className="flex-1 min-h-0">
                        {renderEnergyGraph()}
                    </div>
                    <div className="flex justify-between items-center text-[9px] mt-1">
                        <span className="text-emerald-500 font-bold">S = Staggered (stable)</span>
                        <span className="text-red-400 font-bold">E = Eclipsed (unstable)</span>
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="bg-slate-950 border-t border-slate-800 p-4 shrink-0">
                <div className="max-w-3xl mx-auto">
                    {/* Dihedral angle slider */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 shrink-0">
                            <RotateCw size={14} className="text-slate-500" />
                            <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Dihedral Angle</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={dihedralAngle}
                            onChange={e => { setDihedralAngle(Number(e.target.value)); setAutoRotate(false); }}
                            className="flex-1 h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500"
                            style={{
                                background: `linear-gradient(to right, #10b981 0%, #ef4444 ${(dihedralAngle / 360) * 100}%, #1e293b ${(dihedralAngle / 360) * 100}%)`
                            }}
                        />
                        <div className="font-mono text-sm text-amber-400 font-bold w-12 text-right shrink-0">{dihedralAngle.toFixed(0)}°</div>
                    </div>

                    {/* Quick-jump buttons */}
                    <div className="flex items-center gap-2 mt-3 justify-center flex-wrap">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest mr-1">Jump to:</span>
                        {[
                            { angle: 0, label: '0° (Eclipsed)', color: 'text-red-400 border-red-500/30 hover:bg-red-500/10' },
                            { angle: 60, label: '60° (Staggered)', color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' },
                            { angle: 120, label: '120° (Eclipsed)', color: 'text-red-400 border-red-500/30 hover:bg-red-500/10' },
                            { angle: 180, label: '180° (Staggered)', color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' },
                            { angle: 240, label: '240° (Eclipsed)', color: 'text-red-400 border-red-500/30 hover:bg-red-500/10' },
                            { angle: 300, label: '300° (Staggered)', color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' },
                        ].map(({ angle, label, color }) => (
                            <button key={angle} onClick={() => { setDihedralAngle(angle); setAutoRotate(false); }}
                                className={`px-2 py-1 rounded-md text-[9px] md:text-[10px] font-bold border cursor-pointer transition-all whitespace-nowrap ${color}`}>
                                {label}
                            </button>
                        ))}
                        <button onClick={handleReset}
                            className="px-2 py-1 rounded-md text-[10px] font-bold border border-slate-600 text-slate-400 cursor-pointer hover:bg-slate-800 flex items-center gap-1 ml-1">
                            <RefreshCcw size={10} /> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    function handleReset() {
        setDihedralAngle(60);
        setAutoRotate(false);
        setShowElectronClouds(false);
        setViewMode('newman');
        setTrailPoints([]);
    }
};

export default EthaneConformationsCanvas;
