import test from 'tape-cup';
import {html} from '../../sanitization';

test('sanitization api is not bundled', t => {
  t.equals(html, void 0);
  t.end();
});
