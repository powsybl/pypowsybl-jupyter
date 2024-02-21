# Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

import importlib.metadata
from .sldwidget import (
    SvgSldWidget, display_sld_svg 
)
from .sldexplorer import network_explorer_sld
from .svgwidget import (
    SvgWidget, display_svg 
)
from .explorer import network_explorer

try:
    __version__ = importlib.metadata.version("pypowsybl_jupyter")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"
