# Copyright (c) 2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from pypowsybl.network import Network, NadParameters, SldParameters
from .nadwidget import display_nad, update_nad
from .sldwidget import display_sld, update_sld
from .networkmapwidget import NetworkMapWidget
from .selectcontext import SelectContext

import ipywidgets as widgets

def network_explorer(network: Network, vl_id : str = None, use_name:bool = True, depth: int = 0,
                     high_nominal_voltage_bound: float = -1, low_nominal_voltage_bound: float = -1,
                     nominal_voltages_top_tiers_filter:int = -1,
                     nad_parameters: NadParameters = None, sld_parameters: SldParameters = None,
                     use_line_geodata:bool = False):
    """
    Creates a combined NAD and SLD explorer widget for the network. Diagrams are displayed on two different tabs.
    A third tab, 'Network map' displays the network's substations and lines on a map.

    Args:
        network: the input network
        vl_id: the starting VL to display. If None, display the first VL from network.get_voltage_levels()
        use_name: when available, display VLs names instead of their ids (default is to use names)
        depth: the diagram depth around the voltage level, controls the size of the sub network. In the SLD tab will be always displayed one diagram, from the VL list currently selected item.
        low_nominal_voltage_bound: low bound to filter voltage level according to nominal voltage
        high_nominal_voltage_bound: high bound to filter voltage level according to nominal voltage
        nominal_voltages_top_tiers_filter: number of nominal voltages to select in the nominal voltages filter, starting from the highest. -1 means all the nominal  voltages (map viewer tab)
        nad_parameters: layout properties to adjust the svg rendering for the NAD
        sld_parameters: layout properties to adjust the svg rendering for the SLD
        use_line_geodata: When False (default) the network map tab does not use the network's line geodata extensions; Each line is drawn as a straight line connecting two substations.

    Examples:

        .. code-block:: python

            network_explorer(pp.network.create_eurostag_tutorial_example1_network())
    """    

    sel_ctx=SelectContext(network, vl_id, use_name)

    nad_widget=None
    sld_widget=None
    map_widget=None

    selected_depth=depth

    npars = nad_parameters if nad_parameters is not None else NadParameters(edge_name_displayed=False,
        id_displayed=not use_name,
        edge_info_along_edge=False,
        power_value_precision=1,
        angle_value_precision=0,
        current_value_precision=1,
        voltage_value_precision=0,
        bus_legend=False,
        substation_description_displayed=True)
    
    spars=sld_parameters if sld_parameters is not None else SldParameters(use_name=use_name, nodes_infos=True)

    def set_current_vl(id):
        sel_ctx.extend_filtered_vls(id)
        found.value=None
        found.options=sel_ctx.get_filtered_vls_as_list()
        sel_ctx.set_selected(id)
        found.value=sel_ctx.get_selected()	        

    def go_to_vl(event: any):
        arrow_vl= str(event.clicked_nextvl)
        set_current_vl(arrow_vl)

    def toggle_switch(event: any):
        idswitch = event.clicked_switch.get('id')
        statusswitch = event.clicked_switch.get('switch_status')
        network.update_switches(id=idswitch, open=statusswitch)
        update_sld_diagram(True)
        update_nad_diagram()

    def go_to_vl_from_map(event: any):
        vl_from_map= str(event.selected_vl)
        set_current_vl(vl_from_map)
        #switch to the SLD tab
        tabs_diagrams.selected_index=1

    def update_nad_diagram():
        nonlocal nad_widget
        if sel_ctx.get_selected() is not None:
            new_diagram_data=network.get_network_area_diagram(voltage_level_ids=sel_ctx.get_selected(), 
                                                              depth=selected_depth, high_nominal_voltage_bound=high_nominal_voltage_bound, 
                                                              low_nominal_voltage_bound=low_nominal_voltage_bound, nad_parameters=npars)
            if nad_widget==None:
                nad_widget=display_nad(new_diagram_data)
            else:
                update_nad(nad_widget,new_diagram_data)

    def update_sld_diagram(kv: bool = False):
        nonlocal sld_widget
        if sel_ctx.get_selected() is not None:
            sld_diagram_data=network.get_single_line_diagram(sel_ctx.get_selected(), spars)
            if sld_widget==None:
                sld_widget=display_sld(sld_diagram_data, enable_callbacks=True)
                sld_widget.on_nextvl(lambda event: go_to_vl(event))
                sld_widget.on_switch(lambda event: toggle_switch(event))

            else:
                update_sld(sld_widget, sld_diagram_data, keep_viewbox=kv, enable_callbacks=True)

    def update_map():
        nonlocal map_widget
        if sel_ctx.get_selected() is not None:
            if map_widget==None:
                map_widget=NetworkMapWidget(network, use_name=use_name, nominal_voltages_top_tiers_filter = nominal_voltages_top_tiers_filter, use_line_geodata = use_line_geodata)
                map_widget.on_selectvl(lambda event : go_to_vl_from_map(event))

            else:
                map_widget.center_on_voltage_level(sel_ctx.get_selected())

    nadslider = widgets.IntSlider(value=selected_depth, min=0, max=20, step=1, description='depth:', disabled=False, 
                                  continuous_update=False, orientation='horizontal', readout=True, readout_format='d')

    def on_nadslider_changed(d):
        nonlocal selected_depth
        selected_depth=d['new']
        update_nad_diagram()

    nadslider.observe(on_nadslider_changed, names='value')

    vl_input = widgets.Text(
        value='',
        placeholder='Voltage level Name' if use_name else 'Voltage level Id',
        description='Filter',
        disabled=False,
        continuous_update=True,
        layout=widgets.Layout(width='350px')
    )

    def on_text_changed(d):
        nonlocal found
        sel_ctx.apply_filter(d['new'])
        found.value=None
        found.options = sel_ctx.get_filtered_vls_as_list()
        if sel_ctx.is_selected_in_filtered_vls():
            found.value=sel_ctx.get_selected()

    vl_input.observe(on_text_changed, names='value')
    
    found = widgets.Select(
        options=sel_ctx.get_filtered_vls_as_list(),
        value=sel_ctx.get_selected(),
        description='Found',
        disabled=False,
        layout=widgets.Layout(width='350px', height='670px')
    )

    def on_selected(d):
        if d['new'] != None:
            sel_ctx.set_selected(d['new'])
            update_nad_diagram()
            update_sld_diagram()
            update_map()

    found.observe(on_selected, names='value')

    update_nad_diagram()
    update_sld_diagram()
    update_map()

    left_panel = widgets.VBox([widgets.Label('Voltage levels'), vl_input, found])
    
    right_panel_nad = widgets.VBox([nadslider, nad_widget])
    right_panel_sld = widgets.HBox([sld_widget])
    right_panel_map = widgets.HBox([map_widget])

    tabs_diagrams = widgets.Tab()
    tabs_diagrams.children = [right_panel_nad, right_panel_sld, right_panel_map]
    tabs_diagrams.titles = ['Network Area', 'Single Line', 'Network map']
    tabs_diagrams.layout=widgets.Layout(width='850px', height='700px')
    
    hbox = widgets.HBox([left_panel, tabs_diagrams])
    hbox.layout.align_items='flex-end'

    return hbox
    