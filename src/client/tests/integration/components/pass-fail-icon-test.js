import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pass-fail-icon', 'Integration | Component | pass fail icon', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{pass-fail-icon}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#pass-fail-icon}}
      template block text
    {{/pass-fail-icon}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
