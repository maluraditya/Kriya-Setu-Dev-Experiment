import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Flame, Wind, Sun } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface HeatTransferBlackbodyLabProps {
    topic: any;
    onExit: () => void;
}

type Station = 'conduction' | 'convection' | 'radiation';
type MaterialKey = 'copper' | 'steel' | 'glass';
type EnvironmentKey = 'air' | 'water' | 'vacuum';

const MATERIALS: Record<MaterialKey, { label: string; k: number; color: string }> = {
    copper: { label: 'Copper', k: 400, color: '#d97706' },
    steel: { label: 'Steel', k: 50, color: '#64748b' },
    glass: { label: 'Glass', k: 1.05, color: '#0ea5e9' },
};

const ENVIRONMENTS: Record<EnvironmentKey, { label: string; factor: number; color: string }> = {
    air: { label: 'Air', factor: 1, color: '#38bdf8' },
    water: { label: 'Water', factor: 2.3, color: '#0f766e' },
    vacuum: { label: 'Vacuum', factor: 0, color: '#7c3aed' },
};

const STATIONS: { key: Station; label: string; accent: string; icon: React.ReactNode }[] = [
    { key: 'conduction', label: 'Conduction', accent: '#f97316', icon: <Flame size={18} /> },
    { key: 'convection', label: 'Convection', accent: '#06b6d4', icon: <Wind size={18} /> },
    { key: 'radiation', label: 'Radiation', accent: '#f43f5e', icon: <Sun size={18} /> },
];

const SIGMA = 5.67e-8;
const WIEN_CONSTANT_NM_K = 2.9e6;
const AMBIENT_TEMPERATURE = 300;

