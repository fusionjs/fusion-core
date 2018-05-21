/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from './create-token';

export const RenderToken = createToken('RenderToken');
export const ElementToken = createToken('ElementToken');
export const SSRDeciderToken = createToken('SSRDeciderToken');
