import Ember from 'ember';

export default Ember.Controller.extend({
    actions: {
        decPage() {
            this.transitionToRoute({queryParams: {page: Math.max(this.page - 1, 1)}});
        },
        incPage() {
            this.transitionToRoute({queryParams: {page: Math.min(this.page + 1, this.get('totalPages'))}});
        }
    }
});
