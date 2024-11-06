// Copyright (c) 2024, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

import type { RenderProps } from '@anywidget/types';
import './nadwidget.css';

import { NetworkAreaDiagramViewer } from '@powsybl/network-viewer';

interface NadWidgetModel {
    diagram_data: any;
    selected_node: any;
    moved_node: any;
    moved_text_node: any;
}

function render({ model, el }: RenderProps<NadWidgetModel>) {
    const handleSelectNode = (equipmentId: string, nodeId: string) => {
        model.set('selected_node', {
            equipment_id: equipmentId,
            node_id: nodeId,
        });
        model.save_changes();
        model.send({ event: 'select_node' });
    };

    const handleMoveNode = (
        equipmentId: string,
        nodeId: string,
        x: number,
        y: number,
        xOrig: number,
        yOrig: number
    ) => {
        model.set('moved_node', {
            equipment_id: equipmentId,
            node_id: nodeId,
            x: x,
            y: y,
            x_orig: xOrig,
            y_orig: yOrig,
        });
        model.save_changes();
        model.send({ event: 'move_node' });
    };

    const handleMoveTextNode = (
        equipmentId: string,
        nodeId: string,
        textNodeId: string,
        shiftX: number,
        shiftY: number,
        shiftXOrig: number,
        shiftYOrig: number,
        connectionShiftX: number,
        connectionShiftY: number,
        connectionShiftXOrig: number,
        connectionShiftYOrig: number
    ) => {
        model.set('moved_text_node', {
            equipment_id: equipmentId,
            node_id: nodeId,
            text_node_id: textNodeId,
            shift_x: shiftX,
            shift_y: shiftY,
            shift_x_orig: shiftXOrig,
            shift_y_orig: shiftYOrig,
            connection_shift_x: connectionShiftX,
            connection_shift_y: connectionShiftY,
            connection_shift_x_orig: connectionShiftXOrig,
            connection_shift_y_orig: connectionShiftYOrig,
        });
        model.save_changes();
        model.send({ event: 'move_text_node' });
    };

    function render_diagram(model: any): any {
        const diagram_data = model.get('diagram_data');
        const svg_data = diagram_data['svg_data'];
        const metadata = diagram_data['metadata'];
        const is_invalid_lf = diagram_data['invalid_lf'];
        const is_grayout = diagram_data['grayout'];
        const is_enabled_callbacks = diagram_data['enable_callbacks'];

        const el_div = document.createElement('div');
        el_div.classList.add('svg-nad-viewer-widget');

        el_div.classList.toggle('invalid-lf', is_invalid_lf);

        el_div.classList.toggle('grayout', is_grayout);

        new NetworkAreaDiagramViewer(
            el_div,
            svg_data,
            metadata ? JSON.parse(metadata) : null,
            800,
            600,
            800,
            600,
            handleMoveNode,
            handleMoveTextNode,
            handleSelectNode,
            is_enabled_callbacks,
            false,
            null,
            null
        );

        // prevents the default jupyter-lab's behavior (it already uses the shift+click combination)
        el_div.addEventListener('mousedown', function (event: MouseEvent) {
            if (event.shiftKey) {
                event.preventDefault();
            }
        });

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
