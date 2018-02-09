import {now} from './timing';

export default function getRendererPlugin({render, timing}) {
  return async function renderer(ctx, next) {
    const timer = timing.from(ctx);
    timer.downstream.resolve(now() - timer.start);

    let renderStart = -1;
    if (ctx.element) {
      renderStart = now();
      ctx.rendered = await render(ctx.element);
    }

    await next();

    if (ctx.element) {
      timer.render.resolve(now() - renderStart);
    }
    timer.upstreamStart = now();
  };
}
