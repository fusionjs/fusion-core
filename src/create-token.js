/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Token} from './types.js';

export const TokenType = Object.freeze({
  Required: 0,
  Optional: 1,
});
function Ref() {}
export class TokenImpl<TResolved> {
  name: string;
  ref: mixed;
  type: $Values<typeof TokenType>;
  optional: ?TokenImpl<TResolved>;
  stack: string;

  constructor(name: string, ref: mixed) {
    this.name = name;
    this.ref = ref || new Ref();
    this.type = ref ? TokenType.Optional : TokenType.Required;
    this.stack = new Error().stack;
    if (!ref) {
      this.optional = new TokenImpl(name, this.ref);
    }
  }
}

export function createToken<TResolvedType>(name: string): Token<TResolvedType> {
  return ((new TokenImpl(name): any): Token<TResolvedType>);
}
