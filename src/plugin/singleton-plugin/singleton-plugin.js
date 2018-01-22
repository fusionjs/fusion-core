/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Plugin from '../plugin/plugin';

export default class SingletonPlugin extends Plugin {
  of() {
    return super.of();
  }
}
