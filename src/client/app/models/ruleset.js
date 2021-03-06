import DS from 'ember-data';

export default DS.Model.extend({
    name : DS.attr('string'),
    filename : DS.attr('string'),
    ruleset_id : DS.attr('string'),
    database_id : DS.attr('string'),
    rules : DS.attr(),
	posttasks : DS.attr(),
    import : DS.attr(),
    export : DS.attr(),
    config : DS.attr(),
    parser: DS.attr(),
    general: DS.attr(),
    version: DS.attr('number'),
	canedit: DS.attr('boolean'),
	ownergroup: DS.attr('string'),
	updateuser: DS.attr('string'),
	updatetime: DS.attr('date'),
	deleted: DS.attr('boolean'),
	source: DS.attr(),
	target: DS.attr(),
	reporters: DS.attr(),
    dovalidate: DS.attr('boolean'),
    custom: DS.attr(),
    periodicity: DS.attr(),
	lastuploadtime: DS.attr('date'),
	lastsuccesstime: DS.attr('date')

});
