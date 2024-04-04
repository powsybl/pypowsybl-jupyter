# Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

import importlib.metadata

from .sldwidget import (
    SldWidget, display_sld, update_sld
)
from .sldexplorer import sld_explorer
from .sldnavigator import sld_navigator

from .svgwidget import (
    SvgWidget, display_svg, update_svg
)

try:
    __version__ = importlib.metadata.version("pypowsybl_jupyter")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"
