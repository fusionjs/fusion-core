import {withDependencies} from './with-dependencies';
import {withMiddleware} from './with-middleware';
import {TimingToken, now} from './timing';

export default function getRendererPlugin(render) {
  return withDependencies({timing: TimingToken})(({timing}) => {
    return withMiddleware(async function renderer(ctx, next) {
      const timer = timing.from(ctx);
      timer.downstream.resolve(now() - timer.start);

      if (ctx.element) {
        const renderStart = now();
        ctx.rendered = await render(ctx.element);
        timer.render.resolve(now() - renderStart);
      }

      const upstreamStart = now();
      await next();
      timer.upstream.resolve(now() - upstreamStart);
    });
  });
}
