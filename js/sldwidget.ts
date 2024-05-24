// Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

import type { RenderProps, Initialize } from '@anywidget/types';

import { SingleLineDiagramViewer } from '@powsybl/diagram-viewer';

import './sldwidget.css';

/* Specifies attributes defined with traitlets in ../src/pypowsybl_jupyter/__init__.py */
interface SldWidgetModel {
    diagram_data: any;
    clicked_nextvl: string;
    clicked_switch: any;
    clicked_feeder: any;
    clicked_bus: any;
}

function initialize({ model }: Initialize<SldWidgetModel>) {
    /* (optional) model initialization logic */
}

function render({ model, el }: RenderProps<SldWidgetModel>) {
    const handleNextVl = (id: string) => {
        model.set('clicked_nextvl', id);
        model.save_changes();
        model.send({ event: 'click_nextvl' });
    };

    const handleSwitch = (id: string, switch_status: boolean, element: any) => {
        model.set('clicked_switch', { id: id, switch_status: switch_status });
        model.save_changes();
        model.send({ event: 'click_switch' });
    };

    const handleFeeder = (
        id: string,
        feederType: string | null,
        svgId: string,
        x: number,
        y: number
    ) => {
        model.set('clicked_feeder', { id: id, feederType: feederType });
        model.save_changes();
        model.send({ event: 'click_feeder' });
    };

    const handleBus = (id: string, svgId: string, x: number, y: number) => {
        model.set('clicked_bus', { id: id });
        model.save_changes();
        model.send({ event: 'click_bus' });
    };

    const handleTogglePopover = (
        shouldDisplay: boolean,
        anchorEl: any,
        equipmentId: string,
        equipmentType: string
    ) => {};

    function render_diagram(model: any, viewDataPre: string): any {
        const diagram_data = model.get('diagram_data');
        const svg_data = diagram_data['value']; //svg content
        const metadata = diagram_data['value_meta']; //metadata
        const is_invalid_lf = diagram_data['invalid_lf'];

        const el_div = document.createElement('div');
        el_div.classList.add('svg-sld-viewer-widget');

        el_div.classList.toggle('invalid-lf', is_invalid_lf);

        new SingleLineDiagramViewer(
            el_div,
            svg_data,
            metadata ? JSON.parse(metadata) : null,
            'voltage-level',
            500,
            600,
            1000,
            1200,
            metadata ? handleNextVl : null, //callback on the next voltage arrows
            metadata ? handleSwitch : null, //callback on the breakers
            metadata ? handleFeeder : null, //callback on the feeders
            metadata ? handleBus : null, //callback on the buses
            'lightblue', //arrows color
            handleTogglePopover //callback on the togglePopOver
        );

        if (diagram_data['keep_viewbox']) {
            const outerSvgElement = el_div.querySelector('svg');
            outerSvgElement?.setAttribute('viewBox', viewDataPre);
        }
        return el_div;
    }

    const diagram_element = render_diagram(model, '');
    el.appendChild(diagram_element);

    model.on('change:diagram_data', () => {
        const nodes = el.querySelectorAll('.svg-sld-viewer-widget')[0];
        const currViewData =
            el.querySelector('svg')?.getAttribute('viewBox') || '';
        const new_el = render_diagram(model, currViewData);
        el.replaceChild(new_el, nodes);
    });
}

export default { render, initialize };
