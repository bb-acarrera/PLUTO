import Ember from 'ember';
import RuleValidatorMixin from 'client/mixins/rule-validator-generator';
import { module, test } from 'qunit';

module('Unit | Mixin | rule validator');

// Replace this with your real tests.
test('it works', function(assert) {
  let RuleValidatorObject = Ember.Object.extend(RuleValidatorMixin);
  let subject = RuleValidatorObject.create();
  assert.ok(subject);
});
