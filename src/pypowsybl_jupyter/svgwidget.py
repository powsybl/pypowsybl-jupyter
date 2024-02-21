# Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

"""
Simple widget which enables to pan and zoom on an SVG object
"""

import pathlib

import anywidget
import traitlets

from xml.dom import minidom


class SvgWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "svgwidget.js"
    _css = pathlib.Path(__file__).parent / "static" / "svgwidget.css"
    value = traitlets.Int(0).tag(sync=True)
    svg_data = traitlets.Unicode().tag(sync=True)


def _get_svg_string(svg) -> str:
    if isinstance(svg, str):
        return svg
    elif hasattr(svg, '_repr_svg_'):
        return svg._repr_svg_()
    else:
        raise ValueError('svg argument should be a string or provide a _repr_svg_ method.')


def _get_svg_root(doc: minidom.Document):
    if len(doc.childNodes) != 1:
        raise ValueError('Not a valid SVG document, should have only one root element.')
    svg_node = doc.childNodes[0]
    if not isinstance(svg_node, minidom.Element) or svg_node.tagName != 'svg':
        raise ValueError('Not a valid SVG document, root element should be <svg>.')
    return svg_node

def display_svg(svg, fit_to_cell: bool = False) -> SvgWidget:
    """
    Displays an SVG with support for panning and zooming.

    Args:
        svg:         the input SVG, as str or class providing an svg representation
        fit_to_cell: if true, the display zone will extend to the cell output zone

    Returns:
        A jupyter widget allowing to zoom and pan the SVG.

    Examples:

        .. code-block:: python

            display_svg(network.get_single_line_diagram('SUB-ID'))
    """

    doc = minidom.parseString(_get_svg_string(svg))
    svg_node = _get_svg_root(doc)

    if fit_to_cell:
        svg_node.setAttribute('width', '100%')
        svg_node.setAttribute('height', '100%')
    return SvgWidget(svg_data=svg_node.toxml())

