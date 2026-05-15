# Copyright (c) 2026, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0

"""
Widget which enables to display and compare multiple NAD diagrams side-by-side
"""

import pathlib
import anywidget
import traitlets
from typing import List, Union
from pypowsybl.network import Network, NadParameters, NadProfile
from .util import _get_svg_string, _get_svg_metadata

class ComparatorWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "comparatorwidget.js"
    _css = pathlib.Path(__file__).parent / "static" / "comparatorwidget.css"

    diagrams = traitlets.List().tag(sync=True)
    synchronized = traitlets.Bool(True).tag(sync=True)
    width = traitlets.Int(allow_none=True, default_value=None).tag(sync=True)
    height = traitlets.Int(allow_none=True, default_value=None).tag(sync=True)
    display_buttons = traitlets.Bool(True).tag(sync=True)
    inj_bar_scale = traitlets.Float(1.0).tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

def network_comparator(networks: Union[Network, List[Network]], profiles: Union[NadProfile, List[NadProfile]] = None,
                       voltage_level_ids: Union[str, List[str]] = None, depth: int = 0,
                       nad_parameters: NadParameters = None,
                       width: int = None, height: int = None, display_buttons: bool = True,
                       synchronized: bool = True, inj_bar_scale: float = 1.0) -> ComparatorWidget:
    """
    Displays multiple network area diagrams (NAD) side-by-side.
    By default zoom and pan actions are synchronized across all diagrams.
    Please note that displaying a large number of synchronized diagrams can lead to slower performance or lag.

    Args:
        networks: a list of input networks.
        profiles: an optional list of NadProfile objects, one per network, to customize each NAD. A None entry will not apply a profile to the corresponding network.
            If provided, the number of profiles must match the number of networks.
        voltage_level_ids: the voltage level ID, center of the diagram (None for the full diagram).
        depth: the diagram depth around the voltage level.
        nad_parameters: layout properties to adjust the svg rendering for the NADs.
        width: width in pixels of each diagram. None (default) means that the width is set based on the number of diagrams.
        height: height in pixels of each diagram. None (default) means that the width is set based on the number of diagrams.
        display_buttons: if True (default), shows the NAD viewer buttons on all diagrams. Set to False to hide all buttons and save space in the viewers.
        synchronized: if True (default), synchronizes zoom and pan across all diagrams.
        inj_bar_scale: scale factor for injection bars (default 1.0).

    Returns:
        A jupyter widget allowing to compare diagrams side-by-side.

    Examples:

        .. code-block:: python

            network_comparator([network1, network2])
    """
    if not networks:
        raise ValueError("At least one network must be provided.")
    
    networks = networks if isinstance(networks, list) else [networks]
                                                            
    if profiles is not None:
        profiles = profiles if isinstance(profiles, list) else [profiles]
        if len(profiles) != len(networks):
            raise ValueError(f"profiles length ({len(profiles)}) must match networks length ({len(networks)}).")

    npars = nad_parameters if nad_parameters is not None else NadParameters()        

    diagram_data_list = []
    for i, network in enumerate(networks):
        if not isinstance(network, Network):
            raise ValueError(
                f"networks[{i}] must be a Network object, but got {type(network)}"
            )

        if profiles is not None:
            profile = profiles[i]
            if profile is not None and not isinstance(profile, NadProfile):
                raise ValueError(
                    f"profiles[{i}] must be a NadProfile or None, but got {type(profile)}"
                )
        else:
            profile = None
        nad = network.get_network_area_diagram(
            voltage_level_ids=voltage_level_ids,
            depth=depth,
            nad_parameters=npars,
            nad_profile=profile,
        )
        svg_value = _get_svg_string(nad)
        svg_metadata = _get_svg_metadata(nad)
        diagram_data_list.append({"svg_data": svg_value, "metadata": svg_metadata})

    return ComparatorWidget(diagrams=diagram_data_list, synchronized=synchronized, width=width, height=height, display_buttons=display_buttons, inj_bar_scale=inj_bar_scale)
