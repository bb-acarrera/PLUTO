import Ember from 'ember';

export default Ember.Route.extend({
    model (params) {
        return this.store.query( 'run', {
            rulesetFilter: params.ruleset_id
        } ).then( function ( result ) {
            let meta = result.get( 'meta' );

            let total = {
                failed: 0,
                passed: 0,
                totalErrors: 0,
                totalWarnings: 0
            };
            result.forEach((val)=>{
                let errors = val.get('errorcount');
                let warnings = val.get('warningcount');

                total[errors > 0 ? 'failed': 'passed']++;
                total.totalErrors += errors;
                total.totalWarnings += warnings;
            });

            return {ruleset: params.ruleset_id, result: {buckets: result, totals: total}, meta: meta };
        } )
    }
});
