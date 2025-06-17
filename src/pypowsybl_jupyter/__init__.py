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
from .nadwidget import (
    NadWidget, display_nad, update_nad
)
from .nadexplorer import nad_explorer
from .networkexplorer import network_explorer
from .networkmapwidget import NetworkMapWidget

try:
    __version__ = importlib.metadata.version("pypowsybl_jupyter")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"
