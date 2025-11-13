// Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

import type { RenderProps, Initialize } from '@anywidget/types';

import { SingleLineDiagramViewer } from '@powsybl/network-viewer';

import './sldwidget.css';

import { PopupInfo } from './popupinfo';

/* Specifies attributes defined with traitlets in ../src/pypowsybl_jupyter/__init__.py */
interface SldWidgetModel {
    diagram_data: any;
    clicked_nextvl: string;
    clicked_switch: any;
    clicked_feeder: any;
    clicked_bus: any;
    hover_enabled: boolean;
}

function initialize({ model }: Initialize<SldWidgetModel>) {
    /* (optional) model initialization logic */
}

function toWidgetCoordinates(container: HTMLElement, x: number, y: number): { x: number; y: number } {
    const containerRect = container.getBoundingClientRect();
    return {
        x: x - containerRect.left,
        y: y - containerRect.top,
    };
}

function render({ model, el, experimental }: RenderProps<SldWidgetModel>) {
    const handleNextVl = (id: string, _event: MouseEvent) => {
        model.set('clicked_nextvl', id);
        model.save_changes();
        model.send({ event: 'click_nextvl' });
    };

    const handleSwitch = (id: string, switch_status: boolean, element: any) => {
        model.set('clicked_switch', { id: id, switch_status: switch_status });
        model.save_changes();
        model.send({ event: 'click_switch' });
    };

    const handleFeeder = (id: string, feederType: string | null, svgId: string, x: number, y: number) => {
        model.set('clicked_feeder', { id: id, feederType: feederType });
        model.save_changes();
        model.send({ event: 'click_feeder' });
    };

    const handleBus = (id: string, svgId: string, x: number, y: number) => {
        model.set('clicked_bus', { id: id });
        model.save_changes();
        model.send({ event: 'click_bus' });
    };

    let popupInfo: PopupInfo | null = null;

    function render_diagram(model: any, viewDataPre: string): any {
        const diagram_data = model.get('diagram_data');
        const svg_data = diagram_data['value']; //svg content
        const metadata = diagram_data['value_meta']; //metadata
        const is_invalid_lf = diagram_data['invalid_lf'];

        const el_div = document.createElement('div');
        el_div.classList.add('svg-sld-viewer-widget');

        el_div.classList.toggle('invalid-lf', is_invalid_lf);

        const is_hover_enabled = model.get('hover_enabled');

        const handleTogglePopover = (
            shouldDisplay: boolean,
            anchorEl: any,
            equipmentId: string,
            equipmentType: string
        ) => {
            let mousePos = null;

            if (anchorEl) {
                const bb = anchorEl as HTMLAnchorElement;
                const mousePosition = bb.getBoundingClientRect();

                mousePos = toWidgetCoordinates(
                    el_div.querySelector('#svg-container') ?? el_div,
                    mousePosition.x,
                    mousePosition.y
                );

                mousePos = { x: mousePos.x + 10, y: mousePos.y + 10 };
            }
            popupInfo?.handleHover(shouldDisplay, mousePos, equipmentId, equipmentType);
        };

        new SingleLineDiagramViewer(
            el_div,
            svg_data,
            metadata ? JSON.parse(metadata) : null,
            'voltage-level',
            800,
            600,
            800,
            600,
            metadata ? handleNextVl : null, //callback on the next voltage arrows
            metadata ? handleSwitch : null, //callback on the breakers
            metadata ? handleFeeder : null, //callback on the feeders
            metadata ? handleBus : null, //callback on the buses
            'lightblue', //arrows color
            is_hover_enabled ? handleTogglePopover : null //callback on the togglePopOver
        );

        if (diagram_data['keep_viewbox']) {
            const outerSvgElement = el_div.querySelector('svg');
            outerSvgElement?.setAttribute('viewBox', viewDataPre);
        }

        popupInfo = new PopupInfo(el_div, async (id: string, type: string) => {
            try {
                const [retInfo, _buffers] = await experimental.invoke('_get_on_hover_info', {
                    id: id ?? null,
                    type: type,
                });
                return retInfo as string;
            } catch (e) {
                return `Error retrieving hover info: ${e}`;
            }
        });

        return el_div;
    }

    const diagram_element = render_diagram(model, '');
    el.appendChild(diagram_element);

    model.on('change:diagram_data', () => {
        const nodes = el.querySelectorAll('.svg-sld-viewer-widget')[0];
        const currViewData = el.querySelector('svg')?.getAttribute('viewBox') || '';
        const new_el = render_diagram(model, currViewData);
        el.replaceChild(new_el, nodes);
    });
}

export default { render, initialize };
