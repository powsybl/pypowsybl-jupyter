# Copyright (c) 2026, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0

"""
Widget which enables to display and compare multiple diagram SVGs side-by-side
"""

import pathlib
import anywidget
import traitlets
from typing import List, Union
from pypowsybl.network import Network
from .util import _get_svg_string, _get_svg_metadata

class ComparatorWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "comparatorwidget.js"
    _css = pathlib.Path(__file__).parent / "static" / "comparatorwidget.css"

    diagrams = traitlets.List().tag(sync=True)
    synchronized = traitlets.Bool(True).tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

def network_comparator(networks: List[Network], synchronized: bool = True) -> ComparatorWidget:
    """
    Displays multiple network area diagrams (NAD) side-by-side.
    Maximum 4 diagrams are supported.

    Args:
        networks: a list of input networks.
        synchronized: if True, synchronizes zoom and pan across all diagrams.

    Returns:
        A jupyter widget allowing to compare diagrams side-by-side.

    Examples:

        .. code-block:: python

            network_comparator([network1, network2])
    """
    if not networks:
        raise ValueError("At least one network must be provided.")
    if len(networks) > 4:
        raise ValueError("Maximum 4 networks are supported.")

    diagram_data_list = []
    for network in networks:
        if not isinstance(network, Network):
            raise ValueError(f"Input must be a list of Network objects, but got {type(network)}")
        
        nad = network.get_network_area_diagram()
        svg_value = _get_svg_string(nad)
        svg_metadata = _get_svg_metadata(nad)
        diagram_data_list.append({
            "svg_data": svg_value,
            "metadata": svg_metadata
        })

    return ComparatorWidget(diagrams=diagram_data_list, synchronized=synchronized)
