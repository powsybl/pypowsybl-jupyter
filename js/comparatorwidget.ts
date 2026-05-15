// Copyright (c) 2026, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0

import type { RenderProps } from '@anywidget/types';
import { NetworkAreaDiagramViewer } from '@powsybl/network-viewer';
import './comparatorwidget.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
const INJECTION_MARKER_PREFIX = '§I§';
const DIFF_MARKER_PREFIX = '§D§';
const INJECTION_BAR_WIDTH = 160;
const INJECTION_BAR_HEIGHT = 6;
const INJECTION_H_MARGIN_LEFT = 8;
const INJECTION_H_MARGIN_RIGHT = 20;
const INJECTION_LABEL_FONT_SIZE = 9;

interface DiagramData {
    svg_data: string;
    metadata: string | null;
}

interface ComparatorWidgetModel {
    diagrams: DiagramData[];
    synchronized: boolean;
    width: number | null;
    height: number | null;
    display_buttons: boolean;
    inj_bar_scale: number;
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

type GenDiffDetail = {
    kind: 'GEN_DIFF';
    id: string;
    p_n1: number;
    p_n2: number;
    delta: number;
    pmin: number;
    pmax: number;
};

function parseInjectionDetailsMarker(raw: string): InjectionDetail | null {
    if (!raw.startsWith(INJECTION_MARKER_PREFIX)) return null;
    const spaceIdx = raw.indexOf(' ');
    const marker = spaceIdx === -1 ? raw : raw.slice(0, spaceIdx);
    const fields = marker.slice(INJECTION_MARKER_PREFIX.length).split('|');
    const kind = fields[0];
    if (kind === 'GEN' && (fields.length === 7 || fields.length === 8)) {
        const [, id, pS, u_minS, u_maxS, pminS, pmaxS] = fields;
        const sfccS = fields.length === 8 ? fields[7] : '';
        return {
            kind: 'GEN',
            id,
            p: Number(pS),
            u_min: u_minS === '' ? null : Number(u_minS),
            u_max: u_maxS === '' ? null : Number(u_maxS),
            pmin: Number(pminS),
            pmax: Number(pmaxS),
            sfcc: sfccS === '' ? null : Number(sfccS),
        };
    }
    if (kind === 'LOAD' && fields.length === 5) {
        const [, id, pS, u_minS, u_maxS] = fields;
        return {
            kind: 'LOAD',
            id,
            p: Number(pS),
            u_min: Number(u_minS),
            u_max: Number(u_maxS),
        };
    }
    return null;
}

function parseGenDiffMarker(raw: string): GenDiffDetail | null {
    if (!raw.startsWith(DIFF_MARKER_PREFIX)) return null;
    const spaceIdx = raw.indexOf(' ');
    const marker = spaceIdx === -1 ? raw : raw.slice(0, spaceIdx);
    const fields = marker.slice(DIFF_MARKER_PREFIX.length).split('|');
    if (fields[0] === 'GEN' && fields.length === 7) {
        const [, id, p_n1S, p_n2S, deltaS, pminS, pmaxS] = fields;
        return {
            kind: 'GEN_DIFF',
            id,
            p_n1: Number(p_n1S),
            p_n2: Number(p_n2S),
            delta: Number(deltaS),
            pmin: Number(pminS),
            pmax: Number(pmaxS),
        };
    }
    return null;
}

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

function buildInjectionRow(u: InjectionDetail, inj_bar_scale: number = 1): HTMLElement {
    const [u_min_d, u_max_d] = getDomainInjectionInterval(u);
    const span = u_max_d - u_min_d || 1;
    const scale = (v: number) => ((v - u_min_d) / span) * INJECTION_BAR_WIDTH;

    const row = document.createElement('div');
    row.classList.add('inj-bar-row', u.kind === 'GEN' ? 'gen' : 'load');

    const barTop = 2;
    const barMid = barTop + INJECTION_BAR_HEIGHT / 2;
    const textY = 13;
    const svgHeight = 19;
    const viewBoxW = INJECTION_BAR_WIDTH + INJECTION_H_MARGIN_LEFT + INJECTION_H_MARGIN_RIGHT;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'inj-bar-svg');
    svg.setAttribute('width', String(viewBoxW * inj_bar_scale));
    svg.setAttribute('height', String(svgHeight * inj_bar_scale));
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
    label.style.fontSize = `${INJECTION_LABEL_FONT_SIZE * inj_bar_scale}px`;
    label.textContent = `${u.id}`;

