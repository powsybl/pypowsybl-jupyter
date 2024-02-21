# Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from IPython.display import display
from pypowsybl.network import Network
from .svgwidget import display_svg

import ipywidgets as widgets


def network_explorer(network: Network):
    """
    Creates a basic explorer widget for this network.
    """

    vl_input = widgets.Text(
        value='',
        placeholder='Voltage level ID',
        description='Voltage level:',
        disabled=False,
        continuous_update=True
    )

    found = widgets.SelectMultiple(
        options=[],
        value=[],
        rows=10,
        description='Found',
        disabled=False
    )

    def on_text_changed(d):
        vls = network.get_voltage_levels(attributes=[])
        vls = vls[vls.index.str.startswith(d['new'])]
        found.options = vls.index

    vl_input.observe(on_text_changed, names='value')

    button = widgets.Button(description="Display voltage level")
    diagram_panel = widgets.Output()

    def on_click(_):
        with diagram_panel:
            diagram_panel.clear_output()
            display(display_svg(network.get_single_line_diagram(found.value[0])))

    button.on_click(on_click)
    left_panel = widgets.VBox([vl_input, found, button])
    return widgets.HBox([left_panel, diagram_panel])