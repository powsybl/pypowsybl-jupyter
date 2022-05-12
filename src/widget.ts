// Copyright (c) 2022, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import '@svgdotjs/svg.panzoom.js';

import { NetworkAreaDiagramViewer } from '@powsybl/diagram-viewer'

import { MODULE_NAME, MODULE_VERSION } from './version';

// Import the CSS
import '../css/widget.css';

export class SvgModel extends DOMWidgetModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _model_name: SvgModel.model_name,
      _model_module: SvgModel.model_module,
      _model_module_version: SvgModel.model_module_version,
      _view_name: SvgModel.view_name,
      _view_module: SvgModel.view_module,
      _view_module_version: SvgModel.view_module_version,
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'SvgModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'SvgView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class SvgView extends DOMWidgetView {
  render(): void {
    new NetworkAreaDiagramViewer(this.el, this.model.get('value'), 2000, 2000);
  }
}
