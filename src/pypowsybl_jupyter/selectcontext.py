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

        self.vls = network.get_voltage_levels(attributes=['name'])
        self.vls['id'] = self.vls.index
        if use_name:
            self.vls['name'] = self.vls['name'].replace('', pd.NA).fillna(self.vls['id'])
        else:
            self.vls['name'] = self.vls.index
        
        self.vls = self.vls.sort_values(by='name')

        self.apply_filter_by_name(None)

        self.set_selected(self.vls.iloc[0].id if vl_id is None else vl_id)

    def get_vls(self):
        return self.vls
    
    def set_selected(self, id):
        if id in self.vls.index:
            self.selected_vl = id
        else:
            raise ValueError(f'a voltage level with id={id} does not exist in the network.')

    def get_selected(self):
        return self.selected_vl
    
    def apply_filter_by_name(self, sfilter):
        if sfilter is not None and sfilter != '':
            vls_filtered = self.vls[self.vls['name'].str.contains(sfilter, case=False, na=False, regex=False)]
        else:
            vls_filtered = self.vls

        self.vls_filtered_dict = OrderedDict(zip(vls_filtered.index, vls_filtered['name']))

    def is_selected_in_filtered_vls(self):
        return self.selected_vl in self.vls_filtered_dict
    
    def get_filtered_vls_as_list(self):
        names=list(self.vls_filtered_dict.values())
        ids=list(self.vls_filtered_dict.keys())
        name_id = list(zip(names,ids))
        return name_id

    def extend_filtered_vls(self, id):
        if (id in self.vls.index) and (id not in self.vls_filtered_dict):
            self.vls_filtered_dict[id]=self.vls.loc[id, 'name']