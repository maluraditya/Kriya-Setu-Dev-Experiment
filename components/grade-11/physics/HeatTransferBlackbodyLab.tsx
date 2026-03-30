import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
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

const STATIONS: { key: Station; label: string; accent: string }[] = [
    { key: 'conduction', label: 'Conduction', accent: '#f97316' },
    { key: 'convection', label: 'Convection', accent: '#06b6d4' },
    { key: 'radiation', label: 'Radiation', accent: '#f43f5e' },
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
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#f8fafc');
        bg.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const scale = W < 1000 ? 1 : (W > 1500 ? 1.25 : 1 + (W - 1000) * 0.0005);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.026, H * 0.04));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 22);

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${fs(20)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('Heat Transfer and Blackbody Radiation Lab', pad, pad * 1.25);

        ctx.fillStyle = '#475569';
        ctx.font = `bold ${fs(11)}px sans-serif`;
        ctx.fillText('Three stations: conduction, convection, and radiation with Wien and Stefan-Boltzmann behavior.', pad, pad * 1.25 + fs(20));

        const topY = pad * 2.6;
        const cardGap = pad * 0.8;
        const cardW = (W - pad * 2 - cardGap * 2) / 3;
        const cardH = Math.min(H * 0.33, 220 * scale);

        STATIONS.forEach((item, index) => {
            const x = pad + index * (cardW + cardGap);
            const y = topY;
            const isActive = activeStation === item.key;
            const cardBg = ctx.createLinearGradient(x, y, x, y + cardH);
            cardBg.addColorStop(0, isActive ? '#ffffff' : '#f8fafc');
            cardBg.addColorStop(1, isActive ? '#f8fafc' : '#eef2f7');
            ctx.fillStyle = cardBg;
            roundRect(ctx, x, y, cardW, cardH, 18);
            ctx.fill();
            ctx.strokeStyle = isActive ? item.accent : '#cbd5e1';
            ctx.lineWidth = isActive ? 3 : 1.5;
            roundRect(ctx, x, y, cardW, cardH, 18);
            ctx.stroke();

            ctx.fillStyle = item.accent;
            ctx.font = `bold ${fs(14)}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(item.label.toUpperCase(), x + pad * 0.7, y + pad * 1.1);

            if (item.key === 'conduction') {
                drawConductionCard(ctx, { x, y, w: cardW, h: cardH, pad, fs, time, temperature: T, materialColor: materialData.color, rate: conductionRate });
            } else if (item.key === 'convection') {
                drawConvectionCard(ctx, { x, y, w: cardW, h: cardH, pad, fs, time, temperature: T, strength: convectionStrength, environment: environmentKey });
            } else {
                drawRadiationCard(ctx, { x, y, w: cardW, h: cardH, pad, fs, temperature: T, power: radiationPower, peakNm });
            }
        });

        const bottomY = topY + cardH + pad;
        const detailW = W * 0.37;
        const graphX = pad + detailW + pad;
        const graphW = W - graphX - pad;
        const bottomH = H - bottomY - pad;

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, pad, bottomY, detailW, bottomH, 18);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        roundRect(ctx, pad, bottomY, detailW, bottomH, 18);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${fs(16)}px sans-serif`;
        ctx.fillText(`${activeStation.toUpperCase()} STATION`, pad + pad * 0.8, bottomY + pad * 1.1);

        const detailLines = getDetailLines(activeStation, {
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

        ctx.font = `bold ${fs(12)}px sans-serif`;
        ctx.fillStyle = '#475569';
        detailLines.forEach((line, index) => {
            drawWrappedText(ctx, line, pad + pad * 0.8, bottomY + pad * 2 + index * (fs(12) * 1.6), detailW - pad * 1.6, fs(12) * 1.45);
        });

        const metricY = bottomY + bottomH - pad * 3.8;
        const metricW = detailW - pad * 1.6;
        const metricX = pad + pad * 0.8;
        const metricH = pad * 1.9;

        const metrics = [
            { label: 'Heat Flow', value: `${conductionRate.toFixed(1)} W`, color: '#f97316' },
            { label: 'Convection', value: environmentKey === 'vacuum' ? '0.00' : convectionStrength.toFixed(2), color: '#06b6d4' },
            { label: 'Peak lambda', value: `${peakNm.toFixed(0)} nm`, color: '#f43f5e' },
        ];

        metrics.forEach((metric, index) => {
            const boxY = metricY + index * (metricH + 10);
            ctx.fillStyle = '#f8fafc';
            roundRect(ctx, metricX, boxY, metricW, metricH, 12);
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.stroke();
            ctx.fillStyle = metric.color;
            ctx.font = `bold ${fs(11)}px sans-serif`;
            ctx.fillText(metric.label.toUpperCase(), metricX + 14, boxY + metricH * 0.42);
            ctx.fillStyle = '#0f172a';
            ctx.font = `bold ${fs(16)}px monospace`;
            ctx.textAlign = 'right';
            ctx.fillText(metric.value, metricX + metricW - 14, boxY + metricH * 0.66);
            ctx.textAlign = 'left';
        });

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, graphX, bottomY, graphW, bottomH, 18);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        roundRect(ctx, graphX, bottomY, graphW, bottomH, 18);
        ctx.stroke();

        if (activeStation === 'conduction') {
            drawConductionGraph(ctx, { x: graphX, y: bottomY, w: graphW, h: bottomH, pad, fs, currentArea: area, lengthM: length, materialK: materialData.k, deltaT });
        } else if (activeStation === 'convection') {
            drawConvectionGraph(ctx, { x: graphX, y: bottomY, w: graphW, h: bottomH, pad, fs, selected: environmentKey, deltaT, areaCm2: area, lengthM: length });
        } else {
            drawSpectrumGraph(ctx, { x: graphX, y: bottomY, w: graphW, h: bottomH, pad, fs, temperature: T, peakNm });
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
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[320px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const conductionRate = MATERIALS[material].k * (areaCm2 * 1e-4) * Math.max(temperature - AMBIENT_TEMPERATURE, 0) / Math.max(lengthM, 0.2);
    const convectionStrength = environment === 'vacuum' ? 0 : ENVIRONMENTS[environment].factor * (Math.max(temperature - AMBIENT_TEMPERATURE, 0) / 300) * Math.sqrt(areaCm2 / Math.max(lengthM, 0.2));
    const radiationPower = SIGMA * (areaCm2 * 1e-4) * Math.pow(temperature, 4);
    const peakNm = WIEN_CONSTANT_NM_K / temperature;

    const controlsCombo = (
        <div className="flex flex-col gap-3 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            <div className="grid grid-cols-3 gap-2 md:gap-3">
                {STATIONS.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setStation(item.key)}
                        className={`p-2 md:p-4 rounded-xl border-2 font-bold text-xs md:text-sm transition-all shadow-sm active:scale-95 ${
                            station === item.key ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                        style={station === item.key ? { backgroundColor: item.accent } : {}}
                    >
                        {item.label.toUpperCase()}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <StatCard label="Heat Flow" value={`${conductionRate.toFixed(1)} W`} color="text-orange-600" />
                <StatCard label="Convection" value={environment === 'vacuum' ? '0.00' : convectionStrength.toFixed(2)} color="text-cyan-600" />
                <StatCard label="Radiation" value={`${radiationPower.toFixed(1)} W`} color="text-rose-600" />
                <StatCard label="Peak lambda" value={`${peakNm.toFixed(0)} nm`} color="text-fuchsia-600" />
            </div>

            <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
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
                    <SliderRow label="Area" valueLabel={`${areaCm2.toFixed(1)} cm^2`} minLabel="1 cm^2" maxLabel="8 cm^2">
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
                </div>

                <div className="space-y-4 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
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
    <div className="bg-white rounded-xl p-2 md:p-4 text-center border border-slate-200 shadow-sm">
        <div className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">{label}</div>
        <div className={`text-sm md:text-xl font-bold font-mono tracking-tight ${color}`}>{value}</div>
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

function getDetailLines(
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
) {
    if (station === 'conduction') {
        return [
            'Heat flows through adjacent particles without any bulk motion of matter.',
            `Using ${values.materialLabel}, the rod conducts at H = k A Delta T / L with area ${values.areaCm2.toFixed(1)} cm^2 and length ${values.lengthM.toFixed(2)} m.`,
            `A larger cross-section raises the heat flow, while a longer rod reduces it. Current temperature difference: ${values.deltaT.toFixed(0)} K.`,
            'This station is strongest for good conductors such as copper and weakest for poor conductors such as glass.',
        ];
    }

    if (station === 'convection') {
        return [
            'Convection transfers energy through the actual motion of fluid layers.',
            `The surrounding medium is ${values.environmentLabel}. Hot fluid near the heater becomes less dense and rises while cooler fluid sinks.`,
            values.environmentLabel === 'Vacuum'
                ? 'In vacuum, convection stops because there is no fluid to circulate.'
                : `The circulation strength grows as Delta T increases. The current relative flow index is ${values.convectionStrength.toFixed(2)}.`,
            'This explains sea breeze, room heating, and boiling water currents.',
        ];
    }

    return [
        'Radiation transfers energy through electromagnetic waves and does not require any material medium.',
        `At ${values.temperature} K, the blackbody emits approximately ${values.radiationPower.toFixed(1)} W from the selected area.`,
        `Wien predicts lambda_max = 2.9 x 10^6 / T, so the peak is near ${values.peakNm.toFixed(0)} nm.`,
        'As temperature rises, total power climbs rapidly with T^4 and the peak shifts toward shorter wavelengths.',
    ];
}

function drawConductionCard(
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
    const rodX = x + pad * 0.8;
    const rodY = y + h * 0.45;
    const rodW = w - pad * 1.6;
    const rodH = Math.max(22, h * 0.14);

    const grad = ctx.createLinearGradient(rodX, 0, rodX + rodW, 0);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.5, materialColor);
    grad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = grad;
    roundRect(ctx, rodX, rodY, rodW, rodH, 10);
    ctx.fill();

    const pulseCount = 8;
    const speed = Math.min(rate / 40, 4);
    for (let i = 0; i < pulseCount; i++) {
        const offset = ((time * speed + i / pulseCount) % 1) * rodW;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(rodX + offset, rodY + rodH / 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#475569';
    ctx.font = `bold ${fs(11)}px sans-serif`;
    ctx.fillText(`Hot end: ${temperature} K`, rodX, rodY - 12);
    ctx.textAlign = 'right';
    ctx.fillText('Cold end: 300 K', rodX + rodW, rodY + rodH + 24);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#f97316';
    ctx.font = `bold ${fs(15)}px monospace`;
    ctx.fillText(`${rate.toFixed(1)} W`, rodX, y + h - pad * 1.2);
}

function drawConvectionCard(
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
    const tankX = x + w * 0.22;
    const tankY = y + h * 0.23;
    const tankW = w * 0.56;
    const tankH = h * 0.5;

    ctx.fillStyle = environment === 'vacuum' ? '#0f172a' : 'rgba(14, 165, 233, 0.18)';
    roundRect(ctx, tankX, tankY, tankW, tankH, 14);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    roundRect(ctx, tankX, tankY, tankW, tankH, 14);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(tankX + tankW * 0.3, tankY + tankH - 10, tankW * 0.4, 10);

    if (environment !== 'vacuum') {
        const loopAmp = Math.max(8, Math.min(22, strength * 10));
        for (let i = 0; i < 12; i++) {
            const t = time * (0.8 + strength * 0.4) + i * 0.4;
            const leftRise = ((t % 1) * tankH);
            const rightFall = (((t + 0.5) % 1) * tankH);

            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath();
            ctx.arc(tankX + tankW * 0.35 + Math.sin(t * 6.2) * loopAmp * 0.12, tankY + tankH - leftRise, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tankX + tankW * 0.65 + Math.sin((t + 1.2) * 6.2) * loopAmp * 0.12, tankY + rightFall, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.fillStyle = '#06b6d4';
    ctx.font = `bold ${fs(15)}px monospace`;
    ctx.fillText(environment === 'vacuum' ? 'No flow' : `${strength.toFixed(2)} flow`, x + pad * 0.8, y + h - pad * 1.2);
    ctx.fillStyle = '#475569';
    ctx.font = `bold ${fs(11)}px sans-serif`;
    ctx.fillText(`${temperature} K heater`, x + pad * 0.8, tankY - 10);
}

function drawRadiationCard(
    ctx: CanvasRenderingContext2D,
    params: {
        x: number;
        y: number;
        w: number;
        h: number;
        pad: number;
        fs: (base: number) => number;
        temperature: number;
        power: number;
        peakNm: number;
    }
) {
    const { x, y, w, h, pad, fs, temperature, power, peakNm } = params;
    const cx = x + w * 0.5;
    const cy = y + h * 0.52;
    const radius = Math.min(w, h) * 0.14;
    const glowColor = blackbodyColor(temperature);

    ctx.fillStyle = '#0f172a';
    roundRect(ctx, x + pad * 0.8, y + h * 0.2, w - pad * 1.6, h * 0.5, 16);
    ctx.fill();

    for (let i = 3; i >= 1; i--) {
        ctx.fillStyle = `${glowColor}${Math.round((0.08 + i * 0.05) * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + i * 14, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f43f5e';
    ctx.font = `bold ${fs(15)}px monospace`;
    ctx.fillText(`${power.toFixed(1)} W`, x + pad * 0.8, y + h - pad * 1.2);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold ${fs(11)}px sans-serif`;
    ctx.fillText(`peak: ${peakNm.toFixed(0)} nm`, x + pad * 0.8, y + h * 0.34);
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
    const titleY = y + pad * 1.1;
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(16)}px sans-serif`;
    ctx.fillText('Conduction Law: H proportional to A / L', x + pad * 0.8, titleY);

    const gx = x + pad * 1.2;
    const gy = y + pad * 2.2;
    const gw = w - pad * 2.1;
    const gh = h - pad * 3.5;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = `bold ${fs(11)}px sans-serif`;
    ctx.fillText('Area (cm^2)', gx + gw / 2 - 30, gy + gh + 28);
    ctx.save();
    ctx.translate(gx - 36, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Heat Flow (W)', 0, 0);
    ctx.restore();

    const maxArea = 8;
    const maxFlow = Math.max(1, materialK * 8e-4 * Math.max(deltaT, 1) / Math.max(lengthM, 0.2));
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let a = 1; a <= maxArea; a += 0.25) {
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
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.font = `bold ${fs(12)}px monospace`;
    ctx.fillText(`A = ${currentArea.toFixed(1)} cm^2`, gx, y + h - pad * 0.9);
    ctx.textAlign = 'right';
    ctx.fillText(`H = ${currentFlow.toFixed(1)} W`, x + w - pad * 0.8, y + h - pad * 0.9);
    ctx.textAlign = 'left';
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
    ctx.font = `bold ${fs(16)}px sans-serif`;
    ctx.fillText('Convection Strength by Medium', x + pad * 0.8, y + pad * 1.1);

    const chartX = x + pad * 1.4;
    const chartY = y + pad * 2.1;
    const chartW = w - pad * 2.2;
    const chartH = h - pad * 3.4;
    const baseY = chartY + chartH;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, baseY);
    ctx.lineTo(chartX + chartW, baseY);
    ctx.stroke();

    const order: EnvironmentKey[] = ['air', 'water', 'vacuum'];
    const barW = chartW / 5;
    const maxValue = Math.max(1, ...order.map((key) => ENVIRONMENTS[key].factor * (deltaT / 300) * Math.sqrt(areaCm2 / Math.max(lengthM, 0.2))));

    order.forEach((key, index) => {
        const value = key === 'vacuum' ? 0 : ENVIRONMENTS[key].factor * (deltaT / 300) * Math.sqrt(areaCm2 / Math.max(lengthM, 0.2));
        const barH = maxValue === 0 ? 0 : (value / maxValue) * (chartH - 30);
        const bx = chartX + (index * 1.5 + 0.7) * barW;
        const by = baseY - barH;

        ctx.fillStyle = key === selected ? ENVIRONMENTS[key].color : 'rgba(148, 163, 184, 0.65)';
        roundRect(ctx, bx, by, barW * 0.8, barH, 10);
        ctx.fill();

        ctx.fillStyle = '#475569';
        ctx.font = `bold ${fs(11)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ENVIRONMENTS[key].label, bx + barW * 0.4, baseY + 22);
        ctx.fillStyle = key === selected ? '#0f172a' : '#64748b';
        ctx.font = `bold ${fs(12)}px monospace`;
        ctx.fillText(value.toFixed(2), bx + barW * 0.4, by - 8);
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
    ctx.font = `bold ${fs(16)}px sans-serif`;
    ctx.fillText('Blackbody Spectrum', x + pad * 0.8, y + pad * 1.1);

    const gx = x + pad * 1.2;
    const gy = y + pad * 2.1;
    const gw = w - pad * 2.1;
    const gh = h - pad * 3.3;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();

    const minLambda = 200;
    const maxLambda = 2500;
    const samples = 100;
    const points: { x: number; y: number; lambda: number; intensity: number }[] = [];
    let maxI = 0;

    for (let i = 0; i <= samples; i++) {
        const lambda = minLambda + (i / samples) * (maxLambda - minLambda);
        const intensity = normalizedPlanck(lambda, temperature);
        maxI = Math.max(maxI, intensity);
        points.push({ x: 0, y: 0, lambda, intensity });
    }

    ctx.lineWidth = 4;
    ctx.beginPath();
    points.forEach((point, index) => {
        const px = gx + ((point.lambda - minLambda) / (maxLambda - minLambda)) * gw;
        const py = gy + gh - (point.intensity / maxI) * (gh - 10);
        point.x = px;
        point.y = py;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = '#f43f5e';
    ctx.stroke();

    const peakX = gx + ((peakNm - minLambda) / (maxLambda - minLambda)) * gw;
    const peakPoint = points.reduce((closest, point) =>
        Math.abs(point.lambda - peakNm) < Math.abs(closest.lambda - peakNm) ? point : closest
    );

    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(peakX, gy);
    ctx.lineTo(peakX, gy + gh);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(peakPoint.x, peakPoint.y, 7, 0, Math.PI * 2);
    ctx.fill();

    const visibleX1 = gx + ((380 - minLambda) / (maxLambda - minLambda)) * gw;
    const visibleX2 = gx + ((750 - minLambda) / (maxLambda - minLambda)) * gw;
    const visGrad = ctx.createLinearGradient(visibleX1, 0, visibleX2, 0);
    visGrad.addColorStop(0, '#4f46e5');
    visGrad.addColorStop(0.2, '#2563eb');
    visGrad.addColorStop(0.4, '#16a34a');
    visGrad.addColorStop(0.65, '#f59e0b');
    visGrad.addColorStop(1, '#ef4444');
    ctx.fillStyle = visGrad;
    ctx.fillRect(visibleX1, gy + gh + 14, Math.max(0, visibleX2 - visibleX1), 8);

    ctx.fillStyle = '#64748b';
    ctx.font = `bold ${fs(11)}px sans-serif`;
    ctx.fillText('Wavelength (nm)', gx + gw / 2 - 40, gy + gh + 36);
    ctx.save();
    ctx.translate(gx - 34, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Relative Intensity', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#7c3aed';
    ctx.font = `bold ${fs(12)}px monospace`;
    ctx.fillText(`lambda_max = ${peakNm.toFixed(0)} nm`, gx, y + h - pad * 0.9);
    ctx.textAlign = 'right';
    ctx.fillText(`T = ${temperature} K`, x + w - pad * 0.8, y + h - pad * 0.9);
    ctx.textAlign = 'left';
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

function drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
) {
    const words = text.split(' ');
    let line = '';
    let row = 0;
    for (let i = 0; i < words.length; i++) {
        const test = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(line, x, y + row * lineHeight);
            line = words[i];
            row += 1;
        } else {
            line = test;
        }
    }
    if (line) ctx.fillText(line, x, y + row * lineHeight);
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
