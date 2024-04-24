# Copyright (c) 2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from pypowsybl.network import Network, NadParameters
from .nadwidget import display_nad, update_nad

import ipywidgets as widgets

def nad_explorer(network: Network, voltage_level_ids : list = None, depth: int = 0, low_nominal_voltage_bound: float = -1, high_nominal_voltage_bound: float = -1, parameters: NadParameters = None):
    """
    Creates a basic nad explorer widget for a network, built with the nad widget.

    Args:
        network: the input network
        voltage_level_ids: the starting list of VL to display. None displays all the network's VLs
        depth: the diagram depth around the voltage level, controls the size of the sub network
        low_nominal_voltage_bound: low bound to filter voltage level according to nominal voltage
        high_nominal_voltage_bound: high bound to filter voltage level according to nominal voltage
        parameters: layout properties to adjust the svg rendering for the nad

    Examples:

        .. code-block:: python

            nad_explorer(pp.network.create_four_substations_node_breaker_network())
    """

    vls = network.get_voltage_levels(attributes=[])
    nad_widget=None

    selected_vl = list(vls.index) if voltage_level_ids  is None else voltage_level_ids 
    if len(selected_vl)==0:
        raise ValueError("At least one VL must be selected in the voltage_level_ids list")

    selected_depth=depth

    npars = parameters if parameters is not None else NadParameters(edge_name_displayed=False,
        id_displayed=False,
        edge_info_along_edge=False,
        power_value_precision=1,
        angle_value_precision=0,
        current_value_precision=1,
        voltage_value_precision=0,
        bus_legend=False,
        substation_description_displayed=True)

    def update_diagram():
        nonlocal nad_widget
        if len(selected_vl)>0:
            new_diagram_data=network.get_network_area_diagram(voltage_level_ids=selected_vl, depth=selected_depth, high_nominal_voltage_bound=high_nominal_voltage_bound, low_nominal_voltage_bound=low_nominal_voltage_bound, nad_parameters=npars)
            if nad_widget==None:
                nad_widget=display_nad(new_diagram_data)
            else:
                update_nad(nad_widget,new_diagram_data)


    nadslider = widgets.IntSlider(value=selected_depth, min=0, max=20, step=1, description='depth:', disabled=False, continuous_update=False, orientation='horizontal', readout=True, readout_format='d')

    def on_nadslider_changed(d):
        nonlocal selected_depth
        selected_depth=d['new']
        update_diagram()

    nadslider.observe(on_nadslider_changed, names='value')

    vl_input = widgets.Text(
        value='',
        placeholder='Voltage level ID',
        description='Filter',
        disabled=False,
        continuous_update=True
    )
    
    def on_text_changed(d):
        nonlocal selected_vl
        found.options = list(vls[vls.index.str.contains(d['new'], regex=False)].index)
        selected_vl=[]
        

    vl_input.observe(on_text_changed, names='value')
    
    found = widgets.SelectMultiple(
        options=list(vls.index),
        value=selected_vl,
        description='Found',
        disabled=False,
        layout=widgets.Layout(height='570px')
    )

    def on_selected(d):
        nonlocal selected_vl
        if d['new'] != None:
            selected_vl=d['new']
            update_diagram()

    found.observe(on_selected, names='value')

    update_diagram()

    left_panel = widgets.VBox([widgets.Label('Voltage levels'), vl_input, found])
    right_panel = widgets.VBox([nadslider, nad_widget])
    hbox = widgets.HBox([left_panel, right_panel])
    hbox.layout.align_items='flex-end'
    
    return hbox