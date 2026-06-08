// Copyright (c) 2026, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0

import type { RenderProps } from '@anywidget/types';
import { NetworkAreaDiagramViewer } from '@powsybl/network-viewer';
import './comparatorwidget.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
const INJECTION_BAR_WIDTH = 160;
const INJECTION_BAR_HEIGHT = 6;
const INJECTION_H_MARGIN_LEFT = 8;
const INJECTION_H_MARGIN_RIGHT = 20;
const INJECTION_LABEL_FONT_SIZE = 9;
const POPUP_SCALE_BASE = 1.8;

// data structures for data coming from Python
interface VlGeneratorInjection {
    id: string;
    p: number;
    u_min: number | null;
    u_max: number | null;
    pmin: number;
    pmax: number;
    sfcc_pct: number | null;
}

interface VlLoadInjection {
    id: string;
    p: number;
    u_min: number;
    u_max: number;
}

interface VlInjectionData {
    generators: VlGeneratorInjection[];
    loads: VlLoadInjection[];
}

interface VlGeneratorDelta {
    id: string;
    p_n1: number;
    p_n2: number;
    delta: number;
    pmin: number;
    pmax: number;
}

interface VlDeltaData {
    generators: VlGeneratorDelta[];
}

interface DiagramData {
    svg_data: string;
    metadata: string | null;
    injection_data?: Record<string, VlInjectionData>;
    delta_data?: Record<string, VlDeltaData>;
}

// internal interfaces and types
interface ComparatorWidgetModel {
    diagrams: DiagramData[];
    synchronized: boolean;
    width: number | null;
    height: number | null;
    display_buttons: boolean;
    popup_scale: number;
    uncertainty_discs: boolean;
    uncertainty_disc_scale: number;
    uncertainty_disc_offset_scale: number;
    sfcc_discs: boolean;
    sfcc_disc_scale: number;
    delta_discs: boolean;
    delta_disc_scale: number;
    delta_disc_offset_scale: number;
    show_markers: boolean;
    animate_discs: boolean;
}

type InjectionDetail =
    | {
          kind: 'GEN';
          id: string;
          p: number;
          u_min: number | null;
          u_max: number | null;
          pmin: number;
          pmax: number;
          sfcc: number | null;
      }
    | {
          kind: 'LOAD';
          id: string;
          p: number;
          u_min: number;
          u_max: number;
      };

type HoverCb = (
    hovered: boolean,
    mousePos: { x: number; y: number } | null,
    equipmentId: string,
    equipmentType: string
) => void;

function fmtNumber(v: number): string {
    if (!Number.isFinite(v)) return String(v);
    return Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1);
}

function getDomainInjectionInterval(u: InjectionDetail): [number, number] {
    if (u.kind === 'GEN') {
        const u_min_d = u.u_min === null ? Math.min(u.pmin, u.p) : Math.min(u.pmin, u.u_min, u.p);
        const u_max_d = u.u_max === null ? Math.max(u.pmax, u.p) : Math.max(u.pmax, u.u_max, u.p);
        return [u_min_d, u_max_d];
    }
    return [u.u_min, u.u_max];
}

function makeSvgText(x: number, y: number, anchor: string, cls: string, value: string): SVGTextElement {
    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('text-anchor', anchor);
    t.setAttribute('class', cls);
    t.textContent = value;
    return t;
}

