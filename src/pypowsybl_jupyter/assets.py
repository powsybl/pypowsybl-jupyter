# Copyright (c) 2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

EMPTY_SVG = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 799 599" width="800" height="600" preserveAspectRatio="xMidYMid" style="display: block; background: transparent;">
    <rect width="800" height="600" fill="lightgrey"/>
</svg>
'''

PROGRESS_BAR_SVG= '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 30" width="250" height="30" preserveAspectRatio="xMidYMid" style="display: block; background: transparent;">
  <rect x="0" y="10" width="250" height="10" rx="5" ry="5" fill="#e0e0e0"/>
  <rect x="0" y="10" width="50" height="10" rx="5" ry="5" fill="#ffb259">
    <animate attributeName="x" values="0;200;0" dur="2s" repeatCount="indefinite"/>
  </rect>
</svg>
'''

PROGRESS_EMPTY_SVG = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 30" width="250" height="30" preserveAspectRatio="xMidYMid" style="display: block; background: transparent;">
  <rect width="250" height="30" fill="none" stroke="none"/>
</svg>
'''
