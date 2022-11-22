# Copyright (c) 2022, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

"""
Simple widget which enables to pan and zoom on an SLD's SVG
and create callbacks on: VL navigation arrows, switches and feeders elements
"""

from ipywidgets import (
    DOMWidget,
    CallbackDispatcher
)
from traitlets import (
    Unicode,
    Dict
)
from ._frontend import module_name, module_version

class SvgSldWidget(DOMWidget):
    """
    A widget which displays an SLD's SVG and allows to zoom and pan.
    The widget allows the definition of callbacks on: VL navigation arrows, switches and feeders elements
    """
    _model_name = Unicode('SvgSldModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('SvgSldView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    value = Unicode().tag(sync=True)
    value_meta = Unicode().tag(sync=True)
    clicked_nextvl = Unicode().tag(sync=True)
    clicked_switch = Dict().tag(sync=True)
    clicked_feeder = Dict().tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._on_nextvl_handlers = CallbackDispatcher()
        self._on_switch_handlers = CallbackDispatcher()
        self._on_feeder_handlers = CallbackDispatcher()
        self.on_msg(self._handle_svgsld_msg)

    def _handle_svgsld_msg(self, _, content, buffers):
        if content.get('event', '') == 'click_nextvl':
            self.nextvl()
        elif content.get('event', '') == 'click_switch':
            self.on_switch_msg()
        elif content.get('event', '') == 'click_feeder':
            self.on_feeder_msg()

    #nextvl
    def nextvl(self):
        self._on_nextvl_handlers(self)

    def on_nextvl(self, callback, remove=False):
        self._on_nextvl_handlers.register_callback(callback, remove=remove)

    #switch
    def on_switch_msg(self):
        self._on_switch_handlers(self)

    def on_switch(self, callback, remove=False):
        self._on_switch_handlers.register_callback(callback, remove=remove)

    #feeder
    def on_feeder_msg(self):
        self._on_feeder_handlers(self)

    def on_feeder(self, callback, remove=False):
        self._on_feeder_handlers.register_callback(callback, remove=remove)


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
        enable_callbacks: if true, enable the callbacks for navication arrows, feeders and switches

    Returns:
        A jupyter widget allowing to zoom and pan the SVG.

    Examples:

        .. code-block:: python

            display_sld_svg(network.get_single_line_diagram('SUB-ID'))
    """

    svg_metadata = "" if not enable_callbacks else _get_svg_metadata(svg)
    return SvgSldWidget(value=_get_svg_string(svg), value_meta=svg_metadata)
