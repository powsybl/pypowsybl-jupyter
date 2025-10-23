// Copyright (c) 2024, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

import type { RenderProps } from '@anywidget/types';
import './nadwidget.css';

import {
    NetworkAreaDiagramViewer,
    NadViewerParametersOptions,
} from '@powsybl/network-viewer';

import { PopupMenu } from './popupmenu';
import { PopupInfo } from './popupinfo';

interface NadWidgetModel {
    diagram_data: any;
    selected_node: any;
    selected_menu: any;
    moved_node: any;
    moved_text_node: any;
    current_nad_metadata: string;
    popup_menu_items: string[];
    hover_enabled: boolean;
    branch_states: any[];
}

function render({ model, el, experimental }: RenderProps<NadWidgetModel>) {
    let nad_viewer: NetworkAreaDiagramViewer | null = null;

    const handleSelectNode = (
        equipmentId: string,
        nodeId: string,
        _mousePosition: any
    ) => {
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

    function toWidgetCoordinates(
        container: HTMLElement,
        x: number,
        y: number
    ): { x: number; y: number } {
        const containerRect = container.getBoundingClientRect();
        return {
            x: x - containerRect.left,
            y: y - containerRect.top,
        };
    }

    const applyBranchStates = () => {
        if (nad_viewer) {
            const branch_states = model.get('branch_states');
            if (branch_states && branch_states.length > 0) {
                nad_viewer.setBranchStates(branch_states);
            }
        }
    };

    function render_diagram(
        model: any,
        diagram_svg: string,
        diagram_meta: string | null
    ): any {
        const diagram_data = model.get('diagram_data');
        const is_invalid_lf = diagram_data['invalid_lf'];
        const is_grayout = diagram_data['grayout'];
        const is_drag_enabled = diagram_data['drag_enabled'];
        const menu_items = model.get('popup_menu_items');
        const is_hover_enabled = model.get('hover_enabled');

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
                    const mousePos = toWidgetCoordinates(
                        el_div.querySelector('#svg-container') ?? el_div,
                        mousePosition.x,
                        mousePosition.y
                    );

                    popupMenu?.displayMenu(mousePos.x, mousePos.y, equipmentId);
                }
            };
        }

        let popupInfo: PopupInfo | null = null;

        const handleInfo = (
            shouldDisplay: boolean,
            mousePosition: any,
            elementId: string,
            elementType: string
        ) => {
            let mousePos = null;
            if (mousePosition) {
                mousePos = toWidgetCoordinates(
                    el_div.querySelector('#svg-container') ?? el_div,
                    mousePosition.x,
                    mousePosition.y
                );
            }

            popupInfo?.handleHover(
                shouldDisplay,
                mousePos,
                elementId,
                elementType
            );
        };

        const nadViewerParametersOptions: NadViewerParametersOptions = {
            minWidth: 800,
            minHeight: 600,
            maxWidth: 800,
            maxHeight: 600,
            enableDragInteraction: is_drag_enabled,
            addButtons: true,
            onMoveNodeCallback: handleMoveNode,
            onMoveTextNodeCallback: handleMoveTextNode,
            onSelectNodeCallback: handleSelectNode,
            onToggleHoverCallback: is_hover_enabled ? handleInfo : null,
            onRightClickCallback: handleMenu,
        };

        nad_viewer = new NetworkAreaDiagramViewer(
            el_div,
            diagram_svg,
            diagram_meta ? JSON.parse(diagram_meta) : null,
            nadViewerParametersOptions
        );

        setTimeout(() => {
            applyBranchStates();
        }, 0);

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

        popupInfo = new PopupInfo(el_div, async (id: string, type: string) => {
            try {
                const [retInfo, _buffers] = await experimental.invoke(
                    '_get_on_hover_info',
                    { id: id, type: type }
                );
                return retInfo as string;
            } catch (e) {
                return `Error retrieving hover info: ${e}`;
            }
        });

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
                metad = nad_viewer.getJsonMetadata() || '';
            }
            updateCurrentMetadataInModel(metad);
        }
    });

    model.on('change:branch_states', () => {
        applyBranchStates();
    });
}

export default { render };
