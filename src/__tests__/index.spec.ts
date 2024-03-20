// Copyright (c) 2022, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

// Add any needed widget imports here (or from controls)
// import {} from '@jupyter-widgets/base';

import { createTestModel } from './utils';

import { SvgModel, SvgSldModel } from '..';

describe('SvgModel', () => {
  describe('SvgModel', () => {
    it('should be createable with a value', () => {
      const state = { value: 'svg' };
      const model = createTestModel(SvgModel, state);
      expect(model).toBeInstanceOf(SvgModel);
      expect(model.get('value')).toEqual('svg');
    });
  });
});

describe('SvgSldModel', () => {
  describe('SvgSldModel', () => {
    it('should be createable with a value', () => {
      const state = { value: 'svg', value_meta: 'svg_meta' };
      const model = createTestModel(SvgSldModel, state);
      expect(model).toBeInstanceOf(SvgSldModel);
      expect(model.get('value')).toEqual('svg');
      expect(model.get('value_meta')).toEqual('svg_meta');
    });
  });
});
