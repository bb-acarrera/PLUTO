import DS from 'ember-data';

export default DS.Model.extend({
    ruleSet: DS.belongsTo('ruleset'),
    filename : DS.attr('string'),
    name: DS.attr('string')
});
