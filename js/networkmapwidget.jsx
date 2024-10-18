/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { createRender, useModelState, useModel } from '@anywidget/react';
import { NetworkMap, GeoData, MapEquipments } from '@powsybl/diagram-viewer';
import VoltageLevelChoice from './voltage-level-choice';
import NominalVoltageFilter from './nominal-voltage-filter';

import './networkmapwidget.css';

import {
    createTheme,
    ThemeProvider,
    StyledEngineProvider,
} from '@mui/material/styles';
import { Box } from '@mui/system';
import LinearProgress from '@mui/material/LinearProgress';

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
    mapboxStyle: 'mapbox://styles/mapbox/dark-v9',
    aggrid: 'ag-theme-alpine-dark',
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
    const [centerOnSubId, setCenterOnSubId] = useState(
        targetSubId === null ? null : { to: targetSubId }
    );

    const [mapDataReady, setMapDataReady] = useState(false);

    const [equipmentData, setEquipmentData] = useState({
        gdata: new GeoData(new Map(), new Map()),
        edata: new WidgetMapEquipments([], [], [], []),
    });

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

    const [
        choiceVoltageLevelsSubstationId,
        setChoiceVoltageLevelsSubstationId,
    ] = useState(null);

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
        choiceVoltageLevelsSubstation = equipmentData.edata?.getSubstation(
            choiceVoltageLevelsSubstationId
        );
    }

    const chooseVoltageLevelForSubstation = useCallback(
        (idSubstation, x, y) => {
            setChoiceVoltageLevelsSubstationId(idSubstation);
            setPosition([x, y]);
        },
        []
    );

    const useNameOrId = () => {
        const useName = use_name;
        const getNameOrId = useCallback(
            (infos) => {
                if (infos != null) {
                    const name = infos.name;
                    return useName && name != null && name.trim() !== ''
                        ? name
                        : infos?.id;
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

    const [filteredNominalVoltages, setFilteredNominalVoltages] =
        useState(nvls);

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
            onSubstationClickChooseVoltageLevel={
                chooseVoltageLevelForSubstation
            }
            mapLibrary={'cartonolabel'}
            mapTheme={'dark'}
            filteredNominalVoltages={filteredNominalVoltages}
        />
    );

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
                        <Box sx={styles.divTemporaryGeoDataLoading}>
                            {!mapDataReady && <LinearProgress />}
                        </Box>

                        {renderMap()}
                        {choiceVoltageLevelsSubstationId &&
                            renderVoltageLevelChoice()}

                        {equipmentData.edata?.substations?.length > 0 &&
                            renderNominalVoltageFilter()}
                    </div>
                </ThemeProvider>
            </StyledEngineProvider>
        </div>
    );
});

export default { render };
