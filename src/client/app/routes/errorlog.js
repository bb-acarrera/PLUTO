import Ember from 'ember';
import RouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend(RouteMixin, {
    queryParams: {
        page: {
            refreshModel: true
        }
    },

    totalPages: Ember.computed.oneWay('model.meta.totalPages'),

    model (params) {
        return this.store.query('status',{
            page: params.page,
            size: 10
        }).then(function (result) {
            let meta = result.get('meta');
            return {result: result, meta: meta};
        });
    }
});
