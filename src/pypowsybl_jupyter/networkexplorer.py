# Copyright (c) 2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from pypowsybl.network import Network, NadParameters, LayoutParameters
from .nadwidget import display_nad, update_nad
from .sldwidget import display_sld, update_sld

import ipywidgets as widgets

class NetworkExplorer(widgets.HBox):
    """
    Composite NAD and SLD explorer widget for a network, built on the NAD and SLD widgets. Diagrams are displayed on two different tabs.

    Examples:

        .. code-block:: python

            NetworkExplorer(pp.network.create_eurostag_tutorial_example1_network())
    """    

    def __init__(self, network: Network, vl_id : str = None, depth: int = 0, high_nominal_voltage_bound: float = -1, low_nominal_voltage_bound: float = -1, nad_parameters: NadParameters = None, sld_parameters: LayoutParameters = None, **kwargs):
        """
        Args:
            network: the input network
            vl_id: the starting VL to display. If None, display the first VL from network.get_voltage_levels()
            depth: the diagram depth around the voltage level, controls the size of the sub network. In the SLD tab will be always displayed one diagram, from the VL list currently selected item.
            low_nominal_voltage_bound: low bound to filter voltage level according to nominal voltage
            high_nominal_voltage_bound: high bound to filter voltage level according to nominal voltage
            nad_parameters: layout properties to adjust the svg rendering for the NAD
            sld_parameters: layout properties to adjust the svg rendering for the SLD
        """

        super().__init__(**kwargs)
        self.network = network
        self.vls = network.get_voltage_levels(attributes=[])
        self.nad_widget=None
        self.sld_widget=None

        self.high_nominal_voltage_bound = high_nominal_voltage_bound
        self.low_nominal_voltage_bound = low_nominal_voltage_bound

        self.selected_vl = self.vls.index[0] if vl_id is None else vl_id 
        if self.selected_vl not in self.vls.index:
            raise ValueError(f'a voltage level {vl_id} does not exist in the network.')
            
        self.selected_depth=depth

        self.npars = nad_parameters if nad_parameters is not None else NadParameters(edge_name_displayed=False,
            id_displayed=False,
            edge_info_along_edge=False,
            power_value_precision=1,
            angle_value_precision=0,
            current_value_precision=1,
            voltage_value_precision=0,
            bus_legend=False,
            substation_description_displayed=True)
        
        self.spars=sld_parameters if sld_parameters is not None else LayoutParameters(use_name=True)

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
        
        self.found = widgets.Select(
            options=list(self.vls.index),
            value=self.selected_vl,
            description='Found',
            disabled=False,
            layout=widgets.Layout(height='670px')
        )


        self.found.observe(self.on_selected, names='value')

        self.update_nad_diagram()
        self.update_sld_diagram()

        left_panel = widgets.VBox([widgets.Label('Voltage levels'), self.vl_input, self.found])
        
        right_panel_nad = widgets.VBox([self.nadslider, self.nad_widget])
        right_panel_sld = widgets.HBox([self.sld_widget])

        tabs_diagrams = widgets.Tab()
        tabs_diagrams.children = [right_panel_nad, right_panel_sld]
        tabs_diagrams.titles = ['Network Area', 'Single Line']
        tabs_diagrams.layout=widgets.Layout(width='850px', height='700px')
        
        hbox = widgets.HBox([left_panel, tabs_diagrams])
        hbox.layout.align_items='flex-end'
        self.children = [left_panel, tabs_diagrams]
        self.layout.align_items='flex-end'


    def go_to_vl(self, event: any):
        self.selected_vl= str(event.clicked_nextvl)
        self.found.value=self.selected_vl

    def toggle_switch(self, event: any):
        idswitch = event.clicked_switch.get('id')
        statusswitch = event.clicked_switch.get('switch_status')
        self.network.update_switches(id=idswitch, open=statusswitch)
        self.update_sld_diagram(True)
        self.update_nad_diagram()

    def update_nad_diagram(self):
        if len(self.selected_vl)>0:
            new_diagram_data=self.network.get_network_area_diagram(voltage_level_ids=self.selected_vl, depth=self.selected_depth, high_nominal_voltage_bound=self.high_nominal_voltage_bound, low_nominal_voltage_bound=self.low_nominal_voltage_bound, nad_parameters=self.npars)
            if self.nad_widget==None:
                self.nad_widget=display_nad(new_diagram_data)
            else:
                update_nad(self.nad_widget,new_diagram_data)

    def update_sld_diagram(self, kv: bool = False):
        if self.selected_vl is not None:
            sld_diagram_data=self.network.get_single_line_diagram(self.selected_vl, self.spars)
            if self.sld_widget==None:
                self.sld_widget=display_sld(sld_diagram_data, enable_callbacks=True)
                self.sld_widget.on_nextvl(lambda event: self.go_to_vl(event))
                self.sld_widget.on_switch(lambda event: self.toggle_switch(event))

            else:
                update_sld(self.sld_widget, sld_diagram_data, keep_viewbox=kv, enable_callbacks=True)

    def on_nadslider_changed(self, d):
        self.selected_depth=d['new']
        self.update_nad_diagram()

    def on_text_changed(self, d):
        self.found.options = self.vls[self.vls.index.str.contains(d['new'], regex=False)].index
        if len(self.found.options) > 0:
            self.selected_vl=d['new']
        else:
            self.selected_vl=None

    def on_selected(self, d):
        if d['new'] != None:
            self.selected_vl=d['new']
            self.update_nad_diagram()
            self.update_sld_diagram()


def network_explorer(network: Network, vl_id : str = None, depth: int = 0, high_nominal_voltage_bound: float = -1, low_nominal_voltage_bound: float = -1, nad_parameters: NadParameters = None, sld_parameters: LayoutParameters = None):
        return NetworkExplorer(network, vl_id, depth, high_nominal_voltage_bound, low_nominal_voltage_bound, nad_parameters, sld_parameters)