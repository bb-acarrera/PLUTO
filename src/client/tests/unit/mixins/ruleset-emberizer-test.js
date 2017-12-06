import Ember from 'ember';
import RulesetEmberizerMixin from 'client/mixins/ruleset-emberizer';
import { module, test } from 'qunit';

module('Unit | Mixin | ruleset emberizer');

// Replace this with your real tests.
test('it works', function(assert) {
  let RulesetEmberizerObject = Ember.Object.extend(RulesetEmberizerMixin);
  let subject = RulesetEmberizerObject.create();
  assert.ok(subject);
});
