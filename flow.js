/* @flow */
import type {Context as KoaContext} from 'koa';
declare var __NODE__: Boolean;
declare var __BROWSER__: Boolean;

type ExtractReturnType = <V>(() => V) => V;

type ExtendedKoaContext = KoaContext & {memoized: Map<Object, mixed>};

type aliaser<Token> = {
  alias: (sourceToken: Token, destToken: Token) => aliaser<*>,
};

declare type SSRContext = {
  element: any,
  template: {
    htmlAttrs: Object,
    title: string,
    head: Array<string>,
    body: Array<string>,
  },
} & ExtendedKoaContext;
declare type Context = SSRContext | ExtendedKoaContext;

declare type FusionPlugin<Deps, Service> = {
  deps?: Deps,
  provides?: (Deps: $ObjMap<Deps, ExtractReturnType>) => Service,
  middleware?: (
    Deps: $ObjMap<Deps, ExtractReturnType>,
    Service: Service
  ) => Middleware,
};
declare type Middleware = (
  ctx: Context,
  next: () => Promise<void>
) => Promise<*>;

declare class FusionApp {
  constructor<Element>(element: Element, render: (Element) => any): FusionApp;
  registered: Map<any, any>;
  plugins: Array<any>;
  renderer: any;
  enhance<Token, Deps>(
    token: Token,
    enhancer: (
      item: $Call<ExtractReturnType, Token>
    ) => FusionPlugin<Deps, $Call<ExtractReturnType, Token>>
  ): void;
  enhance<Token>(token: Token, enhancer: (token: Token) => Token): void;
  register<Deps, Provides>(Plugin: FusionPlugin<Deps, Provides>): aliaser<*>;
  register<Token, Deps>(
    token: Token,
    Plugin: FusionPlugin<Deps, $Call<ExtractReturnType, Token>>
  ): aliaser<*>;
  // register<Token: null>(token: Token, val: null): aliaser<*>;
  // register<Token: string>(token: Token, val: string): aliaser<*>;
  // register<Token: number>(token: Token, val: number): aliaser<*>;
  register<Token: Object>(
    token: Token,
    val: $Call<ExtractReturnType, Token>
  ): aliaser<*>;
  middleware<Deps>(
    deps: Deps,
    middleware: (Deps: $ObjMap<Deps, ExtractReturnType>) => Middleware
  ): void;
  middleware(middleware: Middleware): void;
  callback(): () => Promise<void>;
  resolve(): void;
}
