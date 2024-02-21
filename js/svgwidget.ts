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
        let adiv = document.createElement("div");
        adiv.classList.add("svgwidget");
        el.appendChild(adiv);

        new NetworkAreaDiagramViewer(
                adiv,
                model.get('svg_data'),
                800,
                500,
                800,
                500,
          );
}

export default { render };
