# Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

"""
Simple widget which enables to pan and zoom on an SLD's SVG
and create callbacks on: VL navigation arrows, switches and feeders elements
"""

import pathlib

import anywidget
import traitlets


class SvgSldWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "sldwidget.js"
    _css = pathlib.Path(__file__).parent / "static" / "sldwidget.css"
    
    value = traitlets.Unicode().tag(sync=True)
    value_meta = traitlets.Unicode().tag(sync=True)
    clicked_nextvl = traitlets.Unicode().tag(sync=True)
    clicked_switch = traitlets.Dict().tag(sync=True)
    clicked_feeder = traitlets.Dict().tag(sync=True)
    clicked_bus = traitlets.Dict().tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


def _get_svg_string(svg) -> str:
    if isinstance(svg, str):
        return svg
    elif hasattr(svg, '_repr_svg_'):
        return svg._repr_svg_()
    else:
        raise ValueError('svg argument should be a string or provide a _repr_svg_ method.')

def _get_svg_metadata(svg) -> str:
    if isinstance(svg, str):
        return None
    elif hasattr(svg, '_metadata'):
        return svg._metadata
    else:
        raise ValueError('svg argument provide a _metadata method.')

def display_sld_svg(svg, enable_callbacks: bool = False) -> SvgSldWidget:
    """
    Displays an SLD's SVG with support for panning and zooming.

    Args:
        svg:         the input SVG, as str or class providing an svg and metadata representation
        enable_callbacks: if true, enable the callbacks for navigation arrows, feeders and switches

    Returns:
        A jupyter widget allowing to zoom and pan the SVG.

    Examples:

        .. code-block:: python

            display_sld_svg(network.get_single_line_diagram('SUB-ID'))
    """

    svg_metadata = "" if not enable_callbacks else _get_svg_metadata(svg)
    return SvgSldWidget(value=_get_svg_string(svg), value_meta=svg_metadata)

