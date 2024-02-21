# Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from IPython.display import display
from ipywidgets import widgets
from pypowsybl.network import Network, LayoutParameters
from .sldwidget import display_sld_svg

def network_explorer_sld(network: Network, vl_id: str = None, parameters: LayoutParameters = None):
    """
    created a basic, in-place, SLD network explorer

    Args:
        network:  the input network
        vl_id: the starting VL to display. If None, display the first VL from network.get_voltage_levels()
        parameters: layout properties to adjust the svg rendering for the sld

    Examples:

        .. code-block:: python

            network_explorer_sld(pp.network.create_four_substations_node_breaker_network())
    """

    diagram_panel = widgets.Output()

    def _show_svg_sld(_network: Network, _vl_id: str, _parameters: LayoutParameters):
        with diagram_panel:
            diagram_panel.clear_output()
            next_widget = display_sld_svg(_network.get_single_line_diagram(_vl_id, _parameters), enable_callbacks=True)
            next_widget.observe(lambda event: _show_svg_sld(_network, str(event.new), _parameters), names='clicked_nextvl')
            display(next_widget)

    p=parameters if parameters is not None else LayoutParameters(use_name=True)
    starting_vl_id = vl_id if vl_id is not None else network.get_voltage_levels().index[0]
    _show_svg_sld(network, starting_vl_id, p)
    return widgets.HBox([diagram_panel])