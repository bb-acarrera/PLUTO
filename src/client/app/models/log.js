import DS from 'ember-data';

export default DS.Model.extend({
  name : DS.attr('string'),
  reports : DS.hasMany('report')
});