function buildInjectionRow(u: InjectionDetail, popupScale: number = 1): HTMLElement {
    const [u_min_d, u_max_d] = getDomainInjectionInterval(u);
    const span = u_max_d - u_min_d || 1;
    const scale = (v: number) => ((v - u_min_d) / span) * INJECTION_BAR_WIDTH;
    const effectiveScale = popupScale * POPUP_SCALE_BASE;

    const row = document.createElement('div');
    row.classList.add('inj-bar-row', u.kind === 'GEN' ? 'gen' : 'load');

    const barTop = 2;
    const barMid = barTop + INJECTION_BAR_HEIGHT / 2;
    const textY = 13;
    const svgHeight = 19;
    const viewBoxW = INJECTION_BAR_WIDTH + INJECTION_H_MARGIN_LEFT + INJECTION_H_MARGIN_RIGHT;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'inj-bar-svg');
    svg.setAttribute('width', String(viewBoxW * effectiveScale));
    svg.setAttribute('height', String(svgHeight * effectiveScale));
    svg.setAttribute('viewBox', `${-INJECTION_H_MARGIN_LEFT} 0 ${viewBoxW} ${svgHeight}`);

    if (u.kind === 'GEN') {
        const range = document.createElementNS(SVG_NS, 'rect');
        range.setAttribute('class', 'inj-bar-range');
        range.setAttribute('x', String(scale(u.pmin)));
        range.setAttribute('y', String(barTop));
        range.setAttribute('width', String(Math.max(scale(u.pmax) - scale(u.pmin), 1)));
        range.setAttribute('height', String(INJECTION_BAR_HEIGHT));
        svg.appendChild(range);
    }

    const u_min: number | null = u.u_min;
    const u_max: number | null = u.u_max;
    const hasInterval = u_min !== null && u_max !== null;

    if (hasInterval) {
        const band = document.createElementNS(SVG_NS, 'rect');
        band.setAttribute('class', 'inj-bar-band');
        band.setAttribute('x', String(scale(u_min)));
        band.setAttribute('y', String(barTop));
        band.setAttribute('width', String(Math.max(scale(u_max) - scale(u_min), 1)));
        band.setAttribute('height', String(INJECTION_BAR_HEIGHT));
        svg.appendChild(band);
    }

    const marker = document.createElementNS(SVG_NS, 'line');
    marker.setAttribute('class', 'inj-bar-marker');
    const markerP = Math.max(u_min_d, Math.min(u_max_d, u.p));
    const markerX = scale(markerP);
    marker.setAttribute('x1', String(markerX));
    marker.setAttribute('x2', String(markerX));
    marker.setAttribute('y1', String(barTop - 1));
    marker.setAttribute('y2', String(barTop + INJECTION_BAR_HEIGHT + 1));
    svg.appendChild(marker);

    if (hasInterval) {
        svg.appendChild(makeSvgText(scale(u_min), textY, 'end', 'inj-bar-num', fmtNumber(u_min)));
    }
    svg.appendChild(makeSvgText(markerX, textY, 'middle', 'inj-bar-num inj-bar-num-p', fmtNumber(u.p)));
    if (hasInterval) {
        svg.appendChild(makeSvgText(scale(u_max), textY, 'start', 'inj-bar-num', fmtNumber(u_max)));
    }

    if (u.kind === 'GEN') {
        svg.appendChild(makeSvgText(scale(u.pmin), barMid, 'end', 'inj-bar-num inj-bar-num-ext', fmtNumber(u.pmin)));
        svg.appendChild(makeSvgText(scale(u.pmax), barMid, 'start', 'inj-bar-num inj-bar-num-ext', fmtNumber(u.pmax)));

        if (u.sfcc !== null && Number.isFinite(u.sfcc) && u.pmax > u.pmin) {
            const sfccX = scale(u.pmin + ((u.pmax - u.pmin) * u.sfcc) / 100);
            const sfccLine = document.createElementNS(SVG_NS, 'line');
            sfccLine.setAttribute('class', 'inj-bar-marker-sfcc');
            sfccLine.setAttribute('x1', String(sfccX));
            sfccLine.setAttribute('x2', String(sfccX));
            sfccLine.setAttribute('y1', String(barTop - 1));
            sfccLine.setAttribute('y2', String(barTop + INJECTION_BAR_HEIGHT + 1));
            svg.appendChild(sfccLine);
            svg.appendChild(
                makeSvgText(sfccX, textY, 'middle', 'inj-bar-num inj-bar-num-sfcc', fmtNumber(u.sfcc) + '%')
            );
        }
    }

    const label = document.createElement('span');
    label.classList.add('inj-bar-label');
    label.style.fontSize = `${INJECTION_LABEL_FONT_SIZE * effectiveScale}px`;
    label.textContent = `${u.id}`;

    row.appendChild(svg);
    row.appendChild(label);

    return row;
}

