/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { createRender, useModelState, useModel, useExperimental } from '@anywidget/react';

import { NetworkMap, GeoData, MapEquipments } from '@powsybl/network-viewer';
import VoltageLevelChoice from './voltage-level-choice';
import NominalVoltageFilter from './nominal-voltage-filter';

import './networkmapwidget.css';

import { Box, createTheme, LinearProgress, ThemeProvider, StyledEngineProvider } from '@mui/material';

const INITIAL_ZOOM = 0;
const LABELS_ZOOM_THRESHOLD = 9;
const ARROWS_ZOOM_THRESHOLD = 7;

const styles = {
    divNominalVoltageFilter: {
        position: 'absolute',
        right: '10px',
        bottom: '40px',
        zIndex: 0,
        '&:hover': {
            zIndex: 2,
        },
    },
    divTemporaryGeoDataLoading: {
        position: 'absolute',
        width: '100%',
        zIndex: 2,
    },
};

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
});

const lightTheme = createTheme({
    palette: {
        mode: 'light',
    },
    link: {
        color: 'blue',
    },
    node: {
        background: '#1976d2',
        hover: '#84adce',
        border: '#0f3d68',
    },
    selectedRow: {
        background: '#8E9C9B',
    },
});

class WidgetMapEquipments extends MapEquipments {
    initEquipments(smapdata, lmapdata, tlmapdata, hlmapdata) {
        this.updateSubstations(smapdata, true);
        this.updateLines(lmapdata, true);
        this.updateTieLines(tlmapdata, true);
        this.updateHvdcLines(hlmapdata, true);
    }

    constructor(smapdata, lmapdata, tlmapdata, hlmapdata) {
        super();
        this.initEquipments(smapdata, lmapdata, tlmapdata, hlmapdata);
    }
}

