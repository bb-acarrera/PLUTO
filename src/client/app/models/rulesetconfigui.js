import DS from 'ember-data';

export default DS.Model.extend({
  filename : DS.attr('string'),
  ui: DS.attr()
});
