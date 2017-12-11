import DS from 'ember-data';
import { validator, buildValidations } from 'ember-cp-validations';

//see http://offirgolan.github.io/ember-cp-validations/

const Validations = buildValidations({
	group: [
		validator('presence', true)
	],
	base: [
		validator('presence', true)
	],
	description: [
		validator('presence', true)
	]
});

export default DS.Model.extend(Validations, {
	description : DS.attr('string'),
	rule_id : DS.attr('string'),
	database_id : DS.attr('string'),
	config : DS.attr(),
	type : DS.attr('string'),
	base : DS.attr('string'),
	group: DS.attr('string'),
	version: DS.attr('number'),
	canedit: DS.attr('boolean'),
	ownerGroup: DS.attr('string'),
	updateUser: DS.attr('string'),
	updateTime: DS.attr('date'),
	deleted: DS.attr('boolean'),
	ui: DS.attr()
});
