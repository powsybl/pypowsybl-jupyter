# Copyright (c) 2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from pypowsybl.network import Network, NadParameters
from .nadwidget import display_nad, update_nad

import ipywidgets as widgets

class NADExplorer(widgets.HBox):
    """
    NAD explorer widget for a network, built with the NAD widget.

    Examples:

        .. code-block:: python

            NADExplorer(pp.network.create_four_substations_node_breaker_network())
    """

    def __init__(self, network: Network, voltage_level_ids : list = None, depth: int = 0, low_nominal_voltage_bound: float = -1, high_nominal_voltage_bound: float = -1, parameters: NadParameters = None, **kwargs):
        """
        Args:
            network: the input network
            voltage_level_ids: the starting list of VL to display. None displays all the network's VLs
            depth: the diagram depth around the voltage level, controls the size of the sub network
            low_nominal_voltage_bound: low bound to filter voltage level according to nominal voltage
            high_nominal_voltage_bound: high bound to filter voltage level according to nominal voltage
            parameters: layout properties to adjust the svg rendering for the nad
        """

        super().__init__(**kwargs)

        self.network = network
        self.vls = network.get_voltage_levels(attributes=[])
        self.voltage_level_ids = voltage_level_ids
        self.nad_widget = None

        self.low_nominal_voltage_bound = low_nominal_voltage_bound
        self.high_nominal_voltage_bound = high_nominal_voltage_bound

        self.selected_vl = list(self.vls.index) if self.voltage_level_ids  is None else self.voltage_level_ids 
        if len(self.selected_vl) == 0:
            raise ValueError("At least one VL must be selected in the voltage_level_ids list")

        self.selected_depth=depth

        self.npars = parameters if parameters is not None else NadParameters(edge_name_displayed=False,
            id_displayed=False,
            edge_info_along_edge=False,
            power_value_precision=1,
            angle_value_precision=0,
            current_value_precision=1,
            voltage_value_precision=0,
            bus_legend=False,
            substation_description_displayed=True)
        
        self.nadslider = widgets.IntSlider(value=self.selected_depth, min=0, max=20, step=1, description='depth:', disabled=False, continuous_update=False, orientation='horizontal', readout=True, readout_format='d')
        
        self.nadslider.observe(self.on_nadslider_changed, names='value')

        self.vl_input = widgets.Text(
            value='',
            placeholder='Voltage level ID',
            description='Filter',
            disabled=False,
            continuous_update=True
        )

        self.vl_input.observe(self.on_text_changed, names='value')
    
        self.found = widgets.SelectMultiple(
            options=list(self.vls.index),
            value=self.selected_vl,
            description='Found',
            disabled=False,
            layout=widgets.Layout(height='570px')
        )
        self.found.observe(self.on_selected, names='value')

        self.update_diagram()

        left_panel = widgets.VBox([widgets.Label('Voltage levels'), self.vl_input, self.found])
        right_panel = widgets.VBox([self.nadslider, self.nad_widget])
        #hbox = widgets.HBox([left_panel, right_panel])
        #hbox.layout.align_items='flex-end'
        self.children=[left_panel, right_panel]
        self.layout.align_items='flex-end'

    def update_diagram(self):
        if len(self.selected_vl)>0:
            new_diagram_data=self.network.get_network_area_diagram(voltage_level_ids=self.selected_vl, depth=self.selected_depth, high_nominal_voltage_bound=self.high_nominal_voltage_bound, low_nominal_voltage_bound=self.low_nominal_voltage_bound, nad_parameters=self.npars)
            if self.nad_widget==None:
                self.nad_widget=display_nad(new_diagram_data)
            else:
                update_nad(self.nad_widget, new_diagram_data)

    def on_nadslider_changed(self, d):
        self.selected_depth=d['new']
        self.update_diagram()
    
    def on_text_changed(self, d):
        self.found.options = list(self.vls[self.vls.index.str.contains(d['new'], regex=False)].index)
        self.selected_vl=[]

    def on_selected(self, d):
        if d['new'] != None:
            self.selected_vl=d['new']
            self.update_diagram()


def nad_explorer(network: Network, voltage_level_ids : list = None, depth: int = 0, low_nominal_voltage_bound: float = -1, high_nominal_voltage_bound: float = -1, parameters: NadParameters = None):
        return NADExplorer(network, voltage_level_ids, depth, high_nominal_voltage_bound, low_nominal_voltage_bound, parameters)
