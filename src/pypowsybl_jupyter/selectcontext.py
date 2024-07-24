# Copyright (c) 2024, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
#

from collections import OrderedDict
import pandas as pd
from pypowsybl.network import Network

class SelectContext:

    def __init__(self, network:Network = None, vl_id : str = None, use_name:bool = True):
        self.network = network
        self.use_name = use_name
        self.display_attribute = 'name' if use_name else 'id'

        self.vls = network.get_voltage_levels(attributes=['name'])
        self.vls['name'] = self.vls['name'].replace('', pd.NA).fillna(self.vls.index.to_series().astype(str))
        self.vls['id'] = self.vls.index

        self.vls = self.vls.sort_values(by=self.display_attribute) if use_name else self.vls.sort_index()

        self.apply_filter(None)

        self.set_selected(self.vls.index[0] if vl_id is None else vl_id)

    def get_vls(self):
        return self.vls
    
    def set_selected(self, id):
        if id in self.vls.index:
            self.selected_vl = id
        else:
            raise ValueError(f'a voltage level with id={id} does not exist in the network.')

    def get_selected(self):
        return self.selected_vl
    
    def apply_filter(self, sfilter, search_attribute = None):
        if sfilter is not None and sfilter != '':
            search_by = self.display_attribute if search_attribute is None else search_attribute
            self.vls_filtered = self.vls[self.vls[search_by].str.contains(sfilter, case=False, na=False, regex=False)]
        else:
            self.vls_filtered = self.vls

    def is_selected_in_filtered_vls(self):
        return self.selected_vl in self.vls_filtered.index
    
    def get_filtered_vls_as_list(self):
        return list(zip(self.vls_filtered[self.display_attribute].values.tolist(), self.vls_filtered.index))

    def extend_filtered_vls(self, id):
        if (id in self.vls.index) and (id not in self.vls_filtered.index):
            self.vls_filtered = pd.concat([self.vls_filtered, self.vls.loc[[id]]])
