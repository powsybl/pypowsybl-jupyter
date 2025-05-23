// Copyright (c) 2024, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

import type { RenderProps } from '@anywidget/types';
import './nadwidget.css';

import { NetworkAreaDiagramViewer } from '@powsybl/network-viewer';

import { PopupMenu } from './popupmenu';

interface NadWidgetModel {
    diagram_data: any;
    selected_node: any;
    selected_menu: any;
    moved_node: any;
    moved_text_node: any;
    current_nad_metadata: string;
    popup_menu_items: string[];
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

    const handleSelectMenu = (equipmentId: string, selection: number) => {
        model.set('selected_menu', {
            equipment_id: equipmentId,
            selection: selection,
        });
        model.save_changes();
        model.send({ event: 'select_menu' });
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

    let nad_viewer: any = null;

    function svgToScreen(
        container: HTMLElement,
        x: number,
        y: number
    ): { screenX: number; screenY: number } | null {
        const svgElement = container.querySelector(
            'svg'
        ) as SVGGraphicsElement | null;

        if (!svgElement) {
            console.error('No SVG element found inside the container.');
            return null;
        }

        const screenCTM = svgElement.getScreenCTM();
        if (!screenCTM) {
            console.error('Failed to get screenCTM for the SVG element.');
            return null;
        }

        // Convert coordinates from SVG to screen
        const point = new DOMPoint(x, y);
        const transformedPoint = point.matrixTransform(screenCTM);

        const containerRect = container.getBoundingClientRect();

        return {
            screenX: transformedPoint.x - containerRect.left,
            screenY: transformedPoint.y - containerRect.top,
        };
    }

    function render_diagram(
        model: any,
        diagram_svg: string,
        diagram_meta: string | null
    ): any {
        const diagram_data = model.get('diagram_data');
        const is_invalid_lf = diagram_data['invalid_lf'];
        const is_grayout = diagram_data['grayout'];
        const is_enabled_callbacks = diagram_data['enable_callbacks'];
        const menu_items = model.get('popup_menu_items');

        const el_div = document.createElement('div');
        el_div.classList.add('svg-nad-viewer-widget');

        el_div.classList.toggle('invalid-lf', is_invalid_lf);

        el_div.classList.toggle('grayout', is_grayout);

        let popupMenu: PopupMenu | null = null;
        let handleMenu = null;

        if (menu_items.length > 0) {
            popupMenu = new PopupMenu(
                el_div,
                menu_items,
                (selection: number, id: string) => {
                    handleSelectMenu(id, selection);
                }
            );

            handleMenu = (
                _svgId: string,
                equipmentId: string,
                equipmentType: string,
                mousePosition: any
            ) => {
                if (equipmentType === 'VOLTAGE_LEVEL') {
                    const transfPoint = svgToScreen(
                        el_div.querySelector('#svg-container') ?? el_div,
                        mousePosition.x,
                        mousePosition.y
                    );
                    let xx = 0;
                    let yy = 0;
                    if (transfPoint != null) {
                        xx = transfPoint.screenX;
                        yy = transfPoint.screenY;
                    }
                    popupMenu?.displayMenu(xx, yy, equipmentId);
                }
            };
        }

        nad_viewer = new NetworkAreaDiagramViewer(
            el_div,
            diagram_svg,
            diagram_meta ? JSON.parse(diagram_meta) : null,
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
            null,
            handleMenu,
            true
        );

        // prevents the default jupyter-lab's behavior for this event
        el_div.addEventListener('mousedown', (event: MouseEvent) => {
            if (event.shiftKey) {
                event.preventDefault();
            }
        });

        if (popupMenu != null) {
            // prevents the default jupyter-lab's behavior for these events
            el_div.addEventListener('contextmenu', (event: MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();
            });

            el_div.addEventListener('keydown', (event: KeyboardEvent) => {
                event.preventDefault();
            });
        }

        return el_div;
    }

    const diagram_element = render_diagram(
        model,
        model.get('diagram_data')['svg_data'],
        model.get('diagram_data')['metadata']
    );
    el.appendChild(diagram_element);

    function updateCurrentMetadataInModel(metadata: string) {
        model.set('current_nad_metadata', '');
        model.set('current_nad_metadata', metadata);
        model.save_changes();
    }

    model.on('change:diagram_data', () => {
        const diagram_data = model.get('diagram_data');
        const keep_viewbox = diagram_data['keep_viewbox'];
        let diagram_svg = '';
        let diagram_meta = null;

        const nodes = el.querySelectorAll('.svg-nad-viewer-widget')[0];

        if (keep_viewbox) {
            const svgContainer = nodes.querySelector('#svg-container');
            diagram_svg = svgContainer?.querySelector('svg')?.outerHTML ?? '';
        } else {
            diagram_svg = diagram_data['svg_data'];
            diagram_meta = diagram_data['metadata'];
            updateCurrentMetadataInModel(diagram_meta);
        }

        const new_el = render_diagram(model, diagram_svg, diagram_meta);
        el.replaceChild(new_el, nodes);
    });

    model.on('msg:custom', (content) => {
        if (content.type === 'triggerRetrieveMetadata') {
            let metad = '';
            if (nad_viewer != null) {
                metad = nad_viewer.getJsonMetadata();
            }
            updateCurrentMetadataInModel(metad);
        }
    });
}

export default { render };
