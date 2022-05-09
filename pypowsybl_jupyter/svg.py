# Copyright (c) 2022, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

"""
Simple widget which enables to pan and zoom on an SVG object
"""

from ipywidgets import DOMWidget
from traitlets import Unicode
from ._frontend import module_name, module_version

from xml.dom import minidom


class SvgWidget(DOMWidget):
    """
    A widget which simply displays an SVG and allows to zoom and pan.
    """
    _model_name = Unicode('SvgModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('SvgView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    value = Unicode().tag(sync=True)


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
            import pypowsybl_jupyter as pj
            pj.display_svg(network.get_single_line_diagram('SUB-ID'))
    """

    doc = minidom.parseString(_get_svg_string(svg))
    svg_node = _get_svg_root(doc)

    if fit_to_cell:
        svg_node.setAttribute('width', '100%')
        svg_node.setAttribute('height', '100%')
    return SvgWidget(value=svg_node.toxml())
