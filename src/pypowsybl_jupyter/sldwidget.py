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
from anywidget.experimental import command

from ipywidgets import (
    CallbackDispatcher
)

from .util import _get_svg_string, _get_svg_metadata
from typing import Callable

OnHoverFuncType = Callable[[str, str], str]

class SldWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "sldwidget.js"
    _css = pathlib.Path(__file__).parent / "static" / "sldwidget.css"
    
    diagram_data  = traitlets.Dict().tag(sync=True)
    clicked_nextvl = traitlets.Unicode().tag(sync=True)
    clicked_switch = traitlets.Dict().tag(sync=True)
    clicked_feeder = traitlets.Dict().tag(sync=True)
    clicked_bus = traitlets.Dict().tag(sync=True)
    hover_enabled = traitlets.Bool().tag(sync=True)
    
    def __init__(self, on_hover_func: OnHoverFuncType, **kwargs):
        super().__init__(**kwargs)
        self._on_nextvl_handlers = CallbackDispatcher()
        self._on_switch_handlers = CallbackDispatcher()
        self._on_feeder_handlers = CallbackDispatcher()
        self._on_bus_handlers = CallbackDispatcher()
        super().on_msg(self._handle_svgsld_msg)
        self._on_hover_func = on_hover_func
        self.hover_enabled = on_hover_func is not None

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

    @anywidget.experimental.command
    def _get_on_hover_info(self, msg, buffers):
        retval = ''
        if self._on_hover_func is not None:
            try:
                retval = self._on_hover_func(msg['id'], msg['type'])
            except Exception as err:
                retval = f'ERROR {repr(err)}'
        return retval, buffers

def display_sld(svg, enable_callbacks: bool = False, invalid_lf: bool = False, on_hover_func: OnHoverFuncType = None) -> SldWidget:
    """
    Displays an SLD's SVG with support for panning and zooming.

    Args:
        svg: the input SVG, as str or class providing an svg and metadata representation.
        enable_callbacks: if True, enable the callbacks for navigation arrows, feeders and switches.
        invalid_lf: when True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.
        on_hover_func: a callback function that is invoked when hovering on equipments. The function parameters are the equipment id and type; It must return an HTML string. None disables the hovering feature. Note that currently the SLD viewer component supports hovering on lines and two winding transformers.

    Returns:
        A jupyter widget allowing to zoom and pan the SVG.

    Examples:

        .. code-block:: python

            display_sld(network.get_single_line_diagram('SUB-ID'))
    """

    svg_metadata = "" if not enable_callbacks else _get_svg_metadata(svg)
    svg_value=_get_svg_string(svg)
    return SldWidget(diagram_data= {"value": svg_value, "value_meta": svg_metadata, "invalid_lf": invalid_lf}, on_hover_func = on_hover_func)

def update_sld(sldwidget, svg, keep_viewbox: bool = False, enable_callbacks: bool = False, invalid_lf: bool = False):
    """
    Updates an existing SLD widget with a new SVG content.

    Args:
        sldwidget: the existing widget to update.
        svg: the input NAD's SVG.
        keep_viewbox: if True, keeps the current pan and zoom after the update.
        enable_callbacks: if True, enable the callbacks for navigation arrows, feeders and switches.
        invalid_lf: when True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.

    Examples:

        .. code-block:: python

            update_sld(existing_sld_widget, network.get_single_line_diagram('SUB-ID'))
    """    

    svg_metadata = "" if not enable_callbacks else _get_svg_metadata(svg)
    svg_value=_get_svg_string(svg)
    sldwidget.diagram_data= {"value": svg_value, "value_meta": svg_metadata, "keep_viewbox": keep_viewbox, "invalid_lf": invalid_lf}