function buildGenDiffRow(gd: VlGeneratorDelta, popupScale: number = 1): HTMLElement {
    const uMin = Math.min(gd.pmin, gd.p_n1, gd.p_n2);
    const uMax = Math.max(gd.pmax, gd.p_n1, gd.p_n2);
    const span = uMax - uMin || 1;
    const scale = (v: number) => ((v - uMin) / span) * INJECTION_BAR_WIDTH;
    const effectiveScale = popupScale * POPUP_SCALE_BASE;

    const row = document.createElement('div');
    row.classList.add('inj-bar-row', 'gen-diff');

    const barTop = 6;
    const barMid = barTop + INJECTION_BAR_HEIGHT / 2;
    const textY = 17;
    const triangleH = 4;
    const svgHeight = 23;
    const viewBoxW = INJECTION_BAR_WIDTH + INJECTION_H_MARGIN_LEFT + INJECTION_H_MARGIN_RIGHT;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'inj-bar-svg');
    svg.setAttribute('width', String(viewBoxW * effectiveScale));
    svg.setAttribute('height', String(svgHeight * effectiveScale));
    svg.setAttribute('viewBox', `${-INJECTION_H_MARGIN_LEFT} 0 ${viewBoxW} ${svgHeight}`);

    // background bar
    const range = document.createElementNS(SVG_NS, 'rect');
    range.setAttribute('class', 'inj-bar-range');
    range.setAttribute('x', String(scale(gd.pmin)));
    range.setAttribute('y', String(barTop));
    range.setAttribute('width', String(Math.max(scale(gd.pmax) - scale(gd.pmin), 1)));
    range.setAttribute('height', String(INJECTION_BAR_HEIGHT));
    svg.appendChild(range);

    // colored delta bar
    const bandLeft = Math.min(gd.p_n1, gd.p_n2);
    const bandRight = Math.max(gd.p_n1, gd.p_n2);
    if (bandRight > bandLeft) {
        const band = document.createElementNS(SVG_NS, 'rect');
        band.setAttribute('class', gd.delta >= 0 ? 'inj-bar-band-diff-pos' : 'inj-bar-band-diff-neg');
        band.setAttribute('x', String(scale(bandLeft)));
        band.setAttribute('y', String(barTop));
        band.setAttribute('width', String(Math.max(scale(bandRight) - scale(bandLeft), 1)));
        band.setAttribute('height', String(INJECTION_BAR_HEIGHT));
        svg.appendChild(band);
    }

    // p_n1 reference marker (vertical segment)
    const x_n1 = scale(Math.max(uMin, Math.min(uMax, gd.p_n1)));
    const markerN1 = document.createElementNS(SVG_NS, 'line');
    markerN1.setAttribute('class', 'inj-bar-marker');
    markerN1.setAttribute('x1', String(x_n1));
    markerN1.setAttribute('x2', String(x_n1));
    markerN1.setAttribute('y1', String(barTop - 1));
    markerN1.setAttribute('y2', String(barTop + INJECTION_BAR_HEIGHT + 1));
    svg.appendChild(markerN1);

    // p_n2 marker (triangle)
    const x_n2 = scale(Math.max(uMin, Math.min(uMax, gd.p_n2)));
    const triangle = document.createElementNS(SVG_NS, 'polygon');
    triangle.setAttribute('class', 'inj-bar-marker-n2');
    triangle.setAttribute(
        'points',
        `${x_n2},${barTop} ${x_n2 - triangleH},${barTop - triangleH} ${x_n2 + triangleH},${barTop - triangleH}`
    );
    svg.appendChild(triangle);

    svg.appendChild(makeSvgText(x_n1, textY, 'middle', 'inj-bar-num inj-bar-num-p', fmtNumber(gd.p_n1)));
    svg.appendChild(makeSvgText(x_n2, textY, 'middle', 'inj-bar-num inj-bar-num-n2', fmtNumber(gd.p_n2)));
    svg.appendChild(makeSvgText(scale(gd.pmin), barMid, 'end', 'inj-bar-num inj-bar-num-ext', fmtNumber(gd.pmin)));
    svg.appendChild(makeSvgText(scale(gd.pmax), barMid, 'start', 'inj-bar-num inj-bar-num-ext', fmtNumber(gd.pmax)));

    const label = document.createElement('span');
    label.classList.add('inj-bar-label');
    label.style.fontSize = `${INJECTION_LABEL_FONT_SIZE * effectiveScale}px`;
    const nameNode = document.createTextNode(gd.id);
    label.appendChild(nameNode);

    row.appendChild(svg);
    row.appendChild(label);

    return row;
}

function updateDiscPosition(innerSvg: SVGElement, equipmentId: string, x: number, y: number): void {
    const discGroup = innerSvg.querySelector('g.comparator-discs');
    if (!discGroup) return;
    discGroup.querySelectorAll('circle').forEach((circle) => {
        if (circle.getAttribute('data-equipment-id') !== equipmentId) return;
        const offsetX = parseFloat(circle.getAttribute('data-offset-x') ?? '0');
        circle.setAttribute('cx', String(x + offsetX));
        circle.setAttribute('cy', String(y));
    });
    // move optional marker used for emphasis
    discGroup.querySelectorAll('[data-vl-bracket]').forEach((g) => {
        if (g.getAttribute('data-equipment-id') !== equipmentId) return;
        g.setAttribute('transform', `translate(${x}, ${y})`);
    });
}

const DISC_MAX_FRACTION = 0.15;
const DISC_RADIUS_MIN = 4;
const DISC_SFCC_RADIUS_MIN_FRACTION = 0.15;

interface DiscAggregation {
    nodeMap: Map<string, { x: number; y: number }>;
    networkDiagonal: number;
    vlGenUncertainty: Map<string, number>;
    vlLoadUncertainty: Map<string, number>;
    vlSfccMw: Map<string, number>;
    vlDeltaPos: Map<string, number>;
    vlDeltaNeg: Map<string, number>;
}

