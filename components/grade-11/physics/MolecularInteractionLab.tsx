import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RotateCcw, Eye, EyeOff, Atom, Droplets, ThermometerSun } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface MolecularInteractionLabProps {
    topic: any;
    onExit: () => void;
}

// ─── Substances ────────────────────────────────────────────────
interface SubstanceProps {
    name: string;
    symbol: string;
    color: string;
    rEquil: number;       // equilibrium distance in Å
    wellDepth: number;     // depth of potential well (relative, e.g. 1.0)
    surfaceTension: number; // N/m (for reference display)
    molRadius: number;     // visual molecular radius in simulation px
}

const SUBSTANCES: Record<string, SubstanceProps> = {
    water: { name: 'Water', symbol: 'H₂O', color: '#3b82f6', rEquil: 2.8, wellDepth: 1.0, surfaceTension: 0.073, molRadius: 14 },
    mercury: { name: 'Mercury', symbol: 'Hg', color: '#8b5cf6', rEquil: 3.0, wellDepth: 2.5, surfaceTension: 0.485, molRadius: 16 },
};

// ─── Lennard-Jones Potential ────────────────────────────────────
// U(r) = 4ε[(σ/r)¹² - (σ/r)⁶]
// F(r) = -dU/dr = 24ε[2(σ/r)¹³ - (σ/r)⁷] / r  (radial, positive = repulsion)
function ljPotential(r: number, rEquil: number, depth: number): number {
    const sigma = rEquil / Math.pow(2, 1 / 6);
    if (r < 0.01) r = 0.01;
    const sr6 = Math.pow(sigma / r, 6);
    const sr12 = sr6 * sr6;
    return 4 * depth * (sr12 - sr6);
}

function ljForce(r: number, rEquil: number, depth: number): number {
    const sigma = rEquil / Math.pow(2, 1 / 6);
    if (r < 0.5) r = 0.5;
    const sr6 = Math.pow(sigma / r, 6);
    const sr12 = sr6 * sr6;
    // F_r = 24ε/r * [2(σ/r)¹² - (σ/r)⁶]
    return (24 * depth / r) * (2 * sr12 - sr6);
}

