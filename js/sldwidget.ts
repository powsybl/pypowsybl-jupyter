// Copyright (c) 2020-2024, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

import type { RenderProps, Initialize } from "@anywidget/types";

import { SingleLineDiagramViewer } from '@powsybl/diagram-viewer';

import "./sldwidget.css";

/* Specifies attributes defined with traitlets in ../src/pypowsybl_jupyter/__init__.py */
interface WidgetModel {
	value: string;
	value_meta: string;
	clicked_nextvl: string;
	clicked_switch: any;
	clicked_feeder: any;
	clicked_bus: any;
}

function initialize({ model }: Initialize<WidgetModel>) {
	/* (optional) model initialization logic */
}

function render({ model, el }: RenderProps<WidgetModel>) {

	const svg_data = model.get('value'); //svg content
	const metadata = model.get('value_meta'); //metadata

	const handleNextVl = (id: string) => {
		model.set("clicked_nextvl", id);
		model.save_changes();
		model.send({ event: 'click_nextvl' });
	};
	
	const handleSwitch = (id: string, switch_status: boolean, element: any) => {
		model.set("clicked_switch", { id: id, switch_status: switch_status });
		model.save_changes();
		model.send({ event: 'click_switch' });
	};

	const handleFeeder = (
		id: string,
		feederType: string | null,
		svgId: string,
		x: number,
		y: number,
	  ) => {
		model.set(
		  'clicked_feeder',
		  { id: id, feederType: feederType }
		);
		model.save_changes();
		model.send({ event: 'click_feeder' });
	};

	const handleBus = (id: string, svgId: string, x: number, y: number) => {
		model.set('clicked_bus', { id: id });
		model.save_changes();
		model.send({ event: 'click_bus' });
	};

	const handleTogglePopover = (
		shouldDisplay: boolean,
		anchorEl: any,
		equipmentId: string,
		equipmentType: string,
	  ) => {
	};

	const el_div = document.createElement('div');
    el_div.classList.add('svg-sld-viewer-widget');
    el.appendChild(el_div);

    new SingleLineDiagramViewer(
      el_div,
      svg_data,
      metadata ? JSON.parse(metadata) : null,
      "voltage-level",
      500,
      600,
      1000,
      1200,
      metadata ? handleNextVl : null, //callback on the next voltage arrows
      metadata ? handleSwitch : null, //callback on the breakers
      metadata ? handleFeeder : null, //callback on the feeders
      metadata ? handleBus : null, //callback on the buses
      "lightblue", //arrows color
      handleTogglePopover //callback on the togglePopOver
    );
}

export default { render, initialize };
