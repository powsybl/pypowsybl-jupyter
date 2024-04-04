# Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from IPython.display import display
from ipywidgets import widgets
from pypowsybl.network import Network, LayoutParameters
from .svgsldwidget import display_sld_svg, update_sld_svg

def sld_navigator(network: Network, vl_id: str = None, parameters: LayoutParameters = None):
    """
    created a basic, in-place, SLD network explorer. Click on a VL arrows to move to another VL.
    Click on a switch to change its status.

    Args:
        network:  the input network
        vl_id: the starting VL to display. If None, display the first VL from network.get_voltage_levels()
        parameters: layout properties to adjust the svg rendering for the sld

    Examples:

        .. code-block:: python

            sld_navigator(pp.network.create_four_substations_node_breaker_network())
    """
    
    _params=parameters if parameters is not None else LayoutParameters(use_name=True)
    _current_vl_id = vl_id if vl_id is not None else network.get_voltage_levels().index[0]
    _sldwidget = None

    def _toggle_switch(event: any):
        idswitch = event.clicked_switch.get('id')
        statusswitch = event.clicked_switch.get('switch_status')
        network.update_switches(id=idswitch, open=statusswitch)
        update_sld_svg(_sldwidget, network.get_single_line_diagram(_current_vl_id, _params), True, enable_callbacks= True)

    def _go_to_vl(event: any):
        nonlocal _current_vl_id
        _current_vl_id= str(event.clicked_nextvl)
        update_sld_svg(_sldwidget, network.get_single_line_diagram(_current_vl_id, _params), enable_callbacks=True)

    diagram_panel = widgets.Output()
    with diagram_panel:
        _sldwidget = display_sld_svg(network.get_single_line_diagram(_current_vl_id, _params), enable_callbacks=True)
        _sldwidget.on_nextvl(lambda event: _go_to_vl(event))
        _sldwidget.on_switch(lambda event: _toggle_switch(event))
        display(_sldwidget)

    return widgets.HBox([diagram_panel])