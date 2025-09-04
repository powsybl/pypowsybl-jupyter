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
from anywidget.experimental import command

from ipywidgets import (
    CallbackDispatcher
)

from .util import _get_svg_string, _get_svg_metadata
from typing import List, Callable

OnHoverFuncType = Callable[[str, str], str]

class NadWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "nadwidget.js"
    _css = pathlib.Path(__file__).parent / "static" / "nadwidget.css"

    diagram_data  = traitlets.Dict().tag(sync=True)
    selected_node = traitlets.Dict().tag(sync=True)
    selected_menu = traitlets.Dict().tag(sync=True)
    moved_node = traitlets.Dict().tag(sync=True)
    moved_text_node = traitlets.Dict().tag(sync=True)
    current_nad_metadata = traitlets.Unicode().tag(sync=True)
    popup_menu_items = traitlets.List(trait=traitlets.Unicode(), default_value=[]).tag(sync=True)
    hover_enabled = traitlets.Bool().tag(sync=True)
    branch_states = traitlets.List().tag(sync=True)

    def __init__(self, on_hover_func: OnHoverFuncType, **kwargs):
        super().__init__(**kwargs)
        self._on_select_node_handler = CallbackDispatcher()
        self._on_move_node_handler = CallbackDispatcher()
        self._on_move_text_node_handler = CallbackDispatcher()
        self._on_select_menu_handler = CallbackDispatcher()
        super().on_msg(self._handle_nadwidget_msgs)
        self._on_hover_func = on_hover_func
        self.hover_enabled = on_hover_func is not None

    def _handle_nadwidget_msgs(self, _, content, buffers):
        if content.get('event', '') == 'select_node':
            self.on_select_node_msg()
        elif content.get('event', '') == 'move_node':
            self.on_move_node_msg()
        elif content.get('event', '') == 'move_text_node':
            self.on_move_text_node_msg()
        elif content.get('event', '') == 'select_menu':
            self.on_select_menu_msg()

    # select node
    def on_select_node_msg(self):
        self._on_select_node_handler(self)

    def on_select_node(self, callback, remove=False):
        self._on_select_node_handler.register_callback(callback, remove=remove)

    # select menu
    def on_select_menu_msg(self):
        self._on_select_menu_handler(self)

    def on_select_menu(self, callback, remove=False):
        self._on_select_menu_handler.register_callback(callback, remove=remove)

    # move node
    def on_move_node_msg(self):
        self._on_move_node_handler(self)

    def on_move_node(self, callback, remove=False):
        self._on_move_node_handler.register_callback(callback, remove=remove)

    # move text node
    def on_move_text_node_msg(self):
        self._on_move_text_node_handler(self)

    def on_move_text_node(self, callback, remove=False):
        self._on_move_text_node_handler.register_callback(callback, remove=remove)

    def set_branch_states(self, branch_states_data):
        self.branch_states = branch_states_data

    def trigger_update_metadata(self):
        self.send({'type': 'triggerRetrieveMetadata'})

    @anywidget.experimental.command
    def _get_on_hover_info(self, msg, buffers):
        retval = ''
        if self._on_hover_func is not None:
            try:
                retval = self._on_hover_func(msg['id'], msg['type'])
            except Exception as err:
                retval = f'ERROR {repr(err)}'
        return retval, buffers

def display_nad(svg, invalid_lf: bool = False, drag_enabled: bool = False, grayout:  bool = False, popup_menu_items: List[str] = [], on_hover_func: OnHoverFuncType = None) -> NadWidget:
    """
    Displays a NAD's SVG with support for panning and zooming.

    Args:
        svg: the input SVG, as str or class providing an svg and metadata representation
        invalid_lf: when True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.
        drag_enabled: if True, enable the dragging for moving nodes in the diagram. Please note that this feature is working with versions of PyPowSyBl equal or greater than v1.8.1.
        grayout: if True, changes the diagram elements' color to gray.
        popup_menu_items: list of str. When not empty enables a right-click popup menu on the NAD's VL nodes.
        on_hover_func: a callback function that is invoked when hovering on equipments. The function parameters are the equipment id and type; It must return an HTML string. Currently, the NAD viewer component supports lines, HVDC lines and two winding transformers. None disables the hovering feature.
        on_hover_func: a callback function that is invoked when hovering on equipments. The function parameters are the equipment id and type; It must return an HTML string. None disables the hovering feature. Note that currently the NAD viewer component supports hovering on lines, HVDC lines and two winding transformers.

    Returns:
        A jupyter widget allowing to zoom and pan the SVG.

    Examples:

        .. code-block:: python

            display_nad(network.get_network_area_diagram())
    """
    svg_value=_get_svg_string(svg)
    svg_metadata = _get_svg_metadata(svg)
    return NadWidget(diagram_data= {"svg_data": svg_value, "metadata": svg_metadata, "invalid_lf": invalid_lf, "drag_enabled": drag_enabled, "grayout": grayout},
                     popup_menu_items=popup_menu_items, on_hover_func = on_hover_func)

def update_nad(nadwidget, svg, invalid_lf: bool = False, drag_enabled: bool = False, grayout:  bool = False, keep_viewbox: bool = False):
    """
    Updates an existing NAD widget with a new SVG content

    Args:
        nadwidget: the existing widget to update
        svg: the input NAD's SVG
        invalid_lf: when True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.
        drag_enabled: if True, enable the dragging for moving nodes in the diagram. Please note that this feature is working with versions of PyPowSyBl equal or greater than v1.8.1.
        grayout: if True, changes the diagram elements' color to gray.
        keep_viewbox: if True, keeps the current diagram content, including pan and zoom settings.

    Examples:

        .. code-block:: python

            update_nad(existing_nad_widget, network.get_network_area_diagram())
    """    

    svg_value=_get_svg_string(svg)
    svg_metadata = _get_svg_metadata(svg)
    nadwidget.diagram_data= {"svg_data": svg_value, "metadata": svg_metadata, "invalid_lf": invalid_lf, "drag_enabled": drag_enabled, "grayout": grayout, "keep_viewbox": keep_viewbox}
