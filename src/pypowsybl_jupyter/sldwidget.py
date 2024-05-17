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

from ipywidgets import (
    CallbackDispatcher
)

class SldWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "sldwidget.js"
    _css = pathlib.Path(__file__).parent / "static" / "sldwidget.css"
    
    diagram_data  = traitlets.Dict().tag(sync=True)
    clicked_nextvl = traitlets.Unicode().tag(sync=True)
    clicked_switch = traitlets.Dict().tag(sync=True)
    clicked_feeder = traitlets.Dict().tag(sync=True)
    clicked_bus = traitlets.Dict().tag(sync=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._on_nextvl_handlers = CallbackDispatcher()
        self._on_switch_handlers = CallbackDispatcher()
        self._on_feeder_handlers = CallbackDispatcher()
        self._on_bus_handlers = CallbackDispatcher()
        super().on_msg(self._handle_svgsld_msg)

    def _handle_svgsld_msg(self, _, content, buffers):
        if content.get('event', '') == 'click_nextvl':
            self.nextvl()
        elif content.get('event', '') == 'click_switch':
            self.on_switch_msg()
        elif content.get('event', '') == 'click_feeder':
            self.on_feeder_msg()
        elif content.get('event', '') == 'click_bus':
            self.on_bus_msg()

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

    #bus
    def on_bus_msg(self):
        self._on_bus_handlers(self)

    def on_bus(self, callback, remove=False):
        self._on_bus_handlers.register_callback(callback, remove=remove)

        
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

def display_sld(svg, enable_callbacks: bool = False, invalid_lf: bool = False) -> SldWidget:
    """
    Displays an SLD's SVG with support for panning and zooming.

    Args:
        svg: the input SVG, as str or class providing an svg and metadata representation
        enable_callbacks: if true, enable the callbacks for navigation arrows, feeders and switches
        invalid_lf: When True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.

    Returns:
        A jupyter widget allowing to zoom and pan the SVG.

    Examples:

        .. code-block:: python

            display_sld(network.get_single_line_diagram('SUB-ID'))
    """

    svg_metadata = "" if not enable_callbacks else _get_svg_metadata(svg)
    svg_value=_get_svg_string(svg)
    return SldWidget(diagram_data= {"value": svg_value, "value_meta": svg_metadata, "invalid_lf": invalid_lf})

def update_sld(sldwidget, svg, keep_viewbox: bool = False, enable_callbacks: bool = False, invalid_lf: bool = False):
    """
    Updates an existing SLD widget with a new SVG content.

    Args:
        sldwidget: the existing widget to update
        svg: the input NAD's SVG
        enable_callbacks: if true, enable the callbacks for navigation arrows, feeders and switches
        invalid_lf: When True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.

    Examples:

        .. code-block:: python

            update_sld(existing_sld_widget, network.get_single_line_diagram('SUB-ID'))
    """    

    svg_metadata = "" if not enable_callbacks else _get_svg_metadata(svg)
    svg_value=_get_svg_string(svg)
    sldwidget.diagram_data= {"value": svg_value, "value_meta": svg_metadata, "keep_viewbox": keep_viewbox, "invalid_lf": invalid_lf}
