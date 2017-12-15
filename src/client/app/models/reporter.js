import DS from 'ember-data';

export default DS.Model.extend({
	filename : DS.attr('string'),
	name: DS.attr('string'),
	ui: DS.attr(),
	shortdescription: DS.attr('string'),
	longdescription: DS.attr('string')
});
