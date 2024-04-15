// Copyright (c) 2022, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import { SingleLineDiagramViewer } from '@powsybl/diagram-viewer';
import { MODULE_NAME, MODULE_VERSION } from './version';

// Import the CSS
import '../css/svgsldwidget.css';

export class SvgSldModel extends DOMWidgetModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _model_name: SvgSldModel.model_name,
      _model_module: SvgSldModel.model_module,
      _model_module_version: SvgSldModel.model_module_version,
      _view_name: SvgSldModel.view_name,
      _view_module: SvgSldModel.view_module,
      _view_module_version: SvgSldModel.view_module_version,
      clicked_nextvl: '',
      clicked_switch: {},
      clicked_feeder: {},
      clicked_bus: {},
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'SvgSldModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'SvgSldView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class SvgSldView extends DOMWidgetView {
  handleNextVL = (id: string) => {
    this.model.set('clicked_nextvl', id);
    this.model.save_changes();
    this.send({ event: 'click_nextvl' });
  };

  handleSwitch = (id: string, switch_status: boolean, element: any) => {
    this.model.set('clicked_switch', { id: id, switch_status: switch_status });
    this.model.save_changes();
    this.send({ event: 'click_switch' });
  };

  handleFeeder = (
    id: string,
    feederType: string | null,
    svgId: string,
    x: number,
    y: number,
  ) => {
    this.model.set('clicked_feeder', { id: id, feederType: feederType });
    this.model.save_changes();
    this.send({ event: 'click_feeder' });
  };

  handleBus = (id: string, svgId: string, x: number, y: number) => {
    this.model.set('clicked_bus', { id: id });
    this.model.save_changes();
    this.send({ event: 'click_bus' });
  };

  handleTogglePopover = (
    shouldDisplay: boolean,
    anchorEl: any,
    equipmentId: string,
    equipmentType: string,
  ) => {};

  render(): void {
    const metadata = this.model.get('value_meta');

    const el_div = document.createElement('div');
    el_div.classList.add('svg-sld-viewer-widget');
    this.el.appendChild(el_div);

    new SingleLineDiagramViewer(
      el_div,
      this.model.get('value'), //svg content
      metadata ? JSON.parse(this.model.get('value_meta')) : null, //metadata
      'voltage-level',
      500,
      600,
      1000,
      1200,
      metadata ? this.handleNextVL : null, //callback on the next voltage arrows
      metadata ? this.handleSwitch : null, //callback on the breakers
      metadata ? this.handleFeeder : null, //callback on the feeders
      metadata ? this.handleBus : null, //callback on the buses
      'lightblue', //arrows color
      this.handleTogglePopover, //callback on the togglePopOver
    );
  }
}
