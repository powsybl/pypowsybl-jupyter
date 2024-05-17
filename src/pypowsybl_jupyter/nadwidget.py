# Copyright (c) 2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

"""
Simple widget which enables to pan and zoom on a NAD's SVG
"""

import pathlib

import anywidget
import traitlets

class NadWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "nadwidget.js"
    _css = pathlib.Path(__file__).parent / "static" / "nadwidget.css"
    
    diagram_data  = traitlets.Dict().tag(sync=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
def _get_svg_string(svg) -> str:
    if isinstance(svg, str):
        return svg
    elif hasattr(svg, '_repr_svg_'):
        return svg._repr_svg_()
    else:
        raise ValueError('svg argument should be a string or provide a _repr_svg_ method.')

def display_nad(svg, invalid_lf: bool = False) -> NadWidget:
    """
    Displays a NAD's SVG with support for panning and zooming.

    Args:
        svg: the input SVG, as str or class providing an svg and metadata representation
        invalid_lf: When True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.

    Returns:
        A jupyter widget allowing to zoom and pan the SVG.

    Examples:

        .. code-block:: python

            display_nad(network.get_network_area_diagram())
    """    
    return NadWidget(diagram_data= {"svg_data": _get_svg_string(svg), "invalid_lf": invalid_lf})

def update_nad(nadwidget, svg, invalid_lf: bool = False):
    """
    Updates an existing NAD widget with a new SVG content

    Args:
        nadwidget: the existing widget to update
        svg: the input NAD's SVG
        invalid_lf: When True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.

    Examples:

        .. code-block:: python

            update_nad(existing_nad_widget, network.get_network_area_diagram())
    """    

    svg_value=_get_svg_string(svg)
    nadwidget.diagram_data= {"svg_data": svg_value, "invalid_lf": invalid_lf}