// aggregate data from injection/delta input data, per VL
function aggregateDiscData(
    viewer: NetworkAreaDiagramViewer,
    diagramEntry: DiagramData,
    uncertainty_discs: boolean,
    sfcc_discs: boolean,
    delta_discs: boolean
): DiscAggregation {
    const metadata = viewer.diagramMetadata;
    const nodeMap = new Map<string, { x: number; y: number }>();
    const vlGenUncertainty = new Map<string, number>();
    const vlLoadUncertainty = new Map<string, number>();
    const vlSfccMw = new Map<string, number>();
    const vlDeltaPos = new Map<string, number>();
    const vlDeltaNeg = new Map<string, number>();
    let networkDiagonal = 200;

    if (!metadata)
        return {
            nodeMap,
            networkDiagonal,
            vlGenUncertainty,
            vlLoadUncertainty,
            vlSfccMw,
            vlDeltaPos,
            vlDeltaNeg,
        };

    let xMin = Infinity,
        xMax = -Infinity,
        yMin = Infinity,
        yMax = -Infinity;
    for (const node of metadata.nodes) {
        nodeMap.set(node.equipmentId, { x: node.x, y: node.y });
        if (node.x < xMin) xMin = node.x;
        if (node.x > xMax) xMax = node.x;
        if (node.y < yMin) yMin = node.y;
        if (node.y > yMax) yMax = node.y;
    }
    networkDiagonal = Math.max(Math.hypot(xMax - xMin, yMax - yMin), 200);

    // injection data (uncertainty, sfcc)
    if ((uncertainty_discs || sfcc_discs) && diagramEntry.injection_data) {
        for (const [vlId, vlData] of Object.entries(diagramEntry.injection_data)) {
            if (uncertainty_discs) {
                for (const gen of vlData.generators) {
                    if (
                        gen.u_min !== null &&
                        gen.u_max !== null &&
                        Number.isFinite(gen.u_min) &&
                        Number.isFinite(gen.u_max)
                    ) {
                        vlGenUncertainty.set(
                            vlId,
                            (vlGenUncertainty.get(vlId) ?? 0) + Math.max(0, gen.u_max - gen.u_min)
                        );
                    }
                }
                for (const load of vlData.loads) {
                    vlLoadUncertainty.set(
                        vlId,
                        (vlLoadUncertainty.get(vlId) ?? 0) + Math.max(0, load.u_max - load.u_min)
                    );
                }
            }
            if (sfcc_discs) {
                for (const gen of vlData.generators) {
                    if (gen.sfcc_pct !== null && Number.isFinite(gen.sfcc_pct) && gen.pmax > gen.pmin) {
                        vlSfccMw.set(
                            vlId,
                            (vlSfccMw.get(vlId) ?? 0) + Math.max(0, (gen.sfcc_pct / 100) * (gen.pmax - gen.pmin))
                        );
                    }
                }
            }
        }
    }

    // delta data
    if (delta_discs && diagramEntry.delta_data) {
        for (const [vlId, vlData] of Object.entries(diagramEntry.delta_data)) {
            for (const gen of vlData.generators) {
                if (gen.delta > 0) {
                    vlDeltaPos.set(vlId, (vlDeltaPos.get(vlId) ?? 0) + gen.delta);
                } else if (gen.delta < 0) {
                    vlDeltaNeg.set(vlId, (vlDeltaNeg.get(vlId) ?? 0) - gen.delta);
                }
            }
        }
    }

    return { nodeMap, networkDiagonal, vlGenUncertainty, vlLoadUncertainty, vlSfccMw, vlDeltaPos, vlDeltaNeg };
}