// ─── Component ──────────────────────────────────────────────────
const MolecularInteractionLab: React.FC<MolecularInteractionLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);

    const [substanceKey, setSubstanceKey] = useState('water');
    const [temperature, setTemperature] = useState(300);
    const [showPEGraph, setShowPEGraph] = useState(true);

    const sRef = useRef({ sub: 'water', T: 300 });

    // Molecule positions for pair interaction (in Å, relative to panel center)
    const pairPosRef = useRef({ ax: -2.0, ay: 0, bx: 2.0, by: 0 });
    const dragRef = useRef<{ which: 'a' | 'b' | null; offsetX: number; offsetY: number }>({ which: null, offsetX: 0, offsetY: 0 });

    // Surface molecules (array of {x, y} positions in panel coords)
    const surfaceMolsRef = useRef<{ x: number; y: number; vx: number; vy: number; isInterior: boolean }[]>([]);

    const frameRef = useRef(0);

    useEffect(() => {
        sRef.current.sub = substanceKey;
        sRef.current.T = temperature;
    }, [substanceKey, temperature]);

    // Initialize surface molecules
    const initSurface = useCallback(() => {
        const mols: { x: number; y: number; vx: number; vy: number; isInterior: boolean }[] = [];
        const spacing = 38;
        const rows = 6;
        const cols = 9;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                mols.push({
                    x: c * spacing + (r % 2 === 1 ? spacing / 2 : 0),
                    y: r * spacing * 0.87,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    isInterior: r > 0, // row 0 is "surface"
                });
            }
        }
        surfaceMolsRef.current = mols;
    }, []);

    useEffect(() => { initSurface(); }, [initSurface]);

    // Canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const ro = new ResizeObserver(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        ro.observe(parent);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        return () => ro.disconnect();
    }, []);

    // ── Mouse/touch drag handling ──
    const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): { mx: number; my: number } => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const cx = (e as React.TouchEvent).touches
            ? (e as React.TouchEvent).touches[0].clientX
            : (e as React.MouseEvent).clientX;
        const cy = (e as React.TouchEvent).touches
            ? (e as React.TouchEvent).touches[0].clientY
            : (e as React.MouseEvent).clientY;
        return { mx: cx - rect.left, my: cy - rect.top };
    };

    // We need to track panel positions for drag detection — stored per frame
    const panelMetaRef = useRef({
        pairPanelX: 0, pairPanelY: 0, pairPanelW: 0, pairPanelH: 0,
        pairCx: 0, pairCy: 0, scaleAx: 0,
    });

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        const { mx, my } = getCanvasCoords(e);
        const meta = panelMetaRef.current;
        const s = SUBSTANCES[sRef.current.sub];
        // Convert pixel to Å
        const pixPerAng = meta.scaleAx;
        const px = meta.pairCx, py = meta.pairCy;

        const pair = pairPosRef.current;
        const ax_px = px + pair.ax * pixPerAng, ay_px = py + pair.ay * pixPerAng;
        const bx_px = px + pair.bx * pixPerAng, by_px = py + pair.by * pixPerAng;

        const dA = Math.sqrt((mx - ax_px) ** 2 + (my - ay_px) ** 2);
        const dB = Math.sqrt((mx - bx_px) ** 2 + (my - by_px) ** 2);

        if (dA < s.molRadius * 2.5) {
            dragRef.current = { which: 'a', offsetX: pair.ax - mx / pixPerAng + px / pixPerAng, offsetY: pair.ay - my / pixPerAng + py / pixPerAng };
        } else if (dB < s.molRadius * 2.5) {
            dragRef.current = { which: 'b', offsetX: pair.bx - mx / pixPerAng + px / pixPerAng, offsetY: pair.by - my / pixPerAng + py / pixPerAng };
        }
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        const d = dragRef.current;
        if (!d.which) return;
        const { mx, my } = getCanvasCoords(e);
        const meta = panelMetaRef.current;
        const pixPerAng = meta.scaleAx;
        const px = meta.pairCx, py = meta.pairCy;

        const angX = (mx - px) / pixPerAng;
        const angY = (my - py) / pixPerAng;

        if (d.which === 'a') {
            pairPosRef.current.ax = angX;
            pairPosRef.current.ay = angY;
        } else {
            pairPosRef.current.bx = angX;
            pairPosRef.current.by = angY;
        }
    };

    const handlePointerUp = () => { dragRef.current.which = null; };

    // ── Main Draw ──
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }

        const s = sRef.current;
        const sub = SUBSTANCES[s.sub];
        frameRef.current++;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

        const titleH = fs(18) + pad * 1.5;
        const contentY = titleH;
        const contentH = H - contentY - pad;

        // ═══════════════════════════════════════════
        // LAYOUT: Left (Pair View) | Right (Surface View + PE Graph)
        // ═══════════════════════════════════════════
        const leftW = W * 0.44;
        const gap = pad * 0.6;
        const rightW = W - leftW - gap - pad * 2;
        const leftX = pad;
        const rightX = leftX + leftW + gap;

        // ═══════════════════════════════════════════
        // LEFT PANEL: PAIR INTERACTION VIEW
        // ═══════════════════════════════════════════
        const pairPanelX = leftX;
        const pairPanelY = contentY;
        const pairPanelW = leftW;
        const pairPanelH = contentH;

        // Panel card
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, pairPanelX, pairPanelY, pairPanelW, pairPanelH, 14); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, pairPanelX, pairPanelY, pairPanelW, pairPanelH, 14); ctx.stroke();

        // Title
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(11)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('PAIR INTERACTION — DRAG MOLECULES', pairPanelX + pairPanelW / 2, pairPanelY + pad * 1.1);

        // Scale: 1 Å = some pixels
        const availableW = pairPanelW - pad * 3;
        const pixPerAng = Math.min(availableW / 14, pairPanelH / 16); // 14 Å range shown
        const pairCx = pairPanelX + pairPanelW / 2;
        const pairCy = pairPanelY + pairPanelH * 0.35;

        // Store for drag detection
        panelMetaRef.current = { pairPanelX, pairPanelY, pairPanelW, pairPanelH, pairCx, pairCy, scaleAx: pixPerAng };

        // Distance axis
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pairPanelX + pad, pairCy);
        ctx.lineTo(pairPanelX + pairPanelW - pad, pairCy);
        ctx.stroke();

        // Å tick marks
        for (let a = -7; a <= 7; a++) {
            const tx = pairCx + a * pixPerAng;
            if (tx < pairPanelX + pad || tx > pairPanelX + pairPanelW - pad) continue;
            const tickH = a % 2 === 0 ? 8 : 4;
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(tx, pairCy - tickH); ctx.lineTo(tx, pairCy + tickH); ctx.stroke();
            if (a % 2 === 0 && a !== 0) {
                ctx.fillStyle = '#94a3b8'; ctx.font = `${fs(9)}px monospace`; ctx.textAlign = 'center';
                ctx.fillText(`${a > 0 ? '+' : ''}${a} Å`, tx, pairCy + tickH + fs(10) + 2);
            }
        }
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(9)}px sans-serif`;
        ctx.fillText('0 (equilibrium)', pairCx, pairCy - 12);

        // ── Draw molecules A and B ──
        const pair = pairPosRef.current;
        const rEquil = sub.rEquil;
        const depth = sub.wellDepth;

        const ax_px = pairCx + pair.ax * pixPerAng;
        const ay_px = pairCy + pair.ay * pixPerAng;
        const bx_px = pairCx + pair.bx * pixPerAng;
        const by_px = pairCy + pair.by * pixPerAng;

        const dx = pair.bx - pair.ax, dy = pair.by - pair.ay;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const forceVal = ljForce(dist, rEquil, depth);
        const potVal = ljPotential(dist, rEquil, depth);

        // Color based on force sign (positive=repulsion=red, negative=attraction=blue)
        const isRepelling = forceVal > 0;
        const forceColor = isRepelling ? '#ef4444' : '#3b82f6';
        const forceLabel = isRepelling ? 'REPULSION' : 'ATTRACTION';
        const forceMag = Math.min(Math.abs(forceVal), 8);

        // Force arrows between molecules
        if (dist > 0.5 && dist < 20) {
            const nx = dx / dist, ny = dy / dist;
            const arrowLen = 20 + forceMag * 12;
            // Arrow from A toward/away from B
            const aArrowDir = isRepelling ? -1 : 1;
            const aEndX = ax_px + nx * aArrowDir * arrowLen;
            const aEndY = ay_px + ny * aArrowDir * arrowLen;
            ctx.strokeStyle = forceColor; ctx.lineWidth = 3 * scale;
            ctx.beginPath(); ctx.moveTo(ax_px, ay_px); ctx.lineTo(aEndX, aEndY); ctx.stroke();
            drawArrowHead(ctx, aEndX, aEndY, Math.atan2(aEndY - ay_px, aEndX - ax_px), 10 * scale, forceColor);

            // Arrow from B toward/away from A
            const bEndX = bx_px - nx * aArrowDir * arrowLen;
            const bEndY = by_px - ny * aArrowDir * arrowLen;
            ctx.beginPath(); ctx.moveTo(bx_px, by_px); ctx.lineTo(bEndX, bEndY); ctx.stroke();
            drawArrowHead(ctx, bEndX, bEndY, Math.atan2(bEndY - by_px, bEndX - bx_px), 10 * scale, forceColor);

            // Label
            ctx.fillStyle = forceColor; ctx.font = `bold ${fs(13)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(forceLabel, (ax_px + bx_px) / 2, (ay_px + by_px) / 2 - 28);
            ctx.font = `bold ${fs(10)}px monospace`;
            ctx.fillText(`F = ${forceVal.toFixed(2)} N`, (ax_px + bx_px) / 2, (ay_px + by_px) / 2 - 12);
        }

        // Molecule A
        drawMolecule(ctx, ax_px, ay_px, sub.molRadius, sub.color, scale);
        ctx.fillStyle = sub.color; ctx.font = `bold ${fs(11)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('A', ax_px, ay_px - sub.molRadius - 8);

        // Molecule B
        drawMolecule(ctx, bx_px, by_px, sub.molRadius, sub.color, scale);
        ctx.fillStyle = sub.color; ctx.fillText('B', bx_px, by_px - sub.molRadius - 8);

        // Distance readout
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(14)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText(`d = ${dist.toFixed(1)} Å`, pairCx, pairPanelY + pairPanelH * 0.62);

        // PE readout
        const peColor = potVal < 0 ? '#16a34a' : '#ef4444';
        ctx.fillStyle = peColor; ctx.font = `bold ${fs(14)}px monospace`;
        ctx.fillText(`U = ${potVal.toFixed(2)} ε`, pairCx, pairPanelY + pairPanelH * 0.69);

        // ── PE Graph (bottom of left panel) ──
        if (showPEGraph) {
            const graphY = pairPanelY + pairPanelH * 0.76;
            const graphH = pairPanelH * 0.22 - pad;
            const graphX = pairPanelX + pad;
            const graphW = pairPanelW - pad * 2;

            ctx.fillStyle = '#f8fafc';
            roundRect(ctx, graphX, graphY, graphW, graphH, 8); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
            roundRect(ctx, graphX, graphY, graphW, graphH, 8); ctx.stroke();

            ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(9)}px sans-serif`; ctx.textAlign = 'left';
            ctx.fillText('POTENTIAL ENERGY U(r)', graphX + 6, graphY + fs(10) + 2);

            // Draw U(r) curve
            const rangeStart = 0.8, rangeEnd = 7;
            const range = rangeEnd - rangeStart;
            const uMax = ljPotential(rangeStart, rEquil, depth);
            const uMin = ljPotential(rEquil, rEquil, depth);
            const uRange = Math.abs(uMin) + Math.abs(uMax);
            const centerY = graphY + graphH * (Math.abs(uMax) / uRange);
            const graphTop = graphY + 16;
            const graphBottom = graphY + graphH - 4;
            const ampH = graphBottom - graphTop;

            // Zero line
            const zeroY = graphTop + (ljPotential(rangeEnd, rEquil, depth) - ljPotential(rangeEnd, rEquil, depth)) > 0 ? graphTop : graphTop + ampH;
            // We need to map U(r) to pixel Y
            const uAtEnd = ljPotential(rangeEnd, rEquil, depth);
            const uAtStart = ljPotential(rangeStart, rEquil, depth);
            const uMaxVal = Math.max(uAtStart, 0);
            const uMinVal = Math.min(uAtStart, uAtEnd, uMin);
            const uTotalRange = uMaxVal - uMinVal || 1;

            // U=0 line
            const zeroPY = graphTop + ampH * (uMaxVal / uTotalRange);

            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.moveTo(graphX, zeroPY); ctx.lineTo(graphX + graphW, zeroPY); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#94a3b8'; ctx.font = `${fs(8)}px sans-serif`; ctx.textAlign = 'right';
            ctx.fillText('U=0', graphX + graphW - 2, zeroPY - 3);

            // Curve
            ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i = 0; i <= 200; i++) {
                const r = rangeStart + (i / 200) * (range - rangeStart);
                const px = graphX + (r - rangeStart) / range * graphW;
                const u = ljPotential(r, rEquil, depth);
                const py = graphTop + ampH * ((uMaxVal - u) / uTotalRange);
                i === 0 ? ctx.moveTo(px, Math.max(graphTop, Math.min(graphBottom, py))) : ctx.lineTo(px, Math.max(graphTop, Math.min(graphBottom, py)));
            }
            ctx.stroke();

            // Current position marker
            if (dist >= rangeStart && dist <= rangeEnd) {
                const markerX = graphX + (dist - rangeStart) / range * graphW;
                const uCur = ljPotential(dist, rEquil, depth);
                const markerY = graphTop + ampH * ((uMaxVal - uCur) / uTotalRange);
                ctx.fillStyle = forceColor;
                ctx.beginPath(); ctx.arc(markerX, Math.max(graphTop, Math.min(graphBottom, markerY)), 5 * scale, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(markerX, Math.max(graphTop, Math.min(graphBottom, markerY)), 5 * scale, 0, Math.PI * 2); ctx.stroke();
            }

            // Labels
            ctx.fillStyle = '#16a34a'; ctx.font = `bold ${fs(9)}px sans-serif`; ctx.textAlign = 'left';
            ctx.fillText('← ATTRACT (U < 0)', graphX + 2, graphTop + ampH + 3);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ef4444';
            ctx.fillText('REPEL (U > 0) →', graphX + graphW - 2, graphTop + 10);
        }

        // ═══════════════════════════════════════════
        // RIGHT PANEL: SURFACE VIEW (top) + INFO (bottom)
        // ═══════════════════════════════════════════
        const surfPanelH = contentH * 0.62;
        const infoPanelH = contentH - surfPanelH - gap;

        // ── Surface View ──
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, rightX, contentY, rightW, surfPanelH, 14); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, rightX, contentY, rightW, surfPanelH, 14); ctx.stroke();

        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(11)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('LIQUID SURFACE — INTERIOR vs SURFACE MOLECULES', rightX + rightW / 2, contentY + pad * 1.1);

        // Air region label
        const airTop = contentY + pad * 1.8;
        const surfLineY = contentY + surfPanelH * 0.38;
        ctx.fillStyle = 'rgba(148,163,184,0.08)';
        ctx.fillRect(rightX + pad, airTop, rightW - pad * 2, surfLineY - airTop);
        ctx.fillStyle = '#94a3b8'; ctx.font = `italic bold ${fs(12)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('AIR (no pull)', rightX + rightW / 2, airTop + (surfLineY - airTop) / 2 + 4);

        // Surface line
        ctx.strokeStyle = sub.color + '60'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(rightX + pad, surfLineY); ctx.lineTo(rightX + rightW - pad, surfLineY); ctx.stroke();
        ctx.fillStyle = sub.color; ctx.font = `bold ${fs(10)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('— Liquid Surface —', rightX + pad + 4, surfLineY - 4);

        // Liquid region bg
        const liquidBot = contentY + surfPanelH - pad * 3;
        ctx.fillStyle = sub.color + '08';
        ctx.fillRect(rightX + pad, surfLineY, rightW - pad * 2, liquidBot - surfLineY);

        // Grid molecules in liquid (3×6 grid of circles, row 0 = surface)
        const molSpacing = Math.min(rightW / 8, 55);
        const molStartX = rightX + rightW / 2 - molSpacing * 3.5;
        const molStartY = surfLineY + molSpacing * 0.5;
        const molR = sub.molRadius * 0.85;
        const nRows = 4, nCols = 8;

        // Thermal vibration
        const tempNorm = Math.max(0, Math.min(1, (s.T - 100) / 900));
        const vibAmp = 1.5 + tempNorm * 4;

        for (let r = 0; r < nRows; r++) {
            for (let c = 0; c < nCols; c++) {
                const baseX = molStartX + c * molSpacing + (r % 2 === 1 ? molSpacing / 2 : 0);
                const baseY = molStartY + r * molSpacing * 0.87;
                const vx = Math.sin(frameRef.current * 0.03 + r * 3 + c * 5) * vibAmp;
                const vy = Math.cos(frameRef.current * 0.04 + r * 5 + c * 3) * vibAmp;
                const mx = baseX + vx, my = baseY + vy;

                // Check bounds
                if (mx < rightX + pad || mx > rightX + rightW - pad || my < surfLineY - 5 || my > liquidBot) continue;

                const isSurf = r === 0;

                // Force vectors for selected molecules
                // Show neighbors and force arrows for a few key positions
                if ((r === 0 && (c === 3 || c === 4 || c === 5)) || (r === 1 && (c === 3 || c === 4))) {
                    // Draw force arrows to neighbors
                    const neighbors = getNeighbors(r, c, nRows, nCols, molStartX, molStartY, molSpacing, vibAmp, frameRef.current, surfLineY - 5, liquidBot);
                    neighbors.forEach(n => {
                        const ddx = n.x - mx, ddy = n.y - my;
                        const ddist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
                        // Map pixel distance to Å (rough: spacing ≈ rEquil)
                        const dAng = ddist / (molSpacing / rEquil);
                        const isRep = dAng < rEquil * 0.9;
                        const arrowCol = isRep ? '#ef444480' : '#3b82f680';

                        ctx.strokeStyle = arrowCol; ctx.lineWidth = 1.5 * scale;
                        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(n.x, n.y); ctx.stroke();
                    });
                }

                // Molecule body
                const highlight = isSurf ? sub.color : sub.color + 'cc';
                const grad = ctx.createRadialGradient(mx - molR * 0.3, my - molR * 0.3, 1, mx, my, molR);
                grad.addColorStop(0, isSurf ? '#fca5a5' : highlight);
                grad.addColorStop(1, isSurf ? '#dc2626' : sub.color);
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(mx, my, molR, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath(); ctx.arc(mx - molR * 0.25, my - molR * 0.25, molR * 0.35, 0, Math.PI * 2); ctx.fill();

                // Label for specific molecules
                if (r === 0 && c === 4) {
                    ctx.fillStyle = '#dc2626'; ctx.font = `bold ${fs(9)}px sans-serif`; ctx.textAlign = 'center';
                    ctx.fillText('SURFACE', mx, my - molR - 6);
                    // Show net inward force
                    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2.5 * scale;
                    const inwardLen = 30 * scale;
                    ctx.beginPath(); ctx.moveTo(mx, my + molR + 2); ctx.lineTo(mx, my + molR + 2 + inwardLen); ctx.stroke();
                    drawArrowHead(ctx, mx, my + molR + 2 + inwardLen, Math.PI / 2, 8 * scale, '#dc2626');
                    ctx.fillStyle = '#dc2626'; ctx.font = `bold ${fs(8)}px sans-serif`;
                    ctx.fillText('NET F', mx + 15, my + molR + 2 + inwardLen / 2 + 3);
                    // Fewer neighbors label
                    ctx.fillStyle = '#f59e0b'; ctx.font = `bold ${fs(9)}px sans-serif`; ctx.textAlign = 'left';
                    ctx.fillText('↑ No neighbors above', mx + molR + 8, my - 4);
                }
                if (r === 1 && c === 4) {
                    ctx.fillStyle = '#16a34a'; ctx.font = `bold ${fs(9)}px sans-serif`; ctx.textAlign = 'center';
                    ctx.fillText('INTERIOR', mx, my - molR - 6);
                    // Show balanced force (small arrows in all 4 directions)
                    const balLen = 14 * scale;
                    ctx.strokeStyle = '#16a34a80'; ctx.lineWidth = 2 * scale;
                    for (let angle = 0; angle < 4; angle++) {
                        const ang = angle * Math.PI / 2;
                        const ax1 = mx + Math.cos(ang) * (molR + 2);
                        const ay1 = my + Math.sin(ang) * (molR + 2);
                        const ax2 = mx + Math.cos(ang) * (molR + 2 + balLen);
                        const ay2 = my + Math.sin(ang) * (molR + 2 + balLen);
                        ctx.beginPath(); ctx.moveTo(ax1, ay1); ctx.lineTo(ax2, ay2); ctx.stroke();
                    }
                    ctx.fillStyle = '#16a34a'; ctx.font = `bold ${fs(8)}px sans-serif`;
                    ctx.fillText('NET F ≈ 0', mx + molR + 8, my + 3);
                }
            }
        }

        // ═══════════════════════════════════════════
        // BOTTOM RIGHT: INFO CARDS
        // ═══════════════════════════════════════════
        const infoY = contentY + surfPanelH + gap;

        // Card: Formulas + Key Insights
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, rightX, infoY, rightW, infoPanelH, 14); ctx.fill();
        ctx.strokeStyle = `${sub.color}40`; ctx.lineWidth = 2;
        roundRect(ctx, rightX, infoY, rightW, infoPanelH, 14); ctx.stroke();

        ctx.fillStyle = sub.color; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('MOLECULAR INTERACTION SUMMARY', rightX + rightW / 2, infoY + pad * 1.2);

        const lines = [
            { text: 'U(r) = 4ε[(σ/r)¹² − (σ/r)⁶]', color: '#0f172a', size: fs(14) },
            { text: `Equilibrium: r₀ = ${rEquil} Å  |  Well depth: ε = ${depth}ε₀`, color: '#475569', size: fs(11) },
            { text: `Surface tension: ${sub.name} = ${sub.surfaceTension} N/m`, color: '#16a34a', size: fs(11) },
            { text: 'l < r₀ → Repulsion (red) | l > r₀ → Attraction (blue)', color: '#64748b', size: fs(10) },
            { text: 'Surface mol = extra PE = surface energy', color: '#d97706', size: fs(11) },
        ];

        lines.forEach((line, i) => {
            const ly = infoY + pad * 2.0 + i * (fs(13) + 10);
            ctx.fillStyle = line.color;
            ctx.font = `bold ${line.size}px ${i === 0 ? 'monospace' : 'sans-serif'}`;
            ctx.textAlign = 'center';
            ctx.fillText(line.text, rightX + rightW / 2, ly);
        });

        // Page title
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(18)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('Molecular Interaction & Surface Tension Lab', pad, titleH * 0.7);

        animRef.current = requestAnimationFrame(draw);
    }, [showPEGraph]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const handleReset = () => {
        setSubstanceKey('water');
        setTemperature(300);
        pairPosRef.current = { ax: -2.0, ay: 0, bx: 2.0, by: 0 };
        sRef.current = { sub: 'water', T: 300 };
    };

    // ── JSX ──
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-contain cursor-grab active:cursor-grabbing"
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-2 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
                {/* Substance Toggle */}
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🧪 Substance</span>
                    </label>
                    <div className="flex gap-2">
                        {Object.entries(SUBSTANCES).map(([key, s]) => (
                            <button
                                key={key}
                                onClick={() => setSubstanceKey(key)}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all border ${
                                    substanceKey === key
                                        ? 'text-white shadow-lg border-transparent'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                                style={substanceKey === key ? { backgroundColor: s.color } : {}}
                            >
                                <div className="text-lg">{s.symbol}</div>
                                <div className="text-[10px] uppercase opacity-80">{s.name}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Temperature */}
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🌡️ Temperature</span>
                        <span className="text-red-700 font-mono text-base md:text-lg bg-red-50 border border-red-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{temperature} K</span>
                    </label>
                    <input type="range" min="100" max="1000" step="50" value={temperature}
                        onChange={e => setTemperature(Number(e.target.value))}
                        className="w-full accent-red-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[9px] md:text-xs font-bold text-slate-400 uppercase">
                        <span>Cold (100 K)</span><span>Hot (1000 K)</span>
                    </div>
                </div>

                {/* Toggle PE Graph */}
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>📊 PE Graph</span>
                    </label>
                    <button
                        onClick={() => setShowPEGraph(!showPEGraph)}
                        className={`w-full py-2.5 md:py-3 rounded-xl font-bold text-sm transition-all border shadow-sm active:scale-95 flex items-center justify-center gap-2 ${
                            showPEGraph
                                ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}>
                        {showPEGraph ? <Eye size={18} /> : <EyeOff size={18} />}
                        {showPEGraph ? 'SHOWING PE GRAPH' : 'HIDE PE GRAPH'}
                    </button>
                </div>
            </div>

            {/* Info strip + Reset */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-between mt-1 md:mt-2">
                <div className="flex gap-4 items-center text-xs font-bold text-slate-400 uppercase bg-slate-50 px-4 py-2 rounded-lg">
                    <span>Drag molecules A & B to interact</span>
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-sm md:text-base shadow-sm active:scale-95">
                    <RotateCcw size={20} /> RESET
                </button>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

// ── Helpers ────────────────────────────────────────────────────
function drawMolecule(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, scale: number) {
    // Glow
    const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.5);
    glow.addColorStop(0, color + '30');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, Math.PI * 2); ctx.fill();

    // Body gradient
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    grad.addColorStop(0, lightenColor(color, 40));
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = darkenColor(color, 30); ctx.lineWidth = 2 * scale;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2); ctx.fill();
}

function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath(); ctx.fill();
}

function lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `rgb(${r},${g},${b})`;
}

function getNeighbors(
    r: number, c: number, nRows: number, nCols: number,
    molStartX: number, molStartY: number, molSpacing: number,
    vibAmp: number, frame: number, topBound: number, botBound: number
): { x: number; y: number }[] {
    const neighbors: { x: number; y: number }[] = [];
    const offsets = r % 2 === 0
        ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
        : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

    offsets.forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < nRows && nc >= 0 && nc < nCols) {
            const nx = molStartX + nc * molSpacing + (nr % 2 === 1 ? molSpacing / 2 : 0) + Math.sin(frame * 0.03 + nr * 3 + nc * 5) * vibAmp;
            const ny = molStartY + nr * molSpacing * 0.87 + Math.cos(frame * 0.04 + nr * 5 + nc * 3) * vibAmp;
            if (ny >= topBound && ny <= botBound) neighbors.push({ x: nx, y: ny });
        }
    });
    return neighbors;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

export default MolecularInteractionLab;
