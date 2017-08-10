import DS from 'ember-data';

export default DS.Model.extend({
    name : DS.attr('string'),
    filename : DS.attr('string'),
    ruleset_id : DS.attr('string'),
    database_id : DS.attr('string'),
    rules : DS.attr(),
    import : DS.attr(),
    export : DS.attr(),
    config : DS.attr(),
    parser: DS.attr()
});
