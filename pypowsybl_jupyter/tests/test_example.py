# Copyright (c) 2022, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import pytest

from pypowsybl_jupyter import SvgWidget
from pypowsybl_jupyter import SvgSldWidget


def test_creation_svgwidget():
    w = SvgWidget(value="svgtest")
    assert w.value == 'svgtest'

def test_creation_svgsldwidget():
    w = SvgSldWidget(value="svgtest", value_meta="svgtestmeta")
    assert w.value == 'svgtest'
    assert w.value_meta == 'svgtestmeta'

