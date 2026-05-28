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
from typing import List, Optional, Union
from pypowsybl.network import Network, NadParameters, NadProfile
from .util import _get_svg_string, _get_svg_metadata
from .injection_details import build_injection_data, build_delta_data, parse_uncertain_injections

class ComparatorWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "comparatorwidget.js"
    _css = pathlib.Path(__file__).parent / "static" / "comparatorwidget.css"

    diagrams = traitlets.List().tag(sync=True)
    synchronized = traitlets.Bool(True).tag(sync=True)
    width = traitlets.Int(allow_none=True, default_value=None).tag(sync=True)
    height = traitlets.Int(allow_none=True, default_value=None).tag(sync=True)
    display_buttons = traitlets.Bool(True).tag(sync=True)
    popup_scale = traitlets.Float(1.0).tag(sync=True)
    uncertainty_discs = traitlets.Bool(False).tag(sync=True)
    uncertainty_disc_scale = traitlets.Float(1.0).tag(sync=True)
    uncertainty_disc_offset_scale = traitlets.Float(1.0).tag(sync=True)
    sfcc_discs = traitlets.Bool(False).tag(sync=True)
    sfcc_disc_scale = traitlets.Float(1.0).tag(sync=True)
    delta_discs = traitlets.Bool(False).tag(sync=True)
    delta_disc_scale = traitlets.Float(1.0).tag(sync=True)
    delta_disc_offset_scale = traitlets.Float(1.0).tag(sync=True)
    show_markers = traitlets.Bool(False).tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

def network_comparator(networks: Union[Network, List[Network]], profiles: Union[NadProfile, List[NadProfile]] = None,
                       voltage_level_ids: Union[str, List[str]] = None, depth: int = 0,
                       nad_parameters: NadParameters = None,
                       width: int = None, height: int = None, display_buttons: bool = True,
                       synchronized: bool = True, popup_scale: float = 1.0,
                       injection_data: List[dict] = None,
                       delta_data: List[dict] = None,
                       uncertainties: Union[dict, List[Optional[dict]]] = None,
                       secondary_control: Union[dict, List[Optional[dict]]] = None,
                       delta_reference: Network = None,
                       uncertainty_discs: bool = False, uncertainty_disc_scale: float = 1.0,
                       uncertainty_disc_offset_scale: float = 1.0,
                       sfcc_discs: bool = False, sfcc_disc_scale: float = 1.0,
                       delta_discs: bool = False, delta_disc_scale: float = 1.0,
                       delta_disc_offset_scale: float = 1.0,
                       show_markers: bool = False) -> ComparatorWidget:
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
        popup_scale: scale factor for the hover popup size (default 1.0).
        uncertainties: list of uncertainty dicts, one per network, each as returned by json.loads() on an uncertainties JSON
            None entry means no uncertainty data for that viewer.
        secondary_control: list of SFCC dicts, one per network, each mapping generator ID to a percentage (0–100). 
            None entry means no SFCC data for that viewer.
        delta_reference: single reference Network.
        uncertainty_discs: if True, draws colored discs on VL nodes proportional to aggregated
            uncertainty (default False). Requires uncertainties to be provided.
        uncertainty_disc_scale: scale factor controls the uncertainty disc radii (default 1.0).
        uncertainty_disc_offset_scale: scale factor for the horizontal offset between the generator
            (blue) and load (red) discs relative to the VL node center. With the default 1.0 the 
            spacing is 40% of max disc radius. Values > 1 increase the spacing. A zero value means no offset
            and the both discs center is the VL node center.
        sfcc_discs: if True, draws an orange filled disc on each VL node whose radius is
            proportional to the total SFC at that VL. Default is False.
        sfcc_disc_scale: size multiplier for SFCC discs. Default 1.0.
        delta_discs: if True, draws filled discs on VL nodes to visualise the active power
            variation between two network. A green disc (at the VL node's right) represents
            the sum of generator power increases at that VL; a red-ish disc (left) represents
            the sum of decreases.
        delta_disc_scale: scale factor for delta discs.Default 1.0.
        delta_disc_offset_scale: scale factor for the horizontal offset between the positive (green)
            and negative (red-ish) delta discs relative to the VL node center. With the default 1.0 the
            spacing is 40% of max disc radius. Values > 1 increase the spacing. A zero value means no offset.
        show_markers: if True, shows a dashed square emphasis markers on active VLs 
            (useful to emphasize a VL, center of a disc, in larger networks). Default False.

    Returns:
        A jupyter widget allowing to compare diagrams side-by-side.

    Examples:

        .. code-block:: python

            network_comparator([network1, network2])
    """
    if not networks:
        raise ValueError("At least one network must be provided.")

    if injection_data is not None and (uncertainties is not None or secondary_control is not None):
        raise ValueError("Cannot specify both injection_data and uncertainties/secondary_control.")
    if delta_data is not None and delta_reference is not None:
        raise ValueError("Cannot specify both delta_data and delta_reference.")

    networks = networks if isinstance(networks, list) else [networks]

    if uncertainties is not None or secondary_control is not None:
        unc_list = (uncertainties if isinstance(uncertainties, list) else [uncertainties]) if uncertainties is not None else [None] * len(networks)
        sc_list = (secondary_control if isinstance(secondary_control, list) else [secondary_control]) if secondary_control is not None else [None] * len(networks)
        if len(unc_list) != len(networks):
            raise ValueError(f"uncertainties length ({len(unc_list)}) must match networks length ({len(networks)}).")
        if len(sc_list) != len(networks):
            raise ValueError(f"secondary_control length ({len(sc_list)}) must match networks length ({len(networks)}).")
        injection_data = [
            build_injection_data(networks[i], parse_uncertain_injections(unc_list[i]) if unc_list[i] is not None else None, sc_list[i])
            for i in range(len(networks))
        ]

    if delta_reference is not None:
        delta_data = [build_delta_data(delta_reference, network) for network in networks]

    if profiles is not None:
        profiles = profiles if isinstance(profiles, list) else [profiles]
        if len(profiles) != len(networks):
            raise ValueError(f"profiles length ({len(profiles)}) must match networks length ({len(networks)}).")

    if injection_data is not None:
        injection_data = injection_data if isinstance(injection_data, list) else [injection_data]
        if len(injection_data) != len(networks):
            raise ValueError(f"injection_data length ({len(injection_data)}) must match networks length ({len(networks)}).")

    if delta_data is not None:
        delta_data = delta_data if isinstance(delta_data, list) else [delta_data]
        if len(delta_data) != len(networks):
            raise ValueError(f"delta_data length ({len(delta_data)}) must match networks length ({len(networks)}).")

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
        entry = {"svg_data": svg_value, "metadata": svg_metadata}
        if injection_data is not None and injection_data[i] is not None:
            entry["injection_data"] = injection_data[i]
        if delta_data is not None and delta_data[i] is not None:
            entry["delta_data"] = delta_data[i]
        diagram_data_list.append(entry)

    return ComparatorWidget(
        diagrams=diagram_data_list,
        synchronized=synchronized,
        width=width,
        height=height,
        display_buttons=display_buttons,
        popup_scale=popup_scale,
        uncertainty_discs=uncertainty_discs,
        uncertainty_disc_scale=uncertainty_disc_scale,
        uncertainty_disc_offset_scale=uncertainty_disc_offset_scale,
        sfcc_discs=sfcc_discs,
        sfcc_disc_scale=sfcc_disc_scale,
        delta_discs=delta_discs,
        delta_disc_scale=delta_disc_scale,
        delta_disc_offset_scale=delta_disc_offset_scale,
        show_markers=show_markers,
    )
