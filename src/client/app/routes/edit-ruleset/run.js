import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Route.extend({
    queryParams: {
        page: {
            refreshModel: true
        },
        ruleid: {
            refreshModel: true
        },
        type: {
            refreshModel: true
        }
    },
    model(params) {
        return this.store.findRecord('run', params.run_id).then(
            run => {

                let ruleset = run.get('ruleset');
                let version = run.get('version');


                return RSVP.hash({
                    run: run,
                    file: params.run_id,
                    ruleset: ruleset ? this.store.queryRecord( 'ruleset', {id:ruleset, version:version} ) : null,
                    log: this.store.query('log', {
                        id: run.get('log'),
                        page: params.page,
                        size: params.perPage,
                        ruleid: params.ruleid,
                        type: params.type
                    }).then(function (result) {
                        let meta = result.get('meta');
                        return {result: result, meta: meta};
                    })
                });
            });
    },
    renderTemplate ( controller, model ) {
        this._super(controller, model);
    },
    setupController() {
        this._super(...arguments);
    },
    actions: {
        error(reason){
            alert(reason);
        }
    }
});
