# Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from IPython.display import display
from pypowsybl.network import Network, LayoutParameters
from .sldwidget import display_sld, update_sld

import ipywidgets as widgets


def sld_explorer(network: Network, vl_id: str = None, parameters: LayoutParameters = None):
    """
    Creates a basic SLD explorer widget for a network, built with the sld widget.

    Args:
        network:  the input network
        vl_id: the starting VL to display. If None, display the first VL from network.get_voltage_levels()
        parameters: layout properties to adjust the svg rendering for the sld

    Examples:

        .. code-block:: python

            sld_explorer(pp.network.create_four_substations_node_breaker_network())
    """

    _params=parameters if parameters is not None else LayoutParameters(use_name=True)
    vls = network.get_voltage_levels(attributes=[])
    selected_vl= vls.index[0] if vl_id is None else vl_id 
    svgwidget=None

    vl_input = widgets.Text(
        value='',
        placeholder='Voltage level ID',
        description='Filter',
        disabled=False,
        continuous_update=True
    )
    
    def on_text_changed(d):
        found.options = vls[vls.index.str.contains(d['new'], regex=False)].index

    vl_input.observe(on_text_changed, names='value')
    
    found = widgets.Select(
        options=vls.index,
        value=selected_vl,
        #rows=29,
        description='Found',
        disabled=False,
        layout=widgets.Layout(height='570px')
    )

    def update_diagram():
        nonlocal svgwidget, selected_vl
        if selected_vl is not None:
            new_diagram_data=network.get_single_line_diagram(selected_vl, _params)
            if svgwidget==None:
                svgwidget=display_sld(new_diagram_data)
                #display(svgwidget)
            else:
                update_sld(svgwidget, new_diagram_data)

    def on_selected(d):
        nonlocal svgwidget, selected_vl
        if d['new'] != None:
            selected_vl=d['new']
            update_diagram()

    found.observe(on_selected, names='value')

    update_diagram()

    left_panel = widgets.VBox([widgets.Label('Voltage levels'), vl_input, found])
    right_panel = widgets.VBox([svgwidget])
    hbox = widgets.HBox([left_panel, right_panel])
    hbox.layout.align_items='flex-end'
    
    return hbox