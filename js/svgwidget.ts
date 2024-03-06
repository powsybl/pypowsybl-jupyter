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
        const el_div = document.createElement('div');
        el_div.classList.add('svg-viewer-widget');
        el.appendChild(el_div);

        new NetworkAreaDiagramViewer(
                el_div,
                model.get('svg_data'),
                800,
                500,
                800,
                500,
          );
}

export default { render };
