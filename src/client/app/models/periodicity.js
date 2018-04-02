import DS from 'ember-data';
import RuleValidatorGenerator from '../mixins/rule-validator-generator';

export default DS.Model.extend({
    filename : DS.attr('string'),
    ui: DS.attr()
}, RuleValidatorGenerator);