const render = createRender(() => {
    const networkMapRef = useRef();

    let model = useModel();
    let experimental = useExperimental();

    const [spos] = useModelState('spos');
    const [lpos] = useModelState('lpos');
    const [smap] = useModelState('smap');
    const [lmap] = useModelState('lmap');
    const [tlmap] = useModelState('tlmap');
    const [hlmap] = useModelState('hlmap');

    const [use_name] = useModelState('use_name');

    const [params, setParams] = useModelState('params');
    const [nvls] = useModelState('nvls');

    const [enable_callbacks] = useModelState('enable_callbacks');

    const targetSubId = params['subId'];
    const [centerOnSubId, setCenterOnSubId] = useState(targetSubId === null ? null : { to: targetSubId });

    const [mapDataReady, setMapDataReady] = useState(false);

    const [equipmentData, setEquipmentData] = useState({
        gdata: new GeoData(new Map(), new Map()),
        edata: new WidgetMapEquipments([], [], [], []),
    });

    const [dark_mode] = useModelState('dark_mode');

    const [is_hover_enabled] = useModelState('hover_enabled');

    useEffect(() => {
        let initDataTask = new Promise((resolve, reject) => {
            const geoData = new GeoData(new Map(), new Map());
            geoData.setSubstationPositions(JSON.parse(spos));
            geoData.setLinePositions(JSON.parse(lpos));
            const mapEquipments = new WidgetMapEquipments(
                JSON.parse(smap),
                JSON.parse(lmap),
                JSON.parse(tlmap),
                JSON.parse(hlmap)
            );
            resolve({ gdata: geoData, edata: mapEquipments });
        });
        initDataTask.then((result) => {
            setMapDataReady(true);
            setEquipmentData(result);
        });
    }, []);

    useEffect(() => {
        const targetSubId = params['subId'];
        if (!('centered' in params)) {
            setCenterOnSubId(targetSubId === null ? null : { to: targetSubId });
            setParams({ ...params, centered: true });
        }
    }, [params]);

    const [choiceVoltageLevelsSubstationId, setChoiceVoltageLevelsSubstationId] = useState(null);

    const [position, setPosition] = useState([-1, -1]);

    function closeChoiceVoltageLevelMenu() {
        setChoiceVoltageLevelsSubstationId(null);
    }

    function propagate_selectedvl_event(voltageLevelId) {
        if (enable_callbacks) {
            model.set('selected_vl', voltageLevelId);
            model.save_changes();
            model.send({ event: 'select_vl' });
        }
    }

    function choiceVoltageLevel(voltageLevelId) {
        closeChoiceVoltageLevelMenu();
        propagate_selectedvl_event(voltageLevelId);
    }

    let choiceVoltageLevelsSubstation = null;
    if (choiceVoltageLevelsSubstationId) {
        choiceVoltageLevelsSubstation = equipmentData.edata?.getSubstation(choiceVoltageLevelsSubstationId);
    }

    const chooseVoltageLevelForSubstation = useCallback((idSubstation, x, y) => {
        setChoiceVoltageLevelsSubstationId(idSubstation);
        setPosition([x, y]);
    }, []);

    const useNameOrId = () => {
        const useName = use_name;
        const getNameOrId = useCallback(
            (infos) => {
                if (infos != null) {
                    const name = infos.name;
                    return useName && name != null && name.trim() !== '' ? name : infos?.id;
                }
                return null;
            },
            [useName]
        );
        return { getNameOrId };
    };

    function renderVoltageLevelChoice() {
        return (
            <VoltageLevelChoice
                handleClose={closeChoiceVoltageLevelMenu}
                onClickHandler={choiceVoltageLevel}
                substation={choiceVoltageLevelsSubstation}
                position={[position[0], position[1]]}
                useNameOrId={useNameOrId}
            />
        );
    }

    const [filteredNominalVoltages, setFilteredNominalVoltages] = useState(nvls);

    function renderNominalVoltageFilter() {
        return (
            <Box sx={styles.divNominalVoltageFilter}>
                <NominalVoltageFilter
                    nominalVoltages={equipmentData.edata.getNominalVoltages()}
                    filteredNominalVoltages={filteredNominalVoltages}
                    onChange={setFilteredNominalVoltages}
                />
            </Box>
        );
    }

    async function getPopupContent(elementId) {
        try {
            const [retInfo, _buffers] = await experimental.invoke('_get_on_hover_info', { id: elementId });
            return retInfo;
        } catch (e) {
            return `Error retrieving hover info: ${e}`;
        }
    }

    const [hoverLineData, setHoverLineData] = useState(null);
    const lastLineId = useRef(null);
    const debounceTimer = useRef(null);

    const debounceDelay = 300;

    const renderPopup = (popupData, isStale) =>
        isStale || popupData === null ? (
            ''
        ) : (
            <div
                style={{
                    position: 'relative',
                    top: '0px',
                    left: '10px',
                    display: 'block',
                    backgroundColor: 'white',
                    border: '1px solid black',
                    padding: '5px',
                    pointerEvents: 'none',
                    fontFamily: 'sans-serif',
                    fontSize: '12px',
                    zIndex: '999',
                }}
            >
                <div
                    dangerouslySetInnerHTML={{
                        __html: popupData,
                    }}
                />
            </div>
        );

    // cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    const renderLinePopover = useCallback(
        (lineId, ref) => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            const isStale = lineId === lastLineId.current && ref === null;

            if (lineId === lastLineId.current) {
                return renderPopup(hoverLineData, isStale);
            }

            debounceTimer.current = setTimeout(() => {
                lastLineId.current = lineId;
                getPopupContent(lineId)
                    .then((data) => {
                        if (lineId === lastLineId.current) {
                            setHoverLineData(data);
                        }
                    })
                    .catch((error) => {
                        console.error('Error loading data: ', error);
                        if (lineId === lastLineId.current) {
                            setHoverLineData('Error loading data');
                        }
                    });
            }, debounceDelay);

            return renderPopup(null, false);
        },
        [hoverLineData]
    );

    const renderMap = () => (
        <NetworkMap
            ref={networkMapRef}
            mapEquipments={equipmentData.edata}
            geoData={equipmentData.gdata}
            labelsZoomThreshold={LABELS_ZOOM_THRESHOLD}
            arrowsZoomThreshold={ARROWS_ZOOM_THRESHOLD}
            initialZoom={INITIAL_ZOOM}
            useName={use_name}
            centerOnSubstation={centerOnSubId}
            onSubstationClick={(vlId) => {
                propagate_selectedvl_event(vlId);
            }}
            onSubstationClickChooseVoltageLevel={chooseVoltageLevelForSubstation}
            mapLibrary={'cartonolabel'}
            mapTheme={dark_mode ? 'dark' : 'light'}
            filteredNominalVoltages={filteredNominalVoltages}
            renderPopover={is_hover_enabled ? renderLinePopover : null}
        />
    );

    return (
        <div ref={networkMapRef} className="network-map-viewer-widget">
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={dark_mode ? darkTheme : lightTheme}>
                    <div
                        style={{
                            position: 'relative',
                            width: 800,
                            height: 600,
                        }}
                    >
                        <Box sx={styles.divTemporaryGeoDataLoading}>{!mapDataReady && <LinearProgress />}</Box>

                        {renderMap()}
                        {choiceVoltageLevelsSubstationId && renderVoltageLevelChoice()}

                        {equipmentData.edata?.substations?.length > 0 && renderNominalVoltageFilter()}
                    </div>
                </ThemeProvider>
            </StyledEngineProvider>
        </div>
    );
});

export default { render };
