import { moduleForModel, test } from 'ember-qunit';

moduleForModel('ruleset', 'Unit | Model | ruleset', {
  // Specify the other units that are required for this test.
  needs: ['model:rule']
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});
