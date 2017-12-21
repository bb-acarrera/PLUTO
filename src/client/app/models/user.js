import DS from 'ember-data';

export default DS.Model.extend({
	userid: DS.attr('string'),
	group: DS.attr('string'),
	admin: DS.attr('boolean'),
	apiurl: DS.attr('string'),
	features: DS.attr()
});
