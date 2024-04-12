// Copyright (c) 2024, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

import type { RenderProps } from '@anywidget/types';
import './nadwidget.css';

import { NetworkAreaDiagramViewer } from '@powsybl/diagram-viewer';

interface NadWidgetModel {
    diagram_data: any;
}

function render({ model, el }: RenderProps<NadWidgetModel>) {
    function render_diagram(model: any): any {
        const diagram_data = model.get('diagram_data');
        const svg_data = diagram_data['svg_data']; //svg content

        const el_div = document.createElement('div');
        el_div.classList.add('svg-nad-viewer-widget');

        new NetworkAreaDiagramViewer(el_div, svg_data, 800, 600, 800, 600);

        return el_div;
    }

    const diagram_element = render_diagram(model);
    el.appendChild(diagram_element);

    model.on('change:diagram_data', () => {
        const nodes = el.querySelectorAll('.svg-nad-viewer-widget')[0];
        const new_el = render_diagram(model);
        el.replaceChild(new_el, nodes);
    });
}

export default { render };
