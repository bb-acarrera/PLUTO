import DS from 'ember-data';

export default DS.Model.extend({
    name : DS.attr('string'),
    filename : DS.attr('string'),
    rules : DS.attr()
});
