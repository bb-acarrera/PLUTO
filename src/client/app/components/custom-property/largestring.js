import Base from './base';

export default Base.extend({
    tagName: 'div', //This tag is necessary for the class override below
    didInsertElement() {
        this._super(...arguments);
        this.$().parent().attr('class', 'property-list-block-div');
    }
});
