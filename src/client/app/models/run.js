import DS from 'ember-data';

// A rule file, not a rule instance.
export default DS.Model.extend({
  ruleset: DS.attr('string'),
  inputfilename : DS.attr('string'),
  outputfilename : DS.attr('string'),
  log: DS.attr('string'),
  time: DS.attr('date'),
  errorcount: DS.attr('number'),
  warningcount: DS.attr('number')
});
