import DS from 'ember-data';

export default DS.Model.extend({
    filename : DS.attr('string'),
    name: DS.attr('string'),
    config: DS.attr()
});
