import React, { useState, useMemo } from 'react';
import { RefreshCcw, Plus, Minus, Type, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props {
    topic: Topic;
    onExit: () => void;
}

const VSEPRTheoryLab: React.FC<Props> = ({ topic, onExit }) => {
    const [bondPairs, setBondPairs] = useState(2);
    const [lonePairs, setLonePairs] = useState(0);

    const totalPairs = bondPairs + lonePairs;

    const handleAddBp = () => {
        if (totalPairs < 6) setBondPairs(bondPairs + 1);
    };
    const handleAddLp = () => {
        if (totalPairs < 6) setLonePairs(lonePairs + 1);
    };
    const handleMorphLp = () => {
        if (bondPairs > 0) {
            setBondPairs(bondPairs - 1);
            setLonePairs(lonePairs + 1);
        }
    };
    const handleReset = () => {
        setBondPairs(2);
        setLonePairs(0);
    };

    const geometryData = useMemo(() => {
        const t = totalPairs;
        const b = bondPairs;
        const l = lonePairs;

        let shape = "Unknown";
        let angle = "N/A";
        let lpRepulsion = 0;
        let bpRepulsion = 0;

        if (t === 2) {
            if (b === 2) { shape = "Linear"; angle = "180°"; bpRepulsion = 20; lpRepulsion = 0; }
        } else if (t === 3) {
            if (b === 3) { shape = "Trigonal Planar"; angle = "120°"; bpRepulsion = 40; lpRepulsion = 0; }
            else if (b === 2) { shape = "Bent (V-shape)"; angle = "< 120° (env 119°)"; bpRepulsion = 30; lpRepulsion = 60; }
        } else if (t === 4) {
            if (b === 4) { shape = "Tetrahedral"; angle = "109.5°"; bpRepulsion = 60; lpRepulsion = 0; }
            else if (b === 3) { shape = "Trigonal Pyramidal"; angle = "107°"; bpRepulsion = 40; lpRepulsion = 70; }
            else if (b === 2) { shape = "Bent (V-shape)"; angle = "104.5°"; bpRepulsion = 20; lpRepulsion = 100; }
        } else if (t === 5) {
            if (b === 5) { shape = "Trigonal Bipyramidal"; angle = "90°, 120°"; bpRepulsion = 80; lpRepulsion = 0; }
            else if (b === 4) { shape = "See-saw"; angle = "<90°, <120°"; bpRepulsion = 60; lpRepulsion = 80; }
            else if (b === 3) { shape = "T-shaped"; angle = "<90°"; bpRepulsion = 40; lpRepulsion = 90; }
            else if (b === 2) { shape = "Linear"; angle = "180°"; bpRepulsion = 20; lpRepulsion = 100; }
        } else if (t === 6) {
            if (b === 6) { shape = "Octahedral"; angle = "90°"; bpRepulsion = 100; lpRepulsion = 0; }
            else if (b === 5) { shape = "Square Pyramidal"; angle = "<90°"; bpRepulsion = 80; lpRepulsion = 80; }
            else if (b === 4) { shape = "Square Planar"; angle = "90°"; bpRepulsion = 60; lpRepulsion = 100; }
        }

        // fallback mapping if 0 or 1 bond pairs which aren't typical valid shapes
        if (b <= 1) shape = b === 1 ? "Diatomic Linear" : "Bare Atom";

        return { shape, angle, bpRepulsion, lpRepulsion };
    }, [bondPairs, lonePairs, totalPairs]);

    // Visual Generation
    const renderMolecule = () => {
        const t = totalPairs;
        const b = bondPairs;
        const l = lonePairs;

        // Assign angles depending on shape based on standard positions (simple 2D projection for pseudo-3D)
        let positions: { type: 'bp' | 'lp', rotX: number, rotY: number, rotZ: number }[] = [];

        // Helper to push items
        const place = (type: 'bp' | 'lp', rx: number, ry: number, rz: number) => {
            positions.push({ type, rotX: rx, rotY: ry, rotZ: rz });
        };

        if (t === 2) {
            if (b === 2) { place('bp', 0, 0, 0); place('bp', 0, 0, 180); }
            else { place('bp', 0, 0, 0); place('lp', 0, 0, 180); }
        } else if (t === 3) {
            if (b === 3) {
                place('bp', 0, 0, 30); place('bp', 0, 0, 150); place('bp', 0, 0, 270);
            } else if (b === 2) {
                // Squeezed Bent
                place('bp', 0, 0, 45); place('bp', 0, 0, 135); place('lp', 0, 0, 270);
            } else {
                place('bp', 0, 0, 90); place('lp', 0, 0, 225); place('lp', 0, 0, 315);
            }
        } else if (t === 4) {
            if (b === 4) {
                place('bp', 0, 0, -90);
                place('bp', 19.47, 0, 90);
                place('bp', -19.47, 60, 90);
                place('bp', -19.47, -60, 90);
            } else if (b === 3) { // 1 LP -> Pyramidal, base bp squished
                place('lp', 0, 0, -90);
                place('bp', 25, 0, 90);
                place('bp', -25, 60, 90);
                place('bp', -25, -60, 90);
            } else if (b === 2) { // 2 LP -> Bent, put bp in explicit V shape to make it clear
                place('lp', 45, 90, -90);
                place('lp', -45, 90, -90);
                place('bp', 0, 0, 35);
                place('bp', 0, 0, 145);
            } else {
                place('lp', 0, 0, -90);
                place('lp', 19.47, 0, 90);
                place('lp', -19.47, 60, 90);
                place('bp', -19.47, -60, 90);
            }
        } else if (t === 5) {
            if (b === 5) {
                place('bp', 90, 0, 0); place('bp', -90, 0, 0);
                place('bp', 0, 0, 0); place('bp', 0, 120, 0); place('bp', 0, 240, 0);
            } else if (b === 4) { // See-saw, LPs go Equatorial
                place('bp', 90, 0, -10); place('bp', -90, 0, -10); // squished axials
                place('lp', 0, 0, 0);
                place('bp', 0, 130, 0); place('bp', 0, 230, 0); // squished equatorials
            } else if (b === 3) { // T-shaped
                place('bp', 90, 0, -15); place('bp', -90, 0, -15);
                place('lp', 0, 60, 0); place('lp', 0, 300, 0);
                place('bp', 0, 180, 0);
            } else if (b === 2) { // Linear
                place('bp', 90, 0, 0); place('bp', -90, 0, 0);
                place('lp', 0, 0, 0); place('lp', 0, 120, 0); place('lp', 0, 240, 0);
            } else {
                place('bp', 90, 0, 0); place('lp', -90, 0, 0);
                place('lp', 0, 0, 0); place('lp', 0, 120, 0); place('lp', 0, 240, 0);
            }
        } else if (t === 6) {
            if (b === 6) {
                place('bp', 0, 0, 0); place('bp', 0, 180, 0);
                place('bp', 90, 0, 0); place('bp', -90, 0, 0);
                place('bp', 0, 90, 0); place('bp', 0, -90, 0);
            } else if (b === 5) { // Square Pyramidal
                place('lp', 0, 180, 0); place('bp', 0, 0, 0);
                place('bp', 95, 0, 0); place('bp', -95, 0, 0);
                place('bp', 0, 95, 0); place('bp', 0, -95, 0);
            } else if (b === 4) { // Square Planar
                place('lp', 0, 180, 0); place('lp', 0, 0, 0);
                place('bp', 90, 0, 0); place('bp', -90, 0, 0);
                place('bp', 0, 90, 0); place('bp', 0, -90, 0);
            } else if (b === 3) { // T-Shape
                place('lp', 0, 180, 0); place('lp', 0, 0, 0); place('lp', 0, 90, 0);
                place('bp', 90, 0, 0); place('bp', -90, 0, 0); place('bp', 0, -90, 0);
            } else if (b === 2) { // Linear
                place('lp', 0, 180, 0); place('lp', 0, 0, 0); place('lp', 0, 90, 0); place('lp', 0, -90, 0);
                place('bp', 90, 0, 0); place('bp', -90, 0, 0);
            } else {
                place('bp', 90, 0, 0); place('lp', -90, 0, 0);
                place('lp', 0, 0, 0); place('lp', 0, 180, 0); place('lp', 0, 90, 0); place('lp', 0, -90, 0);
            }
        } else if (t <= 1) {
            if (b === 1) place('bp', 0, 0, 90);
            if (l === 1) place('lp', 0, 0, 270);
        }

        return (
            <div className="relative w-64 h-64 mx-auto perspective-1000">
                <div className="absolute inset-0 preserve-3d animate-spin-slow">
                    {/* Central Atom */}
                    <div className="absolute top-1/2 left-1/2 w-12 h-12 -ml-6 -mt-6 bg-gradient-to-br from-slate-400 to-slate-700 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] z-10 
            flex items-center justify-center text-xs font-bold text-white/50">
                        A
                    </div>

                    {/* Bonds and Lone Pairs */}
                    {positions.map((pos, idx) => (
                        <div key={idx}
                            className="absolute top-1/2 left-1/2 origin-left"
                            style={{
                                transform: `rotateX(${pos.rotX}deg) rotateY(${pos.rotY}deg) rotateZ(${pos.rotZ}deg)`
                            }}>
                            {pos.type === 'bp' ? (
                                // Bond Pair
                                <div className="flex items-center">
                                    <div className="w-16 h-2 bg-gradient-to-r from-white/80 to-slate-300 ml-6 rounded-full shadow-lg"></div>
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-700 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]
                    flex items-center justify-center text-[10px] font-bold text-white/80 -ml-2">
                                        B
                                    </div>
                                </div>
                            ) : (
                                // Lone Pair Lobe
                                <div className="flex items-center ml-2">
                                    <div className="w-[80px] h-[40px] bg-gradient-to-r from-yellow-500/50 to-yellow-600/10 rounded-[60px_20px_20px_60px] border border-yellow-300/40 shadow-[0_0_15px_rgba(250,204,21,0.5)] backdrop-blur-[2px] relative flex items-center justify-end pr-3">
                                        <div className="flex flex-col gap-1.5 -mr-1">
                                            <div className="w-2.5 h-2.5 bg-yellow-100 rounded-full shadow-[0_0_5px_rgba(255,255,255,1)]"></div>
                                            <div className="w-2.5 h-2.5 bg-yellow-100 rounded-full shadow-[0_0_5px_rgba(255,255,255,1)]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const statusBadge = (
        <div className="flex flex-col items-center bg-slate-900/80 p-2 px-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">Geometry</div>
            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 whitespace-nowrap">
                {geometryData.shape}
            </div>
        </div>
    );

    const floatingNav = (
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md rounded-full px-5 py-2 border border-white/10 shadow-xl">
            <Zap className="text-yellow-400" size={16} />
            <span className="text-sm font-mono text-emerald-400 font-bold">{geometryData.angle}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bond Angle</span>
        </div>
    );

    const controlsCombo = (
        <div className="w-full flex flex-col md:flex-row gap-4">
            {/* Build Controls */}
            <div className="flex-1 bg-slate-950/50 p-3 flex flex-col gap-2 rounded-xl border border-slate-700/50">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pairs ({totalPairs}/6)</span>
                    <button onClick={handleReset} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600 transition-colors flex items-center gap-1">
                        <RefreshCcw size={10} /> Reset
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleAddBp} disabled={totalPairs >= 6} className="py-2 px-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-blue-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Plus size={12} /> Bond Pair
                    </button>
                    <button onClick={handleAddLp} disabled={totalPairs >= 6} className="py-2 px-2 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/30 rounded-lg text-yellow-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Plus size={12} /> Lone Pair
                    </button>
                    <button onClick={handleMorphLp} disabled={bondPairs === 0} className="col-span-2 py-2 px-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-purple-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Type size={12} /> Morph Bond → Lone Pair
                    </button>
                </div>
            </div>

            {/* Repulsion Meters */}
            <div className="flex-[1.5] bg-slate-950/50 p-4 flex flex-col justify-center rounded-xl border border-slate-700/50 gap-4">
                <div>
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bond Pair Repulsion (bp-bp)</span>
                        <span className="text-blue-400 font-mono text-xs">{geometryData.bpRepulsion}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${geometryData.bpRepulsion}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lone Pair Effect (lp-lp & lp-bp)</span>
                        <span className="text-yellow-400 font-mono text-xs">{geometryData.lpRepulsion}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${geometryData.lpRepulsion}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const simulationCombo = (
        <div className="w-full h-full relative bg-black flex items-center justify-center min-h-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none"></div>
            {renderMolecule()}

            {/* Global Styles for the CSS 3D */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .preserve-3d { transform-style: preserve-3d; }
                .perspective-1000 { perspective: 1000px; }
                @keyframes spin-slow {
                  0% { transform: rotateY(0deg) rotateX(20deg); }
                  100% { transform: rotateY(360deg) rotateX(20deg); }
                }
                .animate-spin-slow {
                  animation: spin-slow 20s linear infinite;
                }
            `}} />
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            FloatingNavComponent={floatingNav}
            StatusBadgeComponent={statusBadge}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
        />
    );
};

export default VSEPRTheoryLab;
