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

const INITIAL_ZOOM = 9;
const LABELS_ZOOM_THRESHOLD = 9;
const ARROWS_ZOOM_THRESHOLD = 7;
const useName = true;

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

    let model = useModel();

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

    const [
        choiceVoltageLevelsSubstationId,
        setChoiceVoltageLevelsSubstationId,
    ] = useState(null);

    const [position, setPosition] = useState([-1, -1]);

    function closeChoiceVoltageLevelMenu() {
        setChoiceVoltageLevelsSubstationId(null);
    }

    function propagate_selectedvl_event(voltageLevelId) {
        model.set('selected_vl', voltageLevelId);
        model.save_changes();
        model.send({ event: 'select_vl' });
    }

    function choiceVoltageLevel(voltageLevelId) {
        console.log(`# Choose Voltage Level : ${voltageLevelId}`);
        closeChoiceVoltageLevelMenu();
        propagate_selectedvl_event(voltageLevelId);
    }

    let choiceVoltageLevelsSubstation = null;
    if (choiceVoltageLevelsSubstationId) {
        choiceVoltageLevelsSubstation = mapEquipments?.getSubstation(
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

    function renderVoltageLevelChoice() {
        return (
            <VoltageLevelChoice
                handleClose={closeChoiceVoltageLevelMenu}
                onClickHandler={choiceVoltageLevel}
                substation={choiceVoltageLevelsSubstation}
                position={[position[0], position[1]]}
            />
        );
    }

    const [filteredNominalVoltages, setFilteredNominalVoltages] = useState();

    function renderNominalVoltageFilter() {
        return (
            <Box sx={styles.divNominalVoltageFilter}>
                <NominalVoltageFilter
                    nominalVoltages={mapEquipments.getNominalVoltages()}
                    filteredNominalVoltages={filteredNominalVoltages}
                    onChange={setFilteredNominalVoltages}
                />
            </Box>
        );
    }

    const renderMap = () => (
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
                propagate_selectedvl_event(vlId);
            }}
            onSubstationClickChooseVoltageLevel={
                chooseVoltageLevelForSubstation
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
                        {renderMap()}
                        {choiceVoltageLevelsSubstationId &&
                            renderVoltageLevelChoice()}

                        {mapEquipments?.substations?.length > 0 &&
                            renderNominalVoltageFilter()}
                    </div>
                </ThemeProvider>
            </StyledEngineProvider>
        </div>
    );
});

export default { render };