// draw discs using the aggregated data
function renderDiscs(
    viewer: NetworkAreaDiagramViewer,
    aggregation: DiscAggregation,
    uncertainty_discs: boolean,
    uncertainty_disc_scale: number,
    uncertainty_disc_offset_scale: number,
    sfcc_discs: boolean,
    sfcc_disc_scale: number,
    delta_discs: boolean,
    delta_disc_scale: number,
    delta_disc_offset_scale: number,
    globalMaxUncertainty: number,
    globalMaxSfccMw: number,
    globalMaxDelta: number,
    showMarkers: boolean,
    animateDiscs: boolean
): void {
    const innerSvg = viewer.innerSvg;
    if (!innerSvg) return;

    const { nodeMap, networkDiagonal, vlGenUncertainty, vlLoadUncertainty, vlSfccMw, vlDeltaPos, vlDeltaNeg } =
        aggregation;

    const maxDiscRadius = networkDiagonal * DISC_MAX_FRACTION * uncertainty_disc_scale;
    const discOffset =
        uncertainty_disc_offset_scale <= 0 ? 0 : Math.max(10, maxDiscRadius * 0.4 * uncertainty_disc_offset_scale);
    const maxSfccDiscRadius = networkDiagonal * DISC_MAX_FRACTION * sfcc_disc_scale;

    innerSvg.querySelector(':scope > g.comparator-discs')?.remove();
    const discGroup = document.createElementNS(SVG_NS, 'g');
    discGroup.setAttribute('class', animateDiscs ? 'comparator-discs' : 'comparator-discs no-disc-animation');
    innerSvg.appendChild(discGroup);

    const emphRadius = Math.max(10, networkDiagonal * 0.008);
    const bracketStroke = Math.max(1.5, emphRadius * 0.15);
    const haloStroke = bracketStroke * 2.5;
    const activeVlIds = new Set([
        ...vlGenUncertainty.keys(),
        ...vlLoadUncertainty.keys(),
        ...vlSfccMw.keys(),
        ...vlDeltaPos.keys(),
        ...vlDeltaNeg.keys(),
    ]);

    if (uncertainty_discs) {
        const computeRadius = (range: number): number =>
            globalMaxUncertainty > 0
                ? Math.max(DISC_RADIUS_MIN, (range / globalMaxUncertainty) * maxDiscRadius)
                : DISC_RADIUS_MIN;

        const allVlIds = new Set([...vlGenUncertainty.keys(), ...vlLoadUncertainty.keys()]);
        allVlIds.forEach((vlId) => {
            const pos = nodeMap.get(vlId);
            if (!pos) return;

            const genRange = vlGenUncertainty.get(vlId) ?? 0;
            if (genRange > 0) {
                const circle = document.createElementNS(SVG_NS, 'circle');
                circle.setAttribute('class', 'comp-unc-disc-gen');
                circle.setAttribute('data-equipment-id', vlId);
                circle.setAttribute('data-offset-x', String(-discOffset));
                circle.setAttribute('cx', String(pos.x - discOffset));
                circle.setAttribute('cy', String(pos.y));
                circle.setAttribute('r', String(computeRadius(genRange)));
                discGroup.appendChild(circle);
            }

            const loadRange = vlLoadUncertainty.get(vlId) ?? 0;
            if (loadRange > 0) {
                const circle = document.createElementNS(SVG_NS, 'circle');
                circle.setAttribute('class', 'comp-unc-disc-load');
                circle.setAttribute('data-equipment-id', vlId);
                circle.setAttribute('data-offset-x', String(discOffset));
                circle.setAttribute('cx', String(pos.x + discOffset));
                circle.setAttribute('cy', String(pos.y));
                circle.setAttribute('r', String(computeRadius(loadRange)));
                discGroup.appendChild(circle);
            }
        });
    }

    if (sfcc_discs) {
        const sfccRadiusFloor = Math.max(DISC_RADIUS_MIN, DISC_SFCC_RADIUS_MIN_FRACTION * maxSfccDiscRadius);
        const computeSfccRadius = (sfccMw: number): number =>
            globalMaxSfccMw > 0
                ? Math.max(sfccRadiusFloor, (sfccMw / globalMaxSfccMw) * maxSfccDiscRadius)
                : sfccRadiusFloor;

        vlSfccMw.forEach((sfccMw, vlId) => {
            if (sfccMw <= 0) return;
            const pos = nodeMap.get(vlId);
            if (!pos) return;
            const circle = document.createElementNS(SVG_NS, 'circle');
            circle.setAttribute('class', 'comp-sfcc-disc');
            circle.dataset['equipmentId'] = vlId;
            circle.dataset['offsetX'] = '0';
            circle.setAttribute('cx', String(pos.x));
            circle.setAttribute('cy', String(pos.y));
            circle.setAttribute('r', String(computeSfccRadius(sfccMw)));
            discGroup.appendChild(circle);
        });
    }

    if (delta_discs) {
        const maxDeltaRadius = networkDiagonal * DISC_MAX_FRACTION * delta_disc_scale;
        const deltaOffset =
            delta_disc_offset_scale <= 0 ? 0 : Math.max(10, maxDeltaRadius * 0.4 * delta_disc_offset_scale);
        const computeDeltaRadius = (val: number): number =>
            globalMaxDelta > 0 ? Math.max(DISC_RADIUS_MIN, (val / globalMaxDelta) * maxDeltaRadius) : DISC_RADIUS_MIN;

        const allDeltaVlIds = new Set([...vlDeltaPos.keys(), ...vlDeltaNeg.keys()]);
        allDeltaVlIds.forEach((vlId) => {
            const pos = nodeMap.get(vlId);
            if (!pos) return;

            const deltaPos = vlDeltaPos.get(vlId) ?? 0;
            if (deltaPos > 0) {
                const circle = document.createElementNS(SVG_NS, 'circle');
                circle.setAttribute('class', 'comp-delta-disc-pos');
                circle.setAttribute('data-equipment-id', vlId);
                circle.setAttribute('data-offset-x', String(deltaOffset));
                circle.setAttribute('cx', String(pos.x + deltaOffset));
                circle.setAttribute('cy', String(pos.y));
                circle.setAttribute('r', String(computeDeltaRadius(deltaPos)));
                discGroup.appendChild(circle);
            }

            const deltaNeg = vlDeltaNeg.get(vlId) ?? 0;
            if (deltaNeg > 0) {
                const circle = document.createElementNS(SVG_NS, 'circle');
                circle.setAttribute('class', 'comp-delta-disc-neg');
                circle.setAttribute('data-equipment-id', vlId);
                circle.setAttribute('data-offset-x', String(-deltaOffset));
                circle.setAttribute('cx', String(pos.x - deltaOffset));
                circle.setAttribute('cy', String(pos.y));
                circle.setAttribute('r', String(computeDeltaRadius(deltaNeg)));
                discGroup.appendChild(circle);
            }
        });
    }

    // optional emphasis markers are rendered last, to make them more visible
    if (showMarkers) {
        const s = emphRadius;
        const a = s * 0.45;
        const d = [
            `M ${a - s},${-s} L ${-s},${-s} L ${-s},${a - s}`,
            `M ${s - a},${-s} L ${s},${-s} L ${s},${a - s}`,
            `M ${s - a},${s} L ${s},${s} L ${s},${s - a}`,
            `M ${a - s},${s} L ${-s},${s} L ${-s},${s - a}`,
        ].join(' ');
        activeVlIds.forEach((vlId) => {
            const pos = nodeMap.get(vlId);
            if (!pos) return;
            const group = document.createElementNS(SVG_NS, 'g');
            group.dataset['equipmentId'] = vlId;
            group.dataset['vlBracket'] = '1';
            group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
            const halo = document.createElementNS(SVG_NS, 'path');
            halo.setAttribute('class', 'comp-vl-emphasis-halo');
            halo.setAttribute('stroke-width', String(haloStroke));
            halo.setAttribute('d', d);
            group.appendChild(halo);
            const bracket = document.createElementNS(SVG_NS, 'path');
            bracket.setAttribute('class', 'comp-vl-emphasis');
            bracket.setAttribute('stroke-width', String(bracketStroke));
            bracket.setAttribute('d', d);
            group.appendChild(bracket);
            discGroup.appendChild(group);
        });
    }
}

