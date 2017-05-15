import DS from 'ember-data';

export default DS.Model.extend({
  log: DS.belongsTo('log'),
  logType : DS.attr('string'),
  problemFile: DS.attr('string'),
  when: DS.attr('date'),
  description: DS.attr('string')
});
