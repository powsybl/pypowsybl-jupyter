# Copyright (c) 2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from pypowsybl.network import Network, NadParameters, SldParameters, NadLayoutType, NadProfile
from .nadwidget import display_nad, update_nad
from .sldwidget import display_sld, update_sld
from .networkmapwidget import NetworkMapWidget
from .selectcontext import SelectContext
from .assets import EMPTY_SVG, PROGRESS_BAR_SVG, PROGRESS_EMPTY_SVG

from IPython.display import display
import ipywidgets as widgets
import json
import pandas as pd

def network_explorer(network: Network, vl_id : str = None, use_name:bool = True, depth: int = 1,
                     high_nominal_voltage_bound: float = -1, low_nominal_voltage_bound: float = -1,
                     nominal_voltages_top_tiers_filter:int = -1,
                     nad_parameters: NadParameters = None, sld_parameters: SldParameters = None,
                     use_line_geodata:bool = False, nad_profile: NadProfile = None):
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
        nad_profile: property to customize labels and style for the NAD

    Examples:

        .. code-block:: python

            network_explorer(pp.network.create_eurostag_tutorial_example1_network())
    """

    sel_ctx=SelectContext(network, vl_id, use_name, history_max_length = 10)

    nad_widget=None
    sld_widget=None
    map_widget=None

    selected_depth=depth

    npars = nad_parameters if nad_parameters is not None else NadParameters(edge_name_displayed=False,
        id_displayed=not use_name,
        edge_info_along_edge=True,
        power_value_precision=1,
        angle_value_precision=0,
        current_value_precision=1,
        voltage_value_precision=0,
        bus_legend=True,
        substation_description_displayed=True,
        layout_type=NadLayoutType.FORCE_LAYOUT
        )
    
    spars=sld_parameters if sld_parameters is not None else SldParameters(use_name=use_name, nodes_infos=True)

    NAD_TAB_INDEX = 0

    def go_to_vl(event: any):
        arrow_vl= str(event.clicked_nextvl)
        if arrow_vl != sel_ctx.get_selected():
            sel_ctx.set_selected(arrow_vl, add_to_history=True)
            update_select_widget(history, sel_ctx.get_selected(), sel_ctx.get_history_as_list(), on_selected_history)
            update_select_widget(found, sel_ctx.get_selected() if sel_ctx.is_selected_in_filtered_vls() else None, None, on_selected)
            update_explorer()
        history.focus()
        
    nad_displayed_vl_id=None
    
    def toggle_switch(event: any):
        nonlocal nad_displayed_vl_id
        idswitch = event.clicked_switch.get('id')
        statusswitch = event.clicked_switch.get('switch_status')
        network.update_switches(id=idswitch, open=statusswitch)
        update_sld_diagram(sel_ctx.get_selected(), True)
        #force a NAD update, as soon as the NAD tab is selected
        nad_displayed_vl_id=None

    def select_vl_and_activate_sld_tab(vl_id: str):
        #first, switch to the SLD tab
        tabs_diagrams.selected_index=1
        
        #then, updates explorer's content
        if vl_id != sel_ctx.get_selected():
            sel_ctx.set_selected(vl_id, add_to_history=True)
            update_select_widget(history, sel_ctx.get_selected(), sel_ctx.get_history_as_list(), on_selected_history)
            update_select_widget(found, sel_ctx.get_selected() if sel_ctx.is_selected_in_filtered_vls() else None, None, on_selected)
            update_explorer()
        history.focus()

    def go_to_vl_from_map(event: any):
        vl_id= str(event.selected_vl)
        select_vl_and_activate_sld_tab(vl_id)

    def select_nad_node(event: any):
        nonlocal current_nad_metadata
        vl_id= str(event.selected_node['equipment_id'])
        if vl_id in sel_ctx.vls.index:
            select_vl_and_activate_sld_tab(vl_id)

    def select_nad_menu(event: any):
        nonlocal current_nad_metadata
        vl_id= str(event.selected_menu['equipment_id'])
        if vl_id in sel_ctx.vls.index:
            # menu items are 0: SLD, 1: Expand, 2: Remove
            selected_action = event.selected_menu['selection']
            if selected_action == 0:
                select_vl_and_activate_sld_tab(vl_id)
            else:
                if nad_widget.current_nad_metadata != '':
                    current_nad_metadata=nad_widget.current_nad_metadata
                if selected_action == 1:
                    update_nad_diagram(sel_ctx.get_selected(), vl_action=vl_id, action=1)
                elif selected_action == 2:
                    update_nad_diagram(sel_ctx.get_selected(), vl_action=vl_id, action=2)

    def compute_sld_data(el):
        if el is not None:
            sld_data=network.get_single_line_diagram(el, spars)
        else:
            sld_data=EMPTY_SVG
        return sld_data
    
    current_sld_data = compute_sld_data(None)

    def update_sld_widget(sld_diagram_data, kv: bool = False, enable_callbacks=True):
        nonlocal sld_widget
        if sld_widget==None:
            sld_widget=display_sld(sld_diagram_data, enable_callbacks=enable_callbacks)
            sld_widget.on_nextvl(lambda event: go_to_vl(event))
            sld_widget.on_switch(lambda event: toggle_switch(event))

        else:
            update_sld(sld_widget, sld_diagram_data, keep_viewbox=kv, enable_callbacks=enable_callbacks)

    def update_sld_diagram(el, kv: bool = False):
        nonlocal current_sld_data
        current_sld_data=compute_sld_data(el)
        update_sld_widget(current_sld_data, kv, enable_callbacks=True)

    def update_map(el):
        nonlocal map_widget
        if el is not None:
            if map_widget==None:
                map_widget=NetworkMapWidget(network, use_name=use_name, nominal_voltages_top_tiers_filter = nominal_voltages_top_tiers_filter)
                map_widget.on_selectvl(lambda event : go_to_vl_from_map(event))
            else:
                map_widget.center_on_voltage_level(el)
    
    nadslider = widgets.IntSlider(value=selected_depth, min=0, max=20, step=1, description='depth:', disabled=False, 
                                  continuous_update=False, orientation='horizontal', readout=True, readout_format='d',
                                  style={'description_width': 'initial'})

    def on_nadslider_changed(d):
        nonlocal selected_depth
        selected_depth=d['new']
        update_nad_diagram(sel_ctx.get_selected())

    nadslider.observe(on_nadslider_changed, names='value')

    vl_input = widgets.Text(
        value='',
        placeholder='Voltage level Name' if use_name else 'Voltage level Id',
        description='Filter',
        disabled=False,
        continuous_update=True,
        layout=widgets.Layout(flex='2%', height='100%', width='350px', margin='1px 0 0 0')
    )

    def update_select_widget(widget, el, elements=None, on_select=None):
        if on_select:
            widget.unobserve(on_select, names='value')
        try:
            if elements is not None:
                widget.value = None
                widget.options = elements

            widget.value = el
        
        finally:
            if on_select:
                widget.observe(on_select, names='value')

    
    def on_text_changed(d):
        nonlocal found
        sel_ctx.apply_filter(d['new'])
        sel = sel_ctx.get_selected() if sel_ctx.is_selected_in_filtered_vls() else None
        opts = sel_ctx.get_filtered_vls_as_list()
        update_select_widget(found, sel, opts, on_selected)

    vl_input.observe(on_text_changed, names='value')
    
    found = widgets.Select(
        options=sel_ctx.get_filtered_vls_as_list(),
        value=sel_ctx.get_selected(),
        description='Found',
        disabled=False,
        layout=widgets.Layout(flex='80%', height='100%', width='350px', margin='0 0 0 0')
    )

    def on_selected(d):
        if d['new'] != None:
            sel_ctx.set_selected(d['new'], add_to_history=True)
            update_select_widget(history, None, sel_ctx.get_history_as_list(), on_selected_history)
            update_explorer()

    found.observe(on_selected, names='value')

    history = widgets.Select(
        options=sel_ctx.get_history_as_list(),
        value=sel_ctx.get_selected(),
        description='History',
        disabled=False,
        layout=widgets.Layout(flex='18%', height='100%', width='350px', margin='1px 0 0 0')
    )

    def on_selected_history(d):
        if d['new'] != None:
            sel_ctx.set_selected(d['new'], add_to_history=False)
            update_select_widget(found, sel_ctx.get_selected() if sel_ctx.is_selected_in_filtered_vls() else None, None, on_selected)
            update_explorer()

    history.observe(on_selected_history, names='value')

    # removes a VL node from a VL list
    def remove_vl_node(vl_list, vl_to_remove):
        if vl_to_remove in vl_list:
            new_list=vl_list.copy()
            new_list.remove(vl_to_remove)
            return new_list
        else:
            return vl_list

    # adds to a VL list the list of nodes centered on the node to be expanded (with the same depth)
    def expand_on_vl_node(network, vl_list, vl_to_expand_from, depth):
        vls_centered_on_selected_node = network.get_network_area_diagram_displayed_voltage_levels(voltage_level_ids=vl_to_expand_from, depth=depth)
        new_list=list(set(vl_list) | set(vls_centered_on_selected_node))
        return new_list
    
    def extract_positions_dataframe_from_nad_metadata(nad_metadata):
        nodes_df = pd.DataFrame(nad_metadata['nodes'])
        tnodes_df = pd.DataFrame(nad_metadata['textNodes'])
        merged_df = pd.merge(nodes_df, tnodes_df, on='equipmentId', how='left', suffixes=('_nodes', '_tnodes'))
        result_df = merged_df[['equipmentId', 'x', 'y', 'shiftX', 'shiftY', 'connectionShiftX', 'connectionShiftY']]
        result_df = result_df.rename(columns={'shiftX': 'legend_shift_x', 'shiftY': 'legend_shift_y',
                                              'connectionShiftX': 'legend_connection_shift_x', 'connectionShiftY': 'legend_connection_shift_y'})
        result_df.set_index('equipmentId', inplace=True)
        result_df.index.name = 'id'
        return result_df

    def extract_positions_dataframe_from_nad_metadata_json(json_nad_metadata):
        return None if json_nad_metadata == None  else extract_positions_dataframe_from_nad_metadata(json.loads(json_nad_metadata))
    
    def compute_nad_data(el, depth=0, vllist=None, metadata=None, vl_action=None, action=0):
        new_vllist=None
        if el is not None:
            if action == 1:
                new_vllist=expand_on_vl_node(network, vllist, vl_action, 1)
            elif action == 2:
                new_vllist=remove_vl_node(vllist, vl_action)
                if len(new_vllist) == 0:
                    new_vllist=vllist
            else:
                new_vllist=network.get_network_area_diagram_displayed_voltage_levels(voltage_level_ids=el, depth=depth)

            nm=extract_positions_dataframe_from_nad_metadata_json(metadata)
            nad_data=network.get_network_area_diagram(voltage_level_ids=new_vllist, 
                                                      high_nominal_voltage_bound=high_nominal_voltage_bound, 
                                                      low_nominal_voltage_bound=low_nominal_voltage_bound, 
                                                      nad_parameters=npars,
                                                      fixed_positions=nm,
                                                      nad_profile=nad_profile)
        else:
            nad_data=EMPTY_SVG
        return nad_data, new_vllist


    current_nad_data, current_nad_vl_list = compute_nad_data(None)
    current_nad_metadata = ''

    def update_nad_widget(new_diagram_data, enable_callbacks=True, grayout=False, keep_viewbox=False):
        nonlocal nad_widget
        if nad_widget==None:
            nad_widget=display_nad(new_diagram_data, enable_callbacks=enable_callbacks, grayout=grayout, popup_menu_items=['Open in SLD tab', 'Expand', 'Remove'])
            nad_widget.on_select_node(lambda event : select_nad_node(event))
            nad_widget.on_select_menu(lambda event : select_nad_menu(event))
            nad_widget.on_move_node(lambda event : nad_widget.trigger_update_metadata())
            nad_widget.on_move_text_node(lambda event : nad_widget.trigger_update_metadata())
        else:
            update_nad(nad_widget,new_diagram_data, enable_callbacks=enable_callbacks, grayout=grayout, keep_viewbox=keep_viewbox)

    in_progress_widget=widgets.HTML(value=PROGRESS_EMPTY_SVG, 
                                    layout=widgets.Layout(width='30', justify_content='flex-end', margin='0px 20px 0px 0px'))

    def enable_in_progress():
        in_progress_widget.value=PROGRESS_BAR_SVG
        found.disabled=True
        history.disabled=True
        nadslider.disabled=True
        vl_input.disabled=True
        display(vl_input)

    def disable_in_progress():
        found.disabled=False
        history.disabled=False
        nadslider.disabled=False
        vl_input.disabled=False
        in_progress_widget.value=PROGRESS_EMPTY_SVG

    def update_nad_diagram(el, vl_action=None, action=0):
        nonlocal current_nad_data, nad_displayed_vl_id, current_nad_metadata, current_nad_vl_list
        if nad_widget != None:
            update_nad_widget('', enable_callbacks=False, grayout=True, keep_viewbox=True)
            display(nad_widget)
            enable_in_progress()
            update_sld_widget(current_sld_data, True, enable_callbacks=False)
            display(sld_widget)
            if map_widget != None:
                map_widget.set_enable_callbacks(False)
                display(map_widget)
        try:
            if action == 0:
                current_nad_data,current_nad_vl_list=compute_nad_data(el, selected_depth)
                if nad_widget != None:
                    nad_widget.current_nad_metadata=current_nad_metadata
            else:
                current_nad_data,current_nad_vl_list=compute_nad_data(el, selected_depth, current_nad_vl_list, 
                                                                         current_nad_metadata, vl_action, action)
            current_nad_metadata=current_nad_data.metadata    
            update_nad_widget(current_nad_data, enable_callbacks=True, grayout=False)
            nad_displayed_vl_id=el
        finally:
            update_sld_widget(current_sld_data, True, enable_callbacks=True)
            if map_widget != None:
                map_widget.set_enable_callbacks(True)

            disable_in_progress()
    
    def update_explorer(force_update=False):
        sel=sel_ctx.get_selected()
        if force_update or tabs_diagrams.selected_index==NAD_TAB_INDEX:
            update_nad_diagram(sel)
        update_sld_diagram(sel)
        update_map(sel)
        history.focus()

    update_explorer(True)

    voltage_levels_label=widgets.Label("Voltage levels")
    spacer_label=widgets.Label("")

    left_panel = widgets.VBox([vl_input, found, history], 
                              layout=widgets.Layout(width='100%', height='100%', display='flex', flex_flow='column'))
    
    nad_top_section = widgets.HBox([nadslider, in_progress_widget],layout=widgets.Layout(justify_content='space-between')) 
    right_panel_nad = widgets.VBox([nad_top_section, nad_widget])
    right_panel_sld = widgets.VBox([spacer_label,sld_widget])
    right_panel_map = widgets.VBox([spacer_label, map_widget])

    tabs_diagrams = widgets.Tab()
    tabs_diagrams.children = [right_panel_nad, right_panel_sld, right_panel_map]
    tabs_diagrams.titles = ['Network Area', 'Single Line', 'Network map']
    tabs_diagrams.layout=widgets.Layout(width='850px', height='700px', margin='0 0 0 4px')

    def on_select_tab(widget):
        tab_idx = widget['new']
        sel = sel_ctx.get_selected()
        if tab_idx==NAD_TAB_INDEX and nad_displayed_vl_id != sel:
            update_nad_diagram(sel)

    tabs_diagrams.observe(on_select_tab, names='selected_index')    

    left_vbox = widgets.VBox([voltage_levels_label, left_panel])
    right_vbox = widgets.VBox([spacer_label, tabs_diagrams])

    hbox = widgets.HBox([left_vbox, right_vbox])

    return hbox
