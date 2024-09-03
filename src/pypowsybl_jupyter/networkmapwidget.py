# Copyright (c) 2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

import pathlib

import anywidget
import traitlets

import json

from ipywidgets import (
    CallbackDispatcher
)

import pandas as pd

from pypowsybl.network import Network

class NetworkMapWidget(anywidget.AnyWidget):
    """
    Creates a Network map widget, displaying substations and lines for a network. The widget allows zooming and panning the map, and filtering based on nominal voltages.

    Args:
        network: the input network.
        sub_id: if not None, centers the network on the substation with the given substation id. Default is None.
        use_name: When True (default) the widget displays network's elements names (if available, otherwise their ids); When False, the widget displays network's elements ids.
        display_lines: When True (default) the network lines are displayed on the map. When false, the widget displays only the substations.
        use_line_geodata: When False (default) the widget does not use the network's line geodata extensions; Each line is drawn as a straight line connecting two substations.
        nominal_voltages_top_tiers_filter: filters the elements in the map based on the network's top nominal voltages. N displays the top n nominal voltages; -1 (default) displays all.


    Returns:
        A jupyter widget with the network map, allowing to zoom and pan the map, and filtering based on nominal voltages.

    Examples:

        .. code-block:: python

            NetworkMapWidget(network)
    """

    _esm = pathlib.Path(__file__).parent / "static" / "networkmapwidget.js"
    _css = pathlib.Path(__file__).parent / "static" / "networkmapwidget.css"
    
    spos = traitlets.Unicode().tag(sync=True)
    lpos = traitlets.Unicode().tag(sync=True)
    smap = traitlets.Unicode().tag(sync=True)
    lmap = traitlets.Unicode().tag(sync=True)
    tlmap = traitlets.Unicode().tag(sync=True)
    hlmap = traitlets.Unicode().tag(sync=True)

    use_name = traitlets.Bool().tag(sync=True)

    nvls  = traitlets.List().tag(sync=True)

    params  = traitlets.Dict().tag(sync=True)
    
    selected_vl = traitlets.Unicode().tag(sync=True)
    

    def __init__(self, network:Network, sub_id:str = None, use_name:bool = True, display_lines:bool = True, use_line_geodata:bool = False, nominal_voltages_top_tiers_filter = -1, **kwargs):
        super().__init__(**kwargs)

        (lmap, lpos, smap, spos, vl_subs, sub_vls, subs_ids, tlmap, hlmap) = self.extract_map_data(network, display_lines, use_line_geodata)
        self.lmap=json.dumps(lmap)
        self.lpos=json.dumps(lpos)
        self.smap=json.dumps(smap)
        self.spos=json.dumps(spos)
        self.tlmap=json.dumps(tlmap)
        self.hlmap=json.dumps(hlmap)
        self.use_name=use_name
        self.params={"subId":  sub_id}
        self.vl_subs=vl_subs
        self.sub_vls=sub_vls
        self.subs_ids=subs_ids
        self.nvls=self.extract_nominal_voltage_list(network, nominal_voltages_top_tiers_filter)

        self._on_selectvl_handlers = CallbackDispatcher()
        super().on_msg(self._handle_pw_msg)

    def _handle_pw_msg(self, _, content, buffers):
        if content.get('event', '') == 'select_vl':
            self.selectvl()

    def selectvl(self):
        self._on_selectvl_handlers(self)

    def on_selectvl(self, callback, remove=False):
        self._on_selectvl_handlers.register_callback(callback, remove=remove)

    def get_substation_id(self, vl_id):
        return self.vl_subs.get(vl_id, None)

    def get_vls_ids(self, sub_id):
        return self.sub_vls.get(sub_id, None)

    def center_on_substation(self, sub_id):
        if sub_id in self.subs_ids:
            self.params = {"subId":  sub_id}

    def center_on_voltage_level(self, vl_id):
        sub_id=self.get_substation_id(vl_id)
        if sub_id is not None:
            self.params = {"subId":  sub_id}

    def get_tie_lines_info(self, network, vls_with_coords):
        ties_df=network.get_tie_lines().reset_index()[['id', 'name', 'dangling_line1_id', 'dangling_line2_id']]
        danglings_df=network.get_dangling_lines().reset_index()[['id', 'name', 'p', 'i', 'voltage_level_id', 'connected']]
        tie_lines_info=[]
        if not(ties_df.empty or danglings_df.empty):
            tie_d_1 = pd.merge(ties_df, danglings_df, left_on='dangling_line1_id', right_on='id', suffixes=('', '_d1'))
            tie_d_1.rename(columns={'name': 'name_T', 'dangling_line1_id_d1': 'dangling_line1_id_d1_D', 'id_d1': 'd_id1_D'}, inplace=True)
            tie_d_2 = pd.merge(tie_d_1, danglings_df, left_on='dangling_line2_id', right_on='id', suffixes=('_d1', '_d2'))
            tie_res = tie_d_2[['id_d1' ,'name_T', 'voltage_level_id_d1', 'voltage_level_id_d2', 'connected_d1', 'connected_d2', 'p_d1', 'p_d2', 'i_d1', 'i_d2']]
            tie_res = tie_res.fillna(0)
            tie_res.columns = ['id', 'name', 'voltageLevelId1', 'voltageLevelId2', 'terminal1Connected', 'terminal2Connected', 'p1', 'p2', 'i1', 'i2']
            tie_res=tie_res[tie_res['voltageLevelId1'].isin(vls_with_coords.index) & tie_res['voltageLevelId2'].isin(vls_with_coords.index)]
            tie_lines_info = tie_res.to_dict(orient='records') 
        return tie_lines_info

    def get_hvdc_lines_info(self, network, vls_with_coords):
        hvdc_lines_df = network.get_hvdc_lines().reset_index()[['id', 'name', 'converters_mode', 'converter_station1_id', 'converter_station2_id', 'connected1', 'connected2']]	
        lcc_stations_df = network.get_lcc_converter_stations().reset_index()[['id', 'name', 'p', 'i', 'voltage_level_id']]
        vsc_stations_df = network.get_vsc_converter_stations().reset_index()[['id', 'name', 'p', 'i', 'voltage_level_id']]
        stations_df = pd.concat([lcc_stations_df, vsc_stations_df])
        hvdc_lines_info = []
        if not(hvdc_lines_df.empty or stations_df.empty):
            hvdc_s_1=pd.merge(hvdc_lines_df, stations_df, left_on='converter_station1_id', right_on='id', suffixes=('', '_s1'))
            hvdc_s_1.rename(columns={'name': 'name_S', 'id_s1': 'id_s1_S'}, inplace=True)
            hvdc_s_2=pd.merge(hvdc_s_1, stations_df, left_on='converter_station2_id', right_on='id', suffixes=('_s1', '_s2'))
            h_res= hvdc_s_2[['id_s1' ,'name_S', 'voltage_level_id_s1', 'voltage_level_id_s2', 'connected1', 'connected2', 'p_s1', 'p_s2', 'i_s1', 'i_s2']]
            h_res = h_res.fillna(0)
            h_res.columns = ['id', 'name', 'voltageLevelId1', 'voltageLevelId2', 'terminal1Connected', 'terminal2Connected', 'p1', 'p2', 'i1', 'i2']
            h_res=h_res[h_res['voltageLevelId1'].isin(vls_with_coords.index) & h_res['voltageLevelId2'].isin(vls_with_coords.index)]
            hvdc_lines_info = h_res.to_dict(orient='records')    
        return hvdc_lines_info            

    def extract_map_data(self, network, display_lines, use_line_geodata):
        lmap = []
        lpos = []
        smap = []
        spos = []
        tlmap = []
        hlmap = []

        vl_subs = dict()
        sub_vls = dict()
        subs_ids = set()

        subs_positions_df = network.get_extensions('substationPosition')
        if not subs_positions_df.empty:

            subs_df = network.get_substations()

            subs_positions_df = subs_df.merge(subs_positions_df, left_on='id', right_on='id')[['name','latitude','longitude']]
            
            vls_df = network.get_voltage_levels().reset_index()
            vls_subs_df = vls_df.merge(subs_positions_df, left_on='substation_id', right_on='id')[['id','name_x','substation_id','name_y','nominal_v','latitude','longitude']]

            if display_lines:
                lines_df = network.get_lines().reset_index()[['id','name','voltage_level1_id','voltage_level2_id','connected1','connected2','p1','p2','i1','i2']]
                lines_positions_df = lines_df.merge(vls_subs_df[['id', 'latitude', 'longitude']], how='left', left_on='voltage_level1_id', right_on='id')
                lines_positions_df = lines_positions_df.rename(columns={'latitude': 'v1_latitude', 'longitude': 'v1_longitude', 'id_x': 'id'})
                lines_positions_df = lines_positions_df.drop(columns=['id_y'])

                lines_positions_df = lines_positions_df.merge(vls_subs_df[['id', 'latitude', 'longitude']], how='left', left_on='voltage_level2_id', right_on='id')
                lines_positions_df = lines_positions_df.rename(columns={'latitude': 'v2_latitude', 'longitude': 'v2_longitude','id_x': 'id'})
                lines_positions_df = lines_positions_df.drop(columns=['id_y'])

                lines_positions_df = lines_positions_df.dropna(subset=['v1_latitude', 'v1_longitude', 'v2_latitude', 'v2_longitude'])
                lines_positions_df = lines_positions_df.fillna(0)

                lmap = lines_positions_df[['id', 'name', 'voltage_level1_id', 'voltage_level2_id', 'connected1', 'connected2', 'p1', 'p2', 'i1', 'i2']].rename(columns={
                    'voltage_level1_id': 'voltageLevelId1',
                    'voltage_level2_id': 'voltageLevelId2',
                    'connected1': 'terminal1Connected',
                    'connected2': 'terminal2Connected'
                }).to_dict(orient='records')

                if use_line_geodata:
                    lines_positions_from_extensions_df=network.get_extensions('linePosition').reset_index()
                    lines_positions_from_extensions_sorted_df = lines_positions_from_extensions_df.sort_values(by=['id', 'num'])
                    lines_positions_from_extensions_grouped_df = lines_positions_from_extensions_sorted_df.groupby('id').apply(lambda x: x[['latitude', 'longitude']].to_dict('records'), include_groups=False).to_dict()

                    for _, row in lines_positions_df.iterrows():
                        id_val = row['id']
                        coordinates = [{'lat': coord['latitude'], 'lon': coord['longitude']} for coord in lines_positions_from_extensions_grouped_df.get(id_val, [])]
                        if coordinates:    
                            lpos.append({'id': id_val, 'coordinates': coordinates})

                vls_with_coords = vls_subs_df.set_index('id')[[]]
                tlmap = self.get_tie_lines_info(network, vls_with_coords)
                hlmap = self.get_hvdc_lines_info(network, vls_with_coords)
                
                # note that if there are no linePositions for a line, the viewer component draws the lines using the substation positions

            for s_id, group in vls_subs_df.groupby('substation_id'):
                entry = {
                    "id": s_id,
                    "name": group['name_y'].iloc[0],  # name from df1
                    "voltageLevels": [
                        {
                            "id": row['id'],  # id from df2
                            "name": row['name_x'],
                            "substationId": row['substation_id'],
                            "nominalV": row['nominal_v']
                        } for _, row in group.iterrows()
                    ]
                }
                smap.append(entry)

            spos = [
                {
                    "id": row['id'],
                    "coordinate": {
                        "lat": row['latitude'],
                        "lon": row['longitude']
                    }
                }
                for _, row in subs_positions_df.reset_index().iterrows()
            ]

            vl_subs = vls_df.set_index('id')['substation_id'].to_dict()
            sub_vls = vls_df.groupby('substation_id')['id'].apply(list).to_dict()
            subs_ids = set(network.get_substations().reset_index()['id'])

        return (lmap, lpos, smap, spos, vl_subs, sub_vls, subs_ids, tlmap, hlmap)

    def extract_nominal_voltage_list(self, network, nvls_top_tiers):
        nvls_filtered = []
        nvls_filtered = sorted(network.get_voltage_levels()['nominal_v'].unique(), reverse=True)
        if nvls_top_tiers != -1  :
            nvls_filtered = nvls_filtered[:nvls_top_tiers]
        return nvls_filtered