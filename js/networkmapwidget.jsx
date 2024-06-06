// Copyright (c) 2024, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

import React, { useEffect, useRef, useState } from 'react';

import { createRender, useModelState } from '@anywidget/react';
import { NetworkMap, GeoData, MapEquipments } from '@powsybl/diagram-viewer';
import './networkmapwidget.css';

import {
    createTheme,
    ThemeProvider,
    StyledEngineProvider,
} from '@mui/material/styles';

const INITIAL_ZOOM = 9;
const LABELS_ZOOM_THRESHOLD = 9;
const ARROWS_ZOOM_THRESHOLD = 7;
const useName = true;

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
    link: {
        color: 'green',
    },
    node: {
        background: '#1976d2',
        hover: '#90caf9',
        border: '#cce3f9',
    },
    selectedRow: {
        background: '#545C5B',
    },
    mapboxStyle: 'mapbox://styles/mapbox/dark-v9',
    aggrid: 'ag-theme-alpine-dark',
});

class WidgetMapEquipments extends MapEquipments {
    initEquipments(smapdata, lmapdata) {
        this.updateSubstations(smapdata, true);
        this.updateLines(lmapdata, true);
    }

    constructor(smapdata, lmapdata) {
        super();
        this.initEquipments(smapdata, lmapdata);
    }
}

//called after a click (right mouse click) on an equipment (line or substation)
function showEquipmentMenu(equipment, x, y, type) {
    console.log(
        '# Show equipment menu: ' +
            JSON.stringify(equipment) +
            ', type: ' +
            type
    );
}

const render = createRender(() => {
    const networkMapRef = useRef();

    const [spos] = useModelState('spos');
    const [lpos] = useModelState('lpos');
    const [smap] = useModelState('smap');
    const [lmap] = useModelState('lmap');

    const [params, setParams] = useModelState('params');
    const targetSubId = params['subId'];
    const [centerOnSubId, setCenterOnSubId] = useState(
        targetSubId === null ? null : { to: targetSubId }
    );

    const geoData = new GeoData(new Map(), new Map());
    geoData.setSubstationPositions(JSON.parse(spos));
    geoData.setLinePositions(JSON.parse(lpos));

    const mapEquipments = new WidgetMapEquipments(
        JSON.parse(smap),
        JSON.parse(lmap)
    );

    useEffect(() => {
        const handleContextmenu = (e) => {
            //e.preventDefault();
            e.stopPropagation();
        };
        networkMapRef.current.addEventListener(
            'contextmenu',
            handleContextmenu
        );
        return () => {
            networkMapRef.current.removeEventListener(
                'contextmenu',
                handleContextmenu
            );
        };
    }, []);

    useEffect(() => {
        const targetSubId = params['subId'];
        if (!('centered' in params)) {
            setCenterOnSubId(targetSubId === null ? null : { to: targetSubId });
            setParams({ ...params, centered: true });
        }
    }, [params]);

    return (
        <div ref={networkMapRef} className="network-map-viewer-widget">
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={darkTheme}>
                    <div
                        style={{
                            position: 'relative',
                            width: 800,
                            height: 600,
                        }}
                    >
                        <NetworkMap
                            ref={networkMapRef}
                            mapEquipments={mapEquipments}
                            geoData={geoData}
                            labelsZoomThreshold={LABELS_ZOOM_THRESHOLD}
                            arrowsZoomThreshold={ARROWS_ZOOM_THRESHOLD}
                            initialZoom={INITIAL_ZOOM}
                            useName={useName}
                            centerOnSubstation={centerOnSubId}
                            onSubstationClick={(vlId) => {
                                console.log('# OpenVoltageLevel: ' + vlId);
                            }}
                            onSubstationClickChooseVoltageLevel={(
                                idSubstation,
                                x,
                                y
                            ) =>
                                console.log(
                                    `# Choose Voltage Level for substation: ${idSubstation}  at coordinates (${x}, ${y})`
                                )
                            }
                            onSubstationMenuClick={(equipment, x, y) =>
                                showEquipmentMenu(equipment, x, y, 'substation')
                            }
                            onLineMenuClick={(equipment, x, y) =>
                                showEquipmentMenu(equipment, x, y, 'line')
                            }
                            onVoltageLevelMenuClick={(equipment, x, y) => {
                                console.log(
                                    `# VoltageLevel menu click: ${JSON.stringify(
                                        equipment
                                    )} at coordinates (${x}, ${y})`
                                );
                            }}
                            mapLibrary={'cartonolabel'}
                            mapTheme={'dark'}
                        />
                    </div>
                </ThemeProvider>
            </StyledEngineProvider>
        </div>
    );
});

export default { render };