const HeatTransferBlackbodyLab: React.FC<HeatTransferBlackbodyLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    const [station, setStation] = useState<Station>('conduction');
    const [temperature, setTemperature] = useState(1200);
    const [material, setMaterial] = useState<MaterialKey>('copper');
    const [environment, setEnvironment] = useState<EnvironmentKey>('air');
    const [areaCm2, setAreaCm2] = useState(4);
    const [lengthM, setLengthM] = useState(0.6);

    const stateRef = useRef({
        station,
        temperature,
        material,
        environment,
        areaCm2,
        lengthM,
    });

    useEffect(() => {
        stateRef.current = { station, temperature, material, environment, areaCm2, lengthM };
    }, [station, temperature, material, environment, areaCm2, lengthM]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        resizeObserver.observe(parent);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        return () => resizeObserver.disconnect();
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        if (W < 10 || H < 10) {
            animRef.current = requestAnimationFrame(draw);
            return;
        }

        const { station: activeStation, temperature: T, material: materialKey, environment: environmentKey, areaCm2: area, lengthM: length } = stateRef.current;
        const materialData = MATERIALS[materialKey];
        const environmentData = ENVIRONMENTS[environmentKey];
        const areaM2 = area * 1e-4;
        const deltaT = Math.max(T - AMBIENT_TEMPERATURE, 0);
        const conductionRate = materialData.k * areaM2 * deltaT / Math.max(length, 0.2);
        const convectionStrength = environmentKey === 'vacuum' ? 0 : environmentData.factor * (deltaT / 300) * Math.sqrt(area / Math.max(length, 0.2));
        const radiationPower = SIGMA * areaM2 * Math.pow(T, 4);
        const peakNm = WIEN_CONSTANT_NM_K / Math.max(T, 1);
        const time = Date.now() * 0.001;

        ctx.clearRect(0, 0, W, H);

        const scale = W < 1000 ? 1 : (W > 1500 ? 1.25 : 1 + (W - 1000) * 0.0005);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.022, H * 0.035));
        const pad = Math.min(W * 0.04, H * 0.04, scale * 28);

        const stationData = STATIONS.find(s => s.key === activeStation)!;

        const topSectionHeight = H * 0.48; // Slightly smaller top section
        const bottomSectionY = topSectionHeight + pad * 0.5;
        const bottomSectionHeight = H - bottomSectionY - pad;

        const infoWidth = W * 0.38;
        const graphX = pad * 2 + infoWidth;
        const graphWidth = W - infoWidth - pad * 3;

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, pad, bottomSectionY, infoWidth, bottomSectionHeight, 16);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        roundRect(ctx, pad, bottomSectionY, infoWidth, bottomSectionHeight, 16);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, graphX, bottomSectionY, graphWidth, bottomSectionHeight, 16);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        roundRect(ctx, graphX, bottomSectionY, graphWidth, bottomSectionHeight, 16);
        ctx.stroke();

        ctx.fillStyle = stationData.accent;
        ctx.font = `bold ${fs(18)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`${stationData.label.toUpperCase()} SIMULATION`, pad * 2, bottomSectionY + pad * 1.2);

        const descY = bottomSectionY + pad * 2.2;
        const descMaxWidth = infoWidth - pad * 3;
        const lineHeight = fs(11) * 1.5;

        ctx.fillStyle = '#334155';
        ctx.font = `${fs(11)}px sans-serif`;

        const descriptions = getDescriptions(activeStation, {
            materialLabel: materialData.label,
            environmentLabel: environmentData.label,
            conductionRate,
            convectionStrength,
            radiationPower,
            peakNm,
            lengthM: length,
            areaCm2: area,
            deltaT,
            temperature: T,
        });

        let currentY = descY;
        descriptions.forEach((line) => {
            const lines = wrapText(ctx, line, descMaxWidth);
            lines.forEach((wrappedLine) => {
                ctx.fillText(wrappedLine, pad * 2, currentY);
                currentY += lineHeight;
            });
            currentY += fs(6);
        });

        const metrics = getMetrics(activeStation, {
            conductionRate,
            convectionStrength,
            radiationPower,
            peakNm,
            temperature: T,
        });

        const metricHeight = 30;
        const metricGap = 8;
        const totalMetricsHeight = metrics.length * metricHeight + (metrics.length - 1) * metricGap;
        const metricStartY = bottomSectionY + bottomSectionHeight - pad - totalMetricsHeight;

        metrics.forEach((metric, index) => {
            const my = metricStartY + index * (metricHeight + metricGap);

            ctx.fillStyle = '#f8fafc';
            roundRect(ctx, pad * 2, my, infoWidth - pad * 3, metricHeight, 8);
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            roundRect(ctx, pad * 2, my, infoWidth - pad * 3, metricHeight, 8);
            ctx.stroke();

            ctx.fillStyle = metric.color;
            ctx.font = `bold ${fs(10)}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(metric.label.toUpperCase(), pad * 2 + 12, my + metricHeight * 0.6);

            ctx.fillStyle = '#0f172a';
            ctx.font = `bold ${fs(14)}px monospace`;
            ctx.textAlign = 'right';
            ctx.fillText(metric.value, pad * 2 + infoWidth - pad * 3 - 12, my + metricHeight * 0.6);
        });

        ctx.textAlign = 'left';

        if (activeStation === 'conduction') {
            drawConductionSimulation(ctx, {
                x: pad,
                y: pad,
                w: W - pad * 2,
                h: topSectionHeight - pad,
                pad,
                fs,
                time,
                temperature: T,
                materialColor: materialData.color,
                rate: conductionRate,
            });
            drawConductionGraph(ctx, {
                x: graphX,
                y: bottomSectionY,
                w: graphWidth,
                h: bottomSectionHeight,
                pad,
                fs,
                currentArea: area,
                lengthM: length,
                materialK: materialData.k,
                deltaT,
            });
        } else if (activeStation === 'convection') {
            drawConvectionSimulation(ctx, {
                x: pad,
                y: pad,
                w: W - pad * 2,
                h: topSectionHeight - pad,
                pad,
                fs,
                time,
                temperature: T,
                strength: convectionStrength,
                environment: environmentKey,
            });
            drawConvectionGraph(ctx, {
                x: graphX,
                y: bottomSectionY,
                w: graphWidth,
                h: bottomSectionHeight,
                pad,
                fs,
                selected: environmentKey,
                deltaT,
                areaCm2: area,
                lengthM: length,
            });
        } else {
            drawRadiationSimulation(ctx, {
                x: pad,
                y: pad,
                w: W - pad * 2,
                h: topSectionHeight - pad,
                pad,
                fs,
                time,
                temperature: T,
                power: radiationPower,
                peakNm,
            });
            drawSpectrumGraph(ctx, {
                x: graphX,
                y: bottomSectionY,
                w: graphWidth,
                h: bottomSectionHeight,
                pad,
                fs,
                temperature: T,
                peakNm,
            });
        }

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [draw]);

    const reset = () => {
        setStation('conduction');
        setTemperature(1200);
        setMaterial('copper');
        setEnvironment('air');
        setAreaCm2(4);
        setLengthM(0.6);
    };

    const simulationCombo = (
        <div className="w-full h-full relative bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[350px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const conductionRate = MATERIALS[material].k * (areaCm2 * 1e-4) * Math.max(temperature - AMBIENT_TEMPERATURE, 0) / Math.max(lengthM, 0.2);
    const convectionStrength = environment === 'vacuum' ? 0 : ENVIRONMENTS[environment].factor * (Math.max(temperature - AMBIENT_TEMPERATURE, 0) / 300) * Math.sqrt(areaCm2 / Math.max(lengthM, 0.2));
    const radiationPower = SIGMA * (areaCm2 * 1e-4) * Math.pow(temperature, 4);
    const peakNm = WIEN_CONSTANT_NM_K / temperature;

    const controlsCombo = (
        <div className="flex flex-col gap-4 w-full text-slate-700 p-2">
            <div className="flex gap-2">
                {STATIONS.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setStation(item.key)}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 font-bold text-sm transition-all shadow-sm active:scale-95 ${
                            station === item.key ? 'text-white border-transparent shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                        style={station === item.key ? { backgroundColor: item.accent } : {}}
                    >
                        {item.icon}
                        <span className="hidden md:inline">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {station === 'conduction' && (
                    <>
                        <StatCard label="Heat Flow" value={`${conductionRate.toFixed(1)} W`} color="text-orange-600" />
                        <StatCard label="Temperature" value={`${temperature} K`} color="text-red-600" />
                        <StatCard label="Area" value={`${areaCm2.toFixed(1)} cm²`} color="text-blue-600" />
                        <StatCard label="Length" value={`${lengthM.toFixed(2)} m`} color="text-green-600" />
                    </>
                )}
                {station === 'convection' && (
                    <>
                        <StatCard label="Flow Rate" value={environment === 'vacuum' ? '0.00' : convectionStrength.toFixed(2)} color="text-cyan-600" />
                        <StatCard label="Temperature" value={`${temperature} K`} color="text-red-600" />
                        <StatCard label="Area" value={`${areaCm2.toFixed(1)} cm²`} color="text-blue-600" />
                        <StatCard label="Length" value={`${lengthM.toFixed(2)} m`} color="text-green-600" />
                    </>
                )}
                {station === 'radiation' && (
                    <>
                        <StatCard label="Radiated Power" value={`${radiationPower.toFixed(2)} W`} color="text-rose-600" />
                        <StatCard label="Temperature" value={`${temperature} K`} color="text-red-600" />
                        <StatCard label="Peak λ" value={`${peakNm.toFixed(0)} nm`} color="text-purple-600" />
                        <StatCard label="Area" value={`${areaCm2.toFixed(1)} cm²`} color="text-blue-600" />
                    </>
                )}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <SliderRow label="Temperature" valueLabel={`${temperature} K`} minLabel="300 K" maxLabel="6000 K">
                        <input
                            type="range"
                            min="300"
                            max="6000"
                            step="50"
                            value={temperature}
                            onChange={(e) => setTemperature(Number(e.target.value))}
                            className="w-full accent-rose-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                        />
                    </SliderRow>
                    <SliderRow label="Area" valueLabel={`${areaCm2.toFixed(1)} cm²`} minLabel="1 cm²" maxLabel="8 cm²">
                        <input
                            type="range"
                            min="1"
                            max="8"
                            step="0.5"
                            value={areaCm2}
                            onChange={(e) => setAreaCm2(Number(e.target.value))}
                            className="w-full accent-orange-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                        />
                    </SliderRow>
                    {(station === 'conduction' || station === 'convection') && (
                        <SliderRow label="Length" valueLabel={`${lengthM.toFixed(2)} m`} minLabel="0.20 m" maxLabel="1.20 m">
                            <input
                                type="range"
                                min="0.2"
                                max="1.2"
                                step="0.05"
                                value={lengthM}
                                onChange={(e) => setLengthM(Number(e.target.value))}
                                className="w-full accent-blue-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                            />
                        </SliderRow>
                    )}
                </div>

                <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    {station === 'conduction' && (
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Material</div>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(MATERIALS) as MaterialKey[]).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setMaterial(key)}
                                        className={`rounded-xl px-3 py-3 text-xs md:text-sm font-bold border transition-all ${
                                            material === key ? 'text-white border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                                        }`}
                                        style={material === key ? { backgroundColor: MATERIALS[key].color } : {}}
                                    >
                                        {MATERIALS[key].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {station === 'convection' && (
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Environment</div>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(ENVIRONMENTS) as EnvironmentKey[]).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setEnvironment(key)}
                                        className={`rounded-xl px-3 py-3 text-xs md:text-sm font-bold border transition-all ${
                                            environment === key ? 'text-white border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                                        }`}
                                        style={environment === key ? { backgroundColor: ENVIRONMENTS[key].color } : {}}
                                    >
                                        {ENVIRONMENTS[key].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {station === 'radiation' && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center mb-3 shadow-lg">
                                <Sun size={32} className="text-white" />
                            </div>
                            <p className="text-sm text-slate-600">Radiation is independent of material and environment.</p>
                            <p className="text-xs text-slate-400 mt-1">Only Temperature and Area affect the output.</p>
                        </div>
                    )}

                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-sm shadow-sm active:scale-95"
                    >
                        <RotateCcw size={18} /> RESET LAB
                    </button>
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

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-slate-200 shadow-sm">
        <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-base md:text-xl font-bold font-mono tracking-tight ${color}`}>{value}</div>
    </div>
);

const SliderRow = ({
    label,
    valueLabel,
    minLabel,
    maxLabel,
    children,
}: {
    label: string;
    valueLabel: string;
    minLabel: string;
    maxLabel: string;
    children: React.ReactNode;
}) => (
    <div className="space-y-2">
        <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center">
            <span>{label}</span>
            <span className="text-slate-700 font-mono text-sm md:text-base bg-slate-50 border border-slate-200 px-3 py-1 rounded shadow-sm">{valueLabel}</span>
        </label>
        {children}
        <div className="flex justify-between text-[9px] md:text-xs font-bold text-slate-400 uppercase">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
        </div>
    </div>
);

function getDescriptions(
    station: Station,
    values: {
        materialLabel: string;
        environmentLabel: string;
        conductionRate: number;
        convectionStrength: number;
        radiationPower: number;
        peakNm: number;
        lengthM: number;
        areaCm2: number;
        deltaT: number;
        temperature: number;
    }
): string[] {
    if (station === 'conduction') {
        return [
            `Heat flows through adjacent particles without bulk motion of matter.`,
            `Material: ${values.materialLabel} with thermal conductivity k = ${MATERIALS[values.materialLabel.toLowerCase() as MaterialKey]?.k || 50} W/m·K.`,
            `Formula: H = k·A·ΔT / L where A = ${values.areaCm2.toFixed(1)} cm², L = ${values.lengthM.toFixed(2)} m, ΔT = ${values.deltaT.toFixed(0)} K.`,
            `Larger cross-section increases flow; longer length reduces it.`,
        ];
    }

    if (station === 'convection') {
        return [
            `Convection transfers energy through actual motion of fluid layers.`,
            `Environment: ${values.environmentLabel}. Hot fluid near heater becomes less dense and rises.`,
            values.environmentLabel === 'Vacuum'
                ? `In vacuum, convection stops because there is no fluid to circulate.`
                : `Flow strength grows with ΔT. Current relative flow index: ${values.convectionStrength.toFixed(2)}.`,
            `This explains sea breeze, room heating, and boiling water currents.`,
        ];
    }

    return [
        `Radiation transfers energy via electromagnetic waves without any medium.`,
        `At ${values.temperature} K, the blackbody emits ~${values.radiationPower.toFixed(2)} W from selected area.`,
        `Wien's Law: λ_max = 2.9×10⁶ / T ≈ ${values.peakNm.toFixed(0)} nm.`,
        `Total power scales with T⁴ (Stefan-Boltzmann Law). Higher T shifts peak to shorter wavelengths.`,
    ];
}

function getMetrics(
    station: Station,
    values: {
        conductionRate: number;
        convectionStrength: number;
        radiationPower: number;
        peakNm: number;
        temperature: number;
    }
): { label: string; value: string; color: string }[] {
    if (station === 'conduction') {
        return [
            { label: 'Heat Flow', value: `${values.conductionRate.toFixed(1)} W`, color: '#f97316' },
            { label: 'Efficiency', value: values.conductionRate > 50 ? 'High' : values.conductionRate > 10 ? 'Medium' : 'Low', color: '#10b981' },
        ];
    }

    if (station === 'convection') {
        return [
            { label: 'Flow Rate', value: values.convectionStrength === 0 ? 'None' : values.convectionStrength.toFixed(2), color: '#06b6d4' },
            { label: 'Status', value: values.convectionStrength === 0 ? 'No Flow' : values.convectionStrength > 1 ? 'Strong' : 'Weak', color: '#8b5cf6' },
        ];
    }

    return [
        { label: 'Power', value: `${values.radiationPower.toFixed(2)} W`, color: '#f43f5e' },
        { label: 'Peak λ', value: `${values.peakNm.toFixed(0)} nm`, color: '#8b5cf6' },
    ];
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function drawConductionSimulation(
    ctx: CanvasRenderingContext2D,
    params: {
        x: number;
        y: number;
        w: number;
        h: number;
        pad: number;
        fs: (base: number) => number;
        time: number;
        temperature: number;
        materialColor: string;
        rate: number;
    }
) {
    const { x, y, w, h, pad, fs, time, temperature, materialColor, rate } = params;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 16);
    ctx.stroke();

    const rodX = x + w * 0.1;
    const rodY = y + h * 0.42;
    const rodW = w * 0.8;
    const rodH = Math.max(30, h * 0.16);

    const grad = ctx.createLinearGradient(rodX, 0, rodX + rodW, 0);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.35, '#f97316');
    grad.addColorStop(0.65, materialColor);
    grad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = grad;
    roundRect(ctx, rodX, rodY, rodW, rodH, 12);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    roundRect(ctx, rodX, rodY, rodW, rodH, 12);
    ctx.stroke();

    const pulseCount = 15;
    const speed = Math.min(rate / 30, 5);
    for (let i = 0; i < pulseCount; i++) {
        const offset = ((time * speed + i / pulseCount) % 1) * rodW;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(rodX + offset, rodY + rodH / 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#ef4444';
    ctx.font = `bold ${fs(14)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`HOT: ${temperature} K`, rodX + rodW * 0.15, rodY - 14);

    ctx.fillStyle = '#3b82f6';
    ctx.fillText(`COLD: ${AMBIENT_TEMPERATURE} K`, rodX + rodW * 0.85, rodY + rodH + 24);

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(18)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Heat Flow Through a Solid Rod', x + pad * 1.5, y + pad * 1.1);

    ctx.fillStyle = '#64748b';
    ctx.font = `${fs(11)}px sans-serif`;
    ctx.fillText('Particles vibrate and transfer kinetic energy to neighbors', x + pad * 1.5, y + pad * 1.1 + fs(16));

    ctx.textAlign = 'left';

    const formulaY = y + h - pad * 1.8;
    ctx.fillStyle = '#fff7ed';
    roundRect(ctx, x + pad * 1.5, formulaY, w - pad * 3, 40, 10);
    ctx.fill();
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 2;
    roundRect(ctx, x + pad * 1.5, formulaY, w - pad * 3, 40, 10);
    ctx.stroke();

    ctx.fillStyle = '#f97316';
    ctx.font = `bold ${fs(14)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`H = k · A · ΔT / L = ${rate.toFixed(1)} W`, x + w / 2, formulaY + 25);
}

function drawConvectionSimulation(
    ctx: CanvasRenderingContext2D,
    params: {
        x: number;
        y: number;
        w: number;
        h: number;
        pad: number;
        fs: (base: number) => number;
        time: number;
        temperature: number;
        strength: number;
        environment: EnvironmentKey;
    }
) {
    const { x, y, w, h, pad, fs, time, temperature, strength, environment } = params;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 16);
    ctx.stroke();

    const tankX = x + w * 0.22;
    const tankY = y + h * 0.22;
    const tankW = w * 0.56;
    const tankH = h * 0.58;

    const tankBg = environment === 'vacuum' ? '#0f172a' : '#e0f2fe';
    ctx.fillStyle = tankBg;
    roundRect(ctx, tankX, tankY, tankW, tankH, 14);
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    roundRect(ctx, tankX, tankY, tankW, tankH, 14);
    ctx.stroke();

    const heaterGrad = ctx.createLinearGradient(tankX + tankW * 0.2, 0, tankX + tankW * 0.8, 0);
    heaterGrad.addColorStop(0, '#dc2626');
    heaterGrad.addColorStop(0.5, '#ef4444');
    heaterGrad.addColorStop(1, '#dc2626');
    ctx.fillStyle = heaterGrad;
    ctx.fillRect(tankX + tankW * 0.2, tankY + tankH - 15, tankW * 0.6, 15);

    if (environment !== 'vacuum') {
        const loopAmp = Math.max(12, Math.min(30, strength * 12));

        for (let i = 0; i < 20; i++) {
            const t = time * (0.6 + strength * 0.5) + i * 0.35;
            const leftRise = ((t % 1) * tankH * 0.9);
            const rightFall = (((t + 0.5) % 1) * tankH * 0.9);

            ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
            ctx.beginPath();
            ctx.arc(tankX + tankW * 0.28 + Math.sin(t * 5.5) * loopAmp * 0.2, tankY + tankH - 30 - leftRise, 4.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
            ctx.beginPath();
            ctx.arc(tankX + tankW * 0.72 + Math.sin((t + 1.5) * 5.5) * loopAmp * 0.2, tankY + tankH - 30 - rightFall, 4.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(tankX + tankW * 0.28, tankY + tankH - 50);
        ctx.quadraticCurveTo(tankX + tankW * 0.1, tankY + tankH * 0.3, tankX + tankW * 0.28, tankY + tankH * 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tankX + tankW * 0.72, tankY + tankH * 0.15);
        ctx.quadraticCurveTo(tankX + tankW * 0.9, tankY + tankH * 0.3, tankX + tankW * 0.72, tankY + tankH - 50);
        ctx.stroke();
        ctx.setLineDash([]);
    } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = `bold ${fs(14)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('VACUUM - No Convection', tankX + tankW / 2, tankY + tankH / 2);
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(18)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Convection in a Fluid Medium', x + pad * 1.5, y + pad * 1.1);

    ctx.fillStyle = '#64748b';
    ctx.font = `${fs(11)}px sans-serif`;
    ctx.fillText(`Hot fluid rises, cold fluid sinks — creates circulation currents`, x + pad * 1.5, y + pad * 1.1 + fs(16));

    ctx.fillStyle = '#ef4444';
    ctx.font = `bold ${fs(12)}px sans-serif`;
    ctx.fillText(`Heater: ${temperature} K`, tankX, tankY + tankH + 24);

    ctx.textAlign = 'left';
}

function drawRadiationSimulation(
    ctx: CanvasRenderingContext2D,
    params: {
        x: number;
        y: number;
        w: number;
        h: number;
        pad: number;
        fs: (base: number) => number;
        time: number;
        temperature: number;
        power: number;
        peakNm: number;
    }
) {
    const { x, y, w, h, pad, fs, time, temperature, power, peakNm } = params;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 16);
    ctx.stroke();

    const cx = x + w / 2;
    const cy = y + h * 0.52;
    const radius = Math.min(w, h) * 0.15;
    const glowColor = blackbodyColor(temperature);

    ctx.fillStyle = '#0f172a';
    roundRect(ctx, x + pad * 1.5, y + h * 0.18, w - pad * 3, h * 0.58, 16);
    ctx.fill();

    for (let i = 6; i >= 1; i--) {
        const alpha = Math.round((0.03 + i * 0.02) * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = `${glowColor}${alpha}`;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + i * 20, 0, Math.PI * 2);
        ctx.fill();
    }

    const bodyGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 1, cx, cy, radius);
    bodyGrad.addColorStop(0, lightenColor(glowColor, 60));
    bodyGrad.addColorStop(1, glowColor);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2 + time * 0.3;
        const rayLength = radius + 60 + Math.sin(time * 3 + i) * 15;
        const startX = cx + Math.cos(angle) * (radius + 5);
        const startY = cy + Math.sin(angle) * (radius + 5);
        const endX = cx + Math.cos(angle) * rayLength;
        const endY = cy + Math.sin(angle) * rayLength;

        const rayGrad = ctx.createLinearGradient(startX, startY, endX, endY);
        rayGrad.addColorStop(0, glowColor);
        rayGrad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(18)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Blackbody Radiation', x + pad * 1.5, y + pad * 1.1);

    ctx.fillStyle = '#64748b';
    ctx.font = `${fs(11)}px sans-serif`;
    ctx.fillText('Electromagnetic emission from a heated object', x + pad * 1.5, y + pad * 1.1 + fs(16));

    ctx.fillStyle = '#f43f5e';
    ctx.font = `bold ${fs(14)}px monospace`;
    ctx.fillText(`Power: ${power.toFixed(2)} W`, x + pad * 1.5, y + h - pad * 2.8);

    ctx.fillStyle = '#8b5cf6';
    ctx.font = `bold ${fs(14)}px monospace`;
    ctx.fillText(`Peak λ: ${peakNm.toFixed(0)} nm`, x + w * 0.55, y + h - pad * 2.8);

    ctx.textAlign = 'left';
}

function drawConductionGraph(
    ctx: CanvasRenderingContext2D,
    params: {
        x: number;
        y: number;
        w: number;
        h: number;
        pad: number;
        fs: (base: number) => number;
        currentArea: number;
        lengthM: number;
        materialK: number;
        deltaT: number;
    }
) {
    const { x, y, w, h, pad, fs, currentArea, lengthM, materialK, deltaT } = params;

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(15)}px sans-serif`;
    ctx.fillText('Heat Flow vs Area', x + pad * 1.2, y + pad * 1.3);

    const gx = x + pad * 1.5;
    const gy = y + pad * 2.2;
    const gw = w - pad * 2.5;
    const gh = h - pad * 3.8;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = `bold ${fs(10)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Area (cm²)', gx + gw / 2, gy + gh + 24);

    ctx.save();
    ctx.translate(gx - 20, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('H (W)', 0, 0);
    ctx.restore();

    const maxArea = 8;
    const maxFlow = Math.max(1, materialK * 8e-4 * Math.max(deltaT, 1) / Math.max(lengthM, 0.2));

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let a = 1; a <= maxArea; a += 0.2) {
        const flow = materialK * (a * 1e-4) * Math.max(deltaT, 1) / Math.max(lengthM, 0.2);
        const px = gx + ((a - 1) / (maxArea - 1)) * gw;
        const py = gy + gh - (flow / maxFlow) * gh;
        if (a === 1) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const currentFlow = materialK * (currentArea * 1e-4) * Math.max(deltaT, 1) / Math.max(lengthM, 0.2);
    const cx = gx + ((currentArea - 1) / (maxArea - 1)) * gw;
    const cy = gy + gh - (currentFlow / maxFlow) * gh;

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(11)}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`A = ${currentArea.toFixed(1)} cm²`, gx, y + h - pad * 1.2);
    ctx.textAlign = 'right';
    ctx.fillText(`H = ${currentFlow.toFixed(1)} W`, x + w - pad * 1.2, y + h - pad * 1.2);
}

function drawConvectionGraph(
    ctx: CanvasRenderingContext2D,
    params: {
        x: number;
        y: number;
        w: number;
        h: number;
        pad: number;
        fs: (base: number) => number;
        selected: EnvironmentKey;
        deltaT: number;
        areaCm2: number;
        lengthM: number;
    }
) {
    const { x, y, w, h, pad, fs, selected, deltaT, areaCm2, lengthM } = params;

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(15)}px sans-serif`;
    ctx.fillText('Convection by Environment', x + pad * 1.2, y + pad * 1.3);

    const chartX = x + pad * 1.8;
    const chartY = y + pad * 2.4;
    const chartW = w - pad * 3;
    const chartH = h - pad * 4;
    const baseY = chartY + chartH;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, baseY);
    ctx.lineTo(chartX + chartW, baseY);
    ctx.stroke();

    const order: EnvironmentKey[] = ['air', 'water', 'vacuum'];
    const barW = chartW / 4.5;
    const maxValue = Math.max(1, ENVIRONMENTS.water.factor * (deltaT / 300) * Math.sqrt(areaCm2 / Math.max(lengthM, 0.2)));

    order.forEach((key, index) => {
        const value = key === 'vacuum' ? 0 : ENVIRONMENTS[key].factor * (deltaT / 300) * Math.sqrt(areaCm2 / Math.max(lengthM, 0.2));
        const barH = maxValue === 0 ? 0 : (value / maxValue) * (chartH - 40);
        const bx = chartX + (index * 1.4 + 0.5) * barW;
        const by = baseY - barH;

        const isSelected = key === selected;
        const color = isSelected ? ENVIRONMENTS[key].color : '#cbd5e1';

        ctx.fillStyle = color;
        roundRect(ctx, bx, by, barW * 0.9, barH, 8);
        ctx.fill();

        if (isSelected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            roundRect(ctx, bx, by, barW * 0.9, barH, 8);
            ctx.stroke();
        }

        ctx.fillStyle = '#475569';
        ctx.font = `bold ${fs(10)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ENVIRONMENTS[key].label, bx + barW * 0.45, baseY + 18);

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${fs(11)}px monospace`;
        ctx.fillText(value.toFixed(2), bx + barW * 0.45, by - 8);
    });

    ctx.textAlign = 'left';
}

function drawSpectrumGraph(
    ctx: CanvasRenderingContext2D,
    params: {
        x: number;
        y: number;
        w: number;
        h: number;
        pad: number;
        fs: (base: number) => number;
        temperature: number;
        peakNm: number;
    }
) {
    const { x, y, w, h, pad, fs, temperature, peakNm } = params;

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(15)}px sans-serif`;
    ctx.fillText('Blackbody Spectrum', x + pad * 1.2, y + pad * 1.3);

    const gx = x + pad * 1.5;
    const gy = y + pad * 2.2;
    const gw = w - pad * 2.5;
    const gh = h - pad * 3.6;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();

    const minLambda = 200;
    const maxLambda = 2500;
    const samples = 120;
    const points: { x: number; y: number; lambda: number; intensity: number }[] = [];
    let maxI = 0;

    for (let i = 0; i <= samples; i++) {
        const lambda = minLambda + (i / samples) * (maxLambda - minLambda);
        const intensity = normalizedPlanck(lambda, temperature);
        maxI = Math.max(maxI, intensity);
        points.push({ x: 0, y: 0, lambda, intensity });
    }

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    points.forEach((point, index) => {
        const px = gx + ((point.lambda - minLambda) / (maxLambda - minLambda)) * gw;
        const py = gy + gh - (point.intensity / maxI) * (gh - 15);
        point.x = px;
        point.y = py;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();

    const peakX = gx + ((peakNm - minLambda) / (maxLambda - minLambda)) * gw;
    const peakPoint = points.reduce((closest, point) =>
        Math.abs(point.lambda - peakNm) < Math.abs(closest.lambda - peakNm) ? point : closest
    );

    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(peakX, gy);
    ctx.lineTo(peakX, gy + gh);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(peakPoint.x, peakPoint.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const visibleX1 = gx + ((380 - minLambda) / (maxLambda - minLambda)) * gw;
    const visibleX2 = gx + ((750 - minLambda) / (maxLambda - minLambda)) * gw;
    const visGrad = ctx.createLinearGradient(visibleX1, 0, visibleX2, 0);
    visGrad.addColorStop(0, '#4f46e5');
    visGrad.addColorStop(0.2, '#2563eb');
    visGrad.addColorStop(0.4, '#16a34a');
    visGrad.addColorStop(0.65, '#f59e0b');
    visGrad.addColorStop(1, '#ef4444');
    ctx.fillStyle = visGrad;
    ctx.fillRect(visibleX1, gy + gh + 8, Math.max(0, visibleX2 - visibleX1), 10);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `bold ${fs(9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Visible Light', (visibleX1 + visibleX2) / 2, gy + gh + 28);

    ctx.fillStyle = '#64748b';
    ctx.font = `bold ${fs(10)}px sans-serif`;
    ctx.fillText('Wavelength (nm)', gx + gw / 2, gy + gh + 45);

    ctx.save();
    ctx.translate(gx - 18, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Intensity', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#8b5cf6';
    ctx.font = `bold ${fs(11)}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`λ_max = ${peakNm.toFixed(0)} nm`, gx, y + h - pad * 1.2);
    ctx.textAlign = 'right';
    ctx.fillText(`T = ${temperature} K`, x + w - pad * 1.2, y + h - pad * 1.2);
}

function normalizedPlanck(lambdaNm: number, temperature: number) {
    const lambdaM = lambdaNm * 1e-9;
    const c2 = 1.4388e-2;
    const exponent = c2 / (lambdaM * temperature);
    const safeExponent = Math.min(exponent, 700);
    return 1 / (Math.pow(lambdaM, 5) * (Math.exp(safeExponent) - 1));
}

function blackbodyColor(temperature: number) {
    if (temperature < 900) return '#7f1d1d';
    if (temperature < 1500) return '#dc2626';
    if (temperature < 2500) return '#f97316';
    if (temperature < 3500) return '#f59e0b';
    if (temperature < 5000) return '#fde68a';
    return '#f8fafc';
}

function lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

export default HeatTransferBlackbodyLab;
