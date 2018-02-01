// @flow

/* Copied from fusion-tokens/index.js */
export const TokenType = {
  Required: 0,
  Optional: 1,
};
function Ref() {}
class TokenImpl {
  name: string;
  ref: mixed;
  type: $Values<typeof TokenType>;

  constructor(name: string, ref: mixed) {
    this.name = name;
    this.ref = ref || new Ref();
    this.type = ref ? TokenType.Optional : TokenType.Required;
    if (!ref) {
      // $FlowFixMe
      this.optional = new TokenImpl(name, this.ref);
    }
  }
}

export type Token<T> = {
  (): T,
  optional: () => ?T,
};
export function createToken(name: string): Token<any> {
  // $FlowFixMe
  return new TokenImpl(name);
}