    row.appendChild(svg);
    row.appendChild(label);

    return row;
}

function buildGenDiffRow(gd: GenDiffDetail, inj_bar_scale: number = 1): HTMLElement {
    const uMin = Math.min(gd.pmin, gd.p_n1, gd.p_n2);
    const uMax = Math.max(gd.pmax, gd.p_n1, gd.p_n2);
    const span = uMax - uMin || 1;
    const scale = (v: number) => ((v - uMin) / span) * INJECTION_BAR_WIDTH;

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
    svg.setAttribute('width', String(viewBoxW * inj_bar_scale));
    svg.setAttribute('height', String(svgHeight * inj_bar_scale));
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
    label.style.fontSize = `${INJECTION_LABEL_FONT_SIZE * inj_bar_scale}px`;
    const nameNode = document.createTextNode(gd.id);
    label.appendChild(nameNode);

    row.appendChild(svg);
    row.appendChild(label);

    return row;
}

function renderInjectionBars(container: HTMLElement, inj_bar_scale: number = 1): void {
    const labelBoxes = container.querySelectorAll<HTMLElement>('.nad-label-box');
    labelBoxes.forEach((box) => {
        const divs = box.querySelectorAll<HTMLElement>('div');
        divs.forEach((div) => {
            if (div.dataset.injectionRendered === '1') return;
            const content = div.textContent || '';
            let row: HTMLElement | null = null;
            if (content.startsWith(INJECTION_MARKER_PREFIX)) {
                const u = parseInjectionDetailsMarker(content);
                if (u) row = buildInjectionRow(u, inj_bar_scale);
            } else if (content.startsWith(DIFF_MARKER_PREFIX)) {
                const u = parseGenDiffMarker(content);
                if (u) row = buildGenDiffRow(u, inj_bar_scale);
            }

            if (!row) return;

            div.textContent = '';
            div.style.textAlign = 'left';
            div.style.lineHeight = '0';
            div.appendChild(row);
            div.dataset.injectionRendered = '1';
        });
    });
}

function render({ model, el }: RenderProps<ComparatorWidgetModel>) {
    const diagrams = model.get('diagrams');
    const synchronized = model.get('synchronized');
    const w = model.get('width');
    const h = model.get('height');
    const displayButtons = model.get('display_buttons');
    const injBarScale = model.get('inj_bar_scale');

    const container = document.createElement('div');
    container.classList.add('powsybl-comparator-container');
    el.appendChild(container);

    const viewers: NetworkAreaDiagramViewer[] = [];
    const n = diagrams.length;

    diagrams.forEach((diagram) => {
        const diagramDiv = document.createElement('div');
        diagramDiv.classList.add('powsybl-comparator-item');
        container.appendChild(diagramDiv);

        const metadata = diagram.metadata ? JSON.parse(diagram.metadata) : null;

        const viewer = new NetworkAreaDiagramViewer(diagramDiv, diagram.svg_data, metadata, {
            minWidth: w == null ? 600 / n : w * 0.6,
            minHeight: h == null ? 800 / n : h * 0.6,
            maxWidth: w ?? 1000 / n,
            maxHeight: h ?? 800 / n,
            addButtons: displayButtons,
            enableDragInteraction: true,
        });

        viewers.push(viewer);
        setTimeout(() => renderInjectionBars(diagramDiv, injBarScale), 0);
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
                for (let j = 0; j < viewers.length; j++) {
                    if (j !== idx) {
                        viewers[j].moveNodeToCoordinates(equipmentId, x, y);
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
    }
}

export default { render };
