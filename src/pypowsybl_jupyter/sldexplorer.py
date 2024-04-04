# Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from IPython.display import display
from pypowsybl.network import Network
from .sldwidget import display_sld, update_sld

import ipywidgets as widgets


def sld_explorer(network: Network):
    """
    Creates a basic SLD explorer widget for a network, built with the sld widget.
    """

    vls = network.get_voltage_levels(attributes=[])
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
        value=None,
        rows=29,
        description='Found',
        disabled=False
    )

    def on_selected(d):
        nonlocal svgwidget
        with diagram_panel:
            if d['new'] != None:
                new_svg_data=network.get_single_line_diagram(d['new'])

                if svgwidget==None:
                    svgwidget=display_sld(new_svg_data)
                    display(svgwidget)
                else:
                   update_sld(svgwidget, new_svg_data)
                

    found.observe(on_selected, names='value')

    left_panel = widgets.VBox([widgets.Label('Voltage levels'), vl_input, found])
    diagram_panel = widgets.Output()
    hbox = widgets.HBox([left_panel, diagram_panel])
    hbox.layout.align_items='flex-end'
    
    return hbox