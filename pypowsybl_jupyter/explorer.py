# Copyright (c) 2022, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from IPython.display import display
from pypowsybl.network import Network
from pypowsybl_jupyter.svgwidget import display_svg

import ipywidgets as widgets


def network_explorer(network: Network):
    """
    Creates a basic explorer widget for this network.
    """

    vls = network.get_voltage_levels(attributes=[])

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
        value=None,
        rows=25,
        description='Found',
        disabled=False
    )
   
    def on_selected(d):
        with diagram_panel:
            diagram_panel.clear_output(wait=True)
            if d['new'] != None:
                display(display_svg(network.get_single_line_diagram(d['new'])))
    
    found.observe(on_selected, names='value')

    left_panel = widgets.VBox([widgets.Label('Voltage levels'), vl_input, found])
    diagram_panel = widgets.Output()
    hbox = widgets.HBox([left_panel, diagram_panel])
    hbox.layout.align_items='flex-end'
    
    return hbox