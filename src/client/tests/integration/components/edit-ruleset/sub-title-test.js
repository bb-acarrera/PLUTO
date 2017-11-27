import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('edit-ruleset/sub-title', 'Integration | Component | edit ruleset/sub title', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{edit-ruleset/sub-title}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#edit-ruleset/sub-title}}
      template block text
    {{/edit-ruleset/sub-title}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
