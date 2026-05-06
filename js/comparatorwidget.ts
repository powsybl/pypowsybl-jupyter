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
const INJECTION_BAR_WIDTH = 160;
const INJECTION_BAR_HEIGHT = 6;
const INJECTION_H_MARGIN_LEFT = 8;
const INJECTION_H_MARGIN_RIGHT = 20;

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

function buildInjectionRow(u: InjectionDetail): HTMLElement {
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
    svg.setAttribute('width', String(viewBoxW));
    svg.setAttribute('height', String(svgHeight));
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
    label.textContent = `${u.id}`;

    row.appendChild(svg);
    row.appendChild(label);

    return row;
}

function renderInjectionBars(container: HTMLElement): void {
    const labelBoxes = container.querySelectorAll<HTMLElement>('.nad-label-box');
    labelBoxes.forEach((box) => {
        const divs = box.querySelectorAll<HTMLElement>('div');
        divs.forEach((div) => {
            if (div.dataset.injectionRendered === '1') return;
            const content = div.textContent || '';
            if (!content.startsWith(INJECTION_MARKER_PREFIX)) return;
            const u = parseInjectionDetailsMarker(content);
            if (!u) return;
            const row = buildInjectionRow(u);
            div.textContent = '';
            div.style.textAlign = 'left';
            div.style.lineHeight = '0';
            div.appendChild(row);
            div.dataset.injectionRendered = '1';
        });
    });
}

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
}

function render({ model, el }: RenderProps<ComparatorWidgetModel>) {
    const diagrams = model.get('diagrams');
    const synchronized = model.get('synchronized');
    const w = model.get('width');
    const h = model.get('height');
    const displayButtons = model.get('display_buttons');

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
        setTimeout(() => renderInjectionBars(diagramDiv), 0);
    });

    if (synchronized && viewers.length > 1) {
        for (let i = 0; i < viewers.length; i++) {
            for (let j = 0; j < viewers.length; j++) {
                if (i !== j) {
                    viewers[i].syncViewBoxWith(viewers[j]);
                }
            }
        }
    }
}

export default { render };
