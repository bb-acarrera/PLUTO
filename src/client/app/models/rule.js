import DS from 'ember-data';
import RuleValidatorGenerator from '../mixins/rule-validator-generator';

// A rule file, not a rule instance.
export default DS.Model.extend({
    filename : DS.attr('string'),
    name: DS.attr('string'),
	ui: DS.attr(),
	shortdescription: DS.attr('string'),
	longdescription: DS.attr('string'),
	title: DS.attr('string')


}, RuleValidatorGenerator);