// build popup with details
function buildVlPopupHtml(diagramEntry: DiagramData, vlId: string, popupScale: number): string {
    const injData = diagramEntry.injection_data?.[vlId];
    const deltaData = diagramEntry.delta_data?.[vlId];
    if (!injData && !deltaData) return '';

    const wrapper = document.createElement('div');

    if (injData) {
        for (const gen of injData.generators) {
            const u: InjectionDetail = {
                kind: 'GEN',
                id: gen.id,
                p: gen.p,
                u_min: gen.u_min,
                u_max: gen.u_max,
                pmin: gen.pmin,
                pmax: gen.pmax,
                sfcc: gen.sfcc_pct,
            };
            wrapper.appendChild(buildInjectionRow(u, popupScale));
        }
        for (const load of injData.loads) {
            const u: InjectionDetail = {
                kind: 'LOAD',
                id: load.id,
                p: load.p,
                u_min: load.u_min,
                u_max: load.u_max,
            };
            wrapper.appendChild(buildInjectionRow(u, popupScale));
        }
    }

    if (deltaData) {
        for (const gen of deltaData.generators) {
            wrapper.appendChild(buildGenDiffRow(gen, popupScale));
        }
    }

    return wrapper.innerHTML;
}

function getVlViewportPos(
    innerSvg: SVGElement | null | undefined,
    metadata: any,
    vlId: string
): { x: number; y: number } | null {
    if (!innerSvg || !metadata?.nodes) return null;
    const node = metadata.nodes.find((n: any) => n.equipmentId === vlId);
    if (!node) return null;
    const ctm = (innerSvg as SVGGraphicsElement).getScreenCTM();
    if (!ctm) return null;
    const pt = new DOMPoint(node.x, node.y).matrixTransform(ctm);
    return { x: pt.x, y: pt.y };
}

function makePopup(): HTMLDivElement {
    const box = document.createElement('div');
    box.style.cssText = [
        'position:fixed',
        'display:none',
        'background:white',
        'border:1px solid #888',
        'padding:5px',
        'pointer-events:none',
        'font-family:sans-serif',
        'font-size:12px',
        'z-index:9999',
        'max-height:50vh',
        'overflow-y:auto',
    ].join(';');
    document.body.appendChild(box);
    return box;
}

