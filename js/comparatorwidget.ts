// Copyright (c) 2026, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0

import type { RenderProps } from '@anywidget/types';
import { NetworkAreaDiagramViewer } from '@powsybl/network-viewer';
import './comparatorwidget.css';

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
            minWidth: w != null ? w * 0.6 : 600 / n,
            minHeight: h != null ? h * 0.6 : 800 / n,
            maxWidth: w != null ? w : 1000 / n,
            maxHeight: h != null ? h : 800 / n,
            addButtons: displayButtons,
        });

        viewers.push(viewer);
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
