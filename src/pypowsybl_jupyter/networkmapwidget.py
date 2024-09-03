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

from pypowsybl.network import Network

class NetworkMapWidget(anywidget.AnyWidget):
    """
    Creates a Network map widget, displaying substations and lines for a network. The widget allows zooming and panning the map, and filtering based on nominal voltages.

    Args:
        network: the input network.
        subId: if not None, centers the network on the substation with the given substation id. Default is None.
        use_name: When True (default) the widget displays network's elements names (if available, otherwise their ids); When False, the widget displays network's elements ids.
        display_lines: When True (default) the network lines are displayed on the map. When false, the widget displays only the substations.
        use_line_extensions: When False (default) the widget does not use the network's line extensions; Each line is drawn as a straight line connecting two substations.
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

    use_name = traitlets.Bool().tag(sync=True)

    nvls  = traitlets.List().tag(sync=True)

    params  = traitlets.Dict().tag(sync=True)
    
    selected_vl = traitlets.Unicode().tag(sync=True)
    

    def __init__(self, network:Network, subId:str = None, use_name:bool = True, display_lines:bool = True, use_line_extensions = False, nominal_voltages_top_tiers_filter = -1, **kwargs):
        super().__init__(**kwargs)

        (lmap, lpos, smap, spos, vl_subs, sub_vls, subs_ids) = self.extract_map_data(network, display_lines, use_line_extensions)
        self.lmap=json.dumps(lmap)
        self.lpos=json.dumps(lpos)
        self.smap=json.dumps(smap)
        self.spos=json.dumps(spos)
        self.use_name=use_name
        self.params={"subId":  subId}
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

    def extract_map_data(self, network, display_lines, use_line_extensions):
        lmap = []
        lpos = []
        smap = []
        spos = []

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

                if use_line_extensions:
                    lines_positions_from_extensions_df=network.get_extensions('linePosition').reset_index()
                    lines_positions_from_extensions_sorted_df = lines_positions_from_extensions_df.sort_values(by=['id', 'num'])
                    lines_positions_from_extensions_grouped_df = lines_positions_from_extensions_sorted_df.groupby('id').apply(lambda x: x[['latitude', 'longitude']].to_dict('records'), include_groups=False).to_dict()

                    for _, row in lines_positions_df.iterrows():
                        id_val = row['id']
                        coordinates = [{'lat': coord['latitude'], 'lon': coord['longitude']} for coord in lines_positions_from_extensions_grouped_df.get(id_val, [])]
                        if coordinates:    
                            lpos.append({'id': id_val, 'coordinates': coordinates})
                
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

        return (lmap, lpos, smap, spos, vl_subs, sub_vls, subs_ids)

    def extract_nominal_voltage_list(self, network, nvls_top_tiers):
        nvls_filtered = []
        nvls_filtered = sorted(network.get_voltage_levels()['nominal_v'].unique(), reverse=True)
        if nvls_top_tiers != -1  :
            nvls_filtered = nvls_filtered[:nvls_top_tiers]
        return nvls_filtered