# Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

import importlib.metadata

class DependencyError(Exception):
    """Custom exception for dependency errors."""
    pass

from importlib.metadata import version, PackageNotFoundError
def check_pypowsybl_version(min_version):
    try:
        import inspect
        import pypowsybl

        module = inspect.getmodule(pypowsybl.print_version)
        if module is None:
            raise PackageNotFoundError(f"Module for function {func.__name__} not found.")
        module_name = module.__name__
        installed_version = version(module_name)
        if installed_version >= min_version:
            print(f"{module_name} version {installed_version} is already installed and meets the minimum pypowsybl_jupyter requirement for pypowsybl_jupyter of {min_version}.")
        else:
            raise DependencyError(f"{module_name} version {installed_version} is installed but does not meet the minimum requirement for pypowsybl_jupyter of {min_version}. Please update it.")

    except (PackageNotFoundError, ModuleNotFoundError) as e:
        raise DependencyError(f"pypowsybl is not installed or could not be determined. Please install it (minimum version required for pypowsybl_jupyter is {min_version}).")

#note that the real minimum version is 1.2.0. The 1.3.0 used here is for testing this approach
check_pypowsybl_version("1.3.0")

from .sldwidget import (
    SldWidget, display_sld, update_sld
)
from .nadwidget import (
    NadWidget, display_nad, update_nad
)
from .nadexplorer import nad_explorer
from .networkexplorer import network_explorer

try:
    __version__ = importlib.metadata.version("pypowsybl_jupyter")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"
