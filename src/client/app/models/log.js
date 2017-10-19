import DS from 'ember-data';

export default DS.Model.extend({
  logType : DS.attr('string'),
  problemFile: DS.attr('string'),
  ruleID: DS.attr('string'),
  when: DS.attr('date'),
  description: DS.attr('string')
});
