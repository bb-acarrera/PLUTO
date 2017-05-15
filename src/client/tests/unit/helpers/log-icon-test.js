
import { logIcon } from 'client/helpers/log-icon';
import { module, test } from 'qunit';

module('Unit | Helper | log icon');

// Replace this with your real tests.
test('Test get Info icon', function(assert) {
  let result = logIcon(null, {type:'Info'});
  assert.equal(result.string, '<i class="fa fa-info-circle fa-lg" style="color:deepskyblue"></i>');
});

// Replace this with your real tests.
test('Test get Warning icon', function(assert) {
  let result = logIcon(null, {type:'Warning'});
  assert.equal(result.string, '<i class="fa fa-exclamation-triangle fa-lg" style="color:gold"></i>');
});

// Replace this with your real tests.
test('Test get Error icon', function(assert) {
  let result = logIcon(null, {type:'Error'});
  assert.equal(result.string, '<span class="fa-stack"><i class="fa fa-square fa-lg fa-stack-1x" style="color:firebrick"></i><i class="fa fa-exclamation fa-stack-1x fa-inverse"></i></span>');
});

// Replace this with your real tests.
test('Test get Info icon with tag', function(assert) {
  let result = logIcon(null, {type:'Info', tagName:'div'});
  assert.equal(result.string, '<div class="fa fa-info-circle fa-lg" style="color:deepskyblue"></div>');
});
