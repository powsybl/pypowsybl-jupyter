// Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

import type { RenderProps } from "@anywidget/types";
import "./svgwidget.css";

import { NetworkAreaDiagramViewer } from '@powsybl/diagram-viewer';

interface SvgWidgetModel {
        svg_data: string;
}

function render({ model, el }: RenderProps<SvgWidgetModel>) {

        function render_diagram(model: any): any {
                const el_div = document.createElement('div');
                el_div.classList.add('svg-viewer-widget');

                new NetworkAreaDiagramViewer(
                        el_div,
                        model.get('svg_data'),
                        800,
                        500,
                        800,
                        500,
                );

                return el_div;
        }

        const diagram_element = render_diagram(model);
        el.appendChild(diagram_element);

        model.on("change:svg_data", () => {
                const nodes = el.querySelectorAll('.svg-viewer-widget')[0];
                const new_el = render_diagram(model);
                el.replaceChild(new_el, nodes);
	});
}

export default { render };