function showPopup(popup: HTMLDivElement, html: string, screenX: number, screenY: number): void {
    if (!html) {
        popup.style.display = 'none';
        return;
    }
    popup.innerHTML = html;
    popup.style.left = `${screenX + 12}px`;
    popup.style.top = `${screenY + 12}px`;
    popup.style.display = 'block';
}

function hidePopup(popup: HTMLDivElement): void {
    popup.style.display = 'none';
}

function render({ model, el }: RenderProps<ComparatorWidgetModel>) {
    const diagrams = model.get('diagrams');
    const synchronized = model.get('synchronized');
    const w = model.get('width');
    const h = model.get('height');
    const displayButtons = model.get('display_buttons');
    const popupScale = model.get('popup_scale');
    const uncertaintyDiscs = model.get('uncertainty_discs');
    const uncertaintyDiscScale = model.get('uncertainty_disc_scale');
    const uncertaintyDiscOffsetScale = model.get('uncertainty_disc_offset_scale');
    const sfccDiscs = model.get('sfcc_discs');
    const sfccDiscScale = model.get('sfcc_disc_scale');
    const deltaDiscs = model.get('delta_discs');
    const deltaDiscScale = model.get('delta_disc_scale');
    const deltaDiscOffsetScale = model.get('delta_disc_offset_scale');
    const showMarkers = model.get('show_markers');
    const animateDiscs = model.get('animate_discs');
    const discsEnabled = uncertaintyDiscs || sfccDiscs || deltaDiscs;

    const popupsEnabled = discsEnabled || diagrams.some((d) => d.injection_data != null || d.delta_data != null);

    const container = document.createElement('div');
    container.classList.add('powsybl-comparator-container');
    el.appendChild(container);

    const viewers: NetworkAreaDiagramViewer[] = [];
    const parsedMetadatas: any[] = [];
    const popups: HTMLDivElement[] = [];
    const currentHoveredIds: (string | null)[] = [];
    const observers: MutationObserver[] = [];
    const hoverDelegates: HoverCb[] = [];
    const n = diagrams.length;

    diagrams.forEach((diagram) => {
        const diagramDiv = document.createElement('div');
        diagramDiv.classList.add('powsybl-comparator-item');
        container.appendChild(diagramDiv);

        const metadata = diagram.metadata ? JSON.parse(diagram.metadata) : null;

        let hoverIdx = -1;
        if (popupsEnabled) {
            parsedMetadatas.push(metadata);
            const popup = makePopup();
            popups.push(popup);
            currentHoveredIds.push(null);
            hoverIdx = hoverDelegates.length;
            hoverDelegates.push((hovered, _mousePos, equipmentId, equipmentType) => {
                if (hovered && equipmentType !== 'VOLTAGE_LEVEL') return;
                currentHoveredIds[hoverIdx] = hovered ? equipmentId : null;
                if (hovered) {
                    const pos = getVlViewportPos(viewers[hoverIdx].innerSvg, metadata, equipmentId);
                    if (pos) {
                        showPopup(popups[hoverIdx], buildVlPopupHtml(diagram, equipmentId, popupScale), pos.x, pos.y);
                    }
                } else {
                    hidePopup(popups[hoverIdx]);
                }
            });
        }

        const viewer = new NetworkAreaDiagramViewer(diagramDiv, diagram.svg_data, metadata, {
            minWidth: w == null ? 600 / n : w * 0.6,
            minHeight: h == null ? 800 / n : h * 0.6,
            maxWidth: w ?? 1000 / n,
            maxHeight: h ?? 800 / n,
            addButtons: displayButtons,
            enableDragInteraction: true,
            onToggleHoverCallback:
                hoverIdx >= 0
                    ? (hovered, mousePos, equipmentId, equipmentType) =>
                          hoverDelegates[hoverIdx](hovered, mousePos, equipmentId, equipmentType)
                    : null,
        });

        viewers.push(viewer);
        if (popupsEnabled) {
            const viewerIdx = viewers.length - 1;
            const outerSvg = diagramDiv.querySelector('svg');
            if (outerSvg) {
                let pendingPopupUpdate = false;
                const obs = new MutationObserver(() => {
                    if (pendingPopupUpdate) return;
                    pendingPopupUpdate = true;
                    setTimeout(() => {
                        pendingPopupUpdate = false;
                        const vlId = currentHoveredIds[viewerIdx];
                        if (!vlId) return;
                        const pos = getVlViewportPos(viewers[viewerIdx].innerSvg, parsedMetadatas[viewerIdx], vlId);
                        if (pos) {
                            showPopup(
                                popups[viewerIdx],
                                buildVlPopupHtml(diagrams[viewerIdx], vlId, popupScale),
                                pos.x,
                                pos.y
                            );
                        }
                    }, 0);
                });
                obs.observe(outerSvg, { attributes: true, attributeFilter: ['viewBox'] });
                observers.push(obs);
            }
        }
    });

    if (synchronized && viewers.length > 1) {
        //synchronize viewbox pan and zoom
        for (let i = 0; i < viewers.length; i++) {
            for (let j = 0; j < viewers.length; j++) {
                if (i !== j) {
                    viewers[i].syncViewBoxWith(viewers[j]);
                }
            }
        }

        //synchronize drag and drop (nodes and text boxes)
        for (let i = 0; i < viewers.length; i++) {
            const idx = i;
            viewers[i].onMoveNodeCallback = (equipmentId, _nodeId, x, y, _xOrig, _yOrig) => {
                if (discsEnabled) {
                    const sv = viewers[idx].innerSvg;
                    if (sv) updateDiscPosition(sv, equipmentId, x, y);
                }
                for (let j = 0; j < viewers.length; j++) {
                    if (j !== idx) {
                        viewers[j].moveNodeToCoordinates(equipmentId, x, y);
                        if (discsEnabled) {
                            const sv = viewers[j].innerSvg;
                            if (sv) updateDiscPosition(sv, equipmentId, x, y);
                        }
                    }
                }
            };
            viewers[i].onMoveTextNodeCallback = (
                equipmentId,
                _vlNodeId,
                _textNodeId,
                shiftX,
                shiftY,
                _shiftXOrig,
                _shiftYOrig,
                connectionShiftX,
                connectionShiftY,
                _connectionShiftXOrig,
                _connectionShiftYOrig
            ) => {
                for (let j = 0; j < viewers.length; j++) {
                    if (j !== idx) {
                        viewers[j].moveTextNodeToCoordinates(
                            equipmentId,
                            shiftX,
                            shiftY,
                            connectionShiftX,
                            connectionShiftY
                        );
                    }
                }
            };
        }

        if (popupsEnabled) {
            for (let i = 0; i < viewers.length; i++) {
                const idx = i;
                hoverDelegates[idx] = (hovered, _mousePos, equipmentId, equipmentType) => {
                    if (hovered && equipmentType !== 'VOLTAGE_LEVEL') return;
                    for (let j = 0; j < viewers.length; j++) {
                        currentHoveredIds[j] = hovered ? equipmentId : null;
                    }
                    if (hovered) {
                        for (let j = 0; j < viewers.length; j++) {
                            const pos = getVlViewportPos(viewers[j].innerSvg, parsedMetadatas[j], equipmentId);
                            if (pos) {
                                showPopup(
                                    popups[j],
                                    buildVlPopupHtml(diagrams[j], equipmentId, popupScale),
                                    pos.x,
                                    pos.y
                                );
                            } else {
                                hidePopup(popups[j]);
                            }
                        }
                    } else {
                        for (let j = 0; j < viewers.length; j++) hidePopup(popups[j]);
                    }
                };
            }
        }
    }

    if (discsEnabled && !(synchronized && viewers.length > 1)) {
        for (let i = 0; i < viewers.length; i++) {
            const idx = i;
            viewers[i].onMoveNodeCallback = (equipmentId, _nodeId, x, y, _xOrig, _yOrig) => {
                const sv = viewers[idx].innerSvg;
                if (sv) updateDiscPosition(sv, equipmentId, x, y);
            };
        }
    }

    if (discsEnabled) {
        setTimeout(() => {
            const allAggregations = viewers.map((v, i) =>
                aggregateDiscData(v, diagrams[i], uncertaintyDiscs, sfccDiscs, deltaDiscs)
            );
            const globalMaxUncertainty = Math.max(
                0,
                ...allAggregations.flatMap((a) => [...a.vlGenUncertainty.values(), ...a.vlLoadUncertainty.values()])
            );
            const globalMaxSfccMw = Math.max(0, ...allAggregations.flatMap((a) => [...a.vlSfccMw.values()]));
            const globalMaxDelta = Math.max(
                0,
                ...allAggregations.flatMap((a) => [...a.vlDeltaPos.values(), ...a.vlDeltaNeg.values()])
            );
            viewers.forEach((v, i) =>
                renderDiscs(
                    v,
                    allAggregations[i],
                    uncertaintyDiscs,
                    uncertaintyDiscScale,
                    uncertaintyDiscOffsetScale,
                    sfccDiscs,
                    sfccDiscScale,
                    deltaDiscs,
                    deltaDiscScale,
                    deltaDiscOffsetScale,
                    globalMaxUncertainty,
                    globalMaxSfccMw,
                    globalMaxDelta,
                    showMarkers,
                    animateDiscs
                )
            );
        }, 0);
    }

    return () => {
        popups.forEach((b) => b.remove());
        observers.forEach((o) => o.disconnect());
    };
}

export default { render };
