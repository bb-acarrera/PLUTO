import DS from 'ember-data';

export default DS.Model.extend({
    time: DS.attr('date'),
    message: DS.attr('string'),
    type: DS.attr('string')
});