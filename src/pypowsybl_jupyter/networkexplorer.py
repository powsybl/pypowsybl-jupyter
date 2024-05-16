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

def network_explorer(network: Network, vl_id : str = None, depth: int = 0, high_nominal_voltage_bound: float = -1, low_nominal_voltage_bound: float = -1, nad_parameters: NadParameters = None, sld_parameters: LayoutParameters = None):
    """
    Creates a combined NAD and SLD explorer widget for the network. Diagrams are displayed on two different tabs.

    Args:
        network: the input network
        vl_id: the starting VL to display. If None, display the first VL from network.get_voltage_levels()
        depth: the diagram depth around the voltage level, controls the size of the sub network. In the SLD tab will be always displayed one diagram, from the VL list currently selected item.
        low_nominal_voltage_bound: low bound to filter voltage level according to nominal voltage
        high_nominal_voltage_bound: high bound to filter voltage level according to nominal voltage
        nad_parameters: layout properties to adjust the svg rendering for the NAD
        sld_parameters: layout properties to adjust the svg rendering for the SLD

    Examples:

        .. code-block:: python

            network_explorer(pp.network.create_eurostag_tutorial_example1_network())
    """    

    vls = network.get_voltage_levels(attributes=[])
    nad_widget=None
    sld_widget=None

    selected_vl = vls.index[0] if vl_id is None else vl_id 
    if selected_vl not in vls.index:
        raise ValueError(f'a voltage level {vl_id} does not exist in the network.')
        
    selected_depth=depth

    npars = nad_parameters if nad_parameters is not None else NadParameters(edge_name_displayed=False,
        id_displayed=False,
        edge_info_along_edge=False,
        power_value_precision=1,
        angle_value_precision=0,
        current_value_precision=1,
        voltage_value_precision=0,
        bus_legend=False,
        substation_description_displayed=True)
    
    spars=sld_parameters if sld_parameters is not None else LayoutParameters(use_name=True)

    def go_to_vl(event: any):
        nonlocal selected_vl
        selected_vl= str(event.clicked_nextvl)
        found.value=selected_vl

    def toggle_switch(event: any):
        idswitch = event.clicked_switch.get('id')
        statusswitch = event.clicked_switch.get('switch_status')
        network.update_switches(id=idswitch, open=statusswitch)
        update_sld_diagram(True)
        update_nad_diagram()


    def update_nad_diagram():
        nonlocal nad_widget
        if len(selected_vl)>0:
            new_diagram_data=network.get_network_area_diagram(voltage_level_ids=selected_vl, depth=selected_depth, high_nominal_voltage_bound=high_nominal_voltage_bound, low_nominal_voltage_bound=low_nominal_voltage_bound, nad_parameters=npars)
            if nad_widget==None:
                nad_widget=display_nad(new_diagram_data)
            else:
                update_nad(nad_widget,new_diagram_data)

    def update_sld_diagram(kv: bool = False):
        nonlocal sld_widget
        if selected_vl is not None:
            sld_diagram_data=network.get_single_line_diagram(selected_vl, spars)
            if sld_widget==None:
                sld_widget=display_sld(sld_diagram_data, enable_callbacks=True)
                sld_widget.on_nextvl(lambda event: go_to_vl(event))
                sld_widget.on_switch(lambda event: toggle_switch(event))

            else:
                update_sld(sld_widget, sld_diagram_data, keep_viewbox=kv, enable_callbacks=True)


    nadslider = widgets.IntSlider(value=selected_depth, min=0, max=20, step=1, description='depth:', disabled=False, continuous_update=False, orientation='horizontal', readout=True, readout_format='d')

    def on_nadslider_changed(d):
        nonlocal selected_depth
        selected_depth=d['new']
        update_nad_diagram()

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
        found.options = vls[vls.index.str.contains(d['new'], regex=False)].index
        if len(found.options) > 0:
            selected_vl=d['new']
        else:
            selected_vl=None   

    vl_input.observe(on_text_changed, names='value')
    
    found = widgets.Select(
        options=list(vls.index),
        value=selected_vl,
        description='Found',
        disabled=False,
        layout=widgets.Layout(height='670px')
    )

    def on_selected(d):
        nonlocal selected_vl
        if d['new'] != None:
            selected_vl=d['new']
            update_nad_diagram()
            update_sld_diagram()

    found.observe(on_selected, names='value')

    update_nad_diagram()
    update_sld_diagram()

    left_panel = widgets.VBox([widgets.Label('Voltage levels'), vl_input, found])
    
    right_panel_nad = widgets.VBox([nadslider, nad_widget])
    right_panel_sld = widgets.HBox([sld_widget])

    tabs_diagrams = widgets.Tab()
    tabs_diagrams.children = [right_panel_nad, right_panel_sld]
    tabs_diagrams.titles = ['Network Area', 'Single Line']
    tabs_diagrams.layout=widgets.Layout(width='850px', height='700px')
    
    hbox = widgets.HBox([left_panel, tabs_diagrams])
    hbox.layout.align_items='flex-end'

    return hbox
    