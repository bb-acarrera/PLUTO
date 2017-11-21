import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('custom-property/list', 'Integration | Component | custom property/list', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{custom-property/list}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#custom-property/list}}
      template block text
    {{/custom-property/list}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
