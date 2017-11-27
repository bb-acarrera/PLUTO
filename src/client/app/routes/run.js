import Ember from 'ember';
import RSVP from 'rsvp';
import RulesetEmberizer from '../mixins/ruleset-emberizer';



export default Ember.Route.extend(RulesetEmberizer, {
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

				function getItems(ruleset, source, target) {
					return RSVP.hash({
						run: run,
						file: params.run_id,
						ruleset: ruleset,
						source: source,
						target: target,
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
				}


				if(ruleset) {
					return this.store.queryRecord( 'ruleset', {id:ruleset, version:version}).then(ruleset => {

						let source = null;
						let target = null;
						let sourceFilename = ruleset.get('source.filename');
						let targetFilename = ruleset.get('target.filename');
						if (sourceFilename) {
							source = this.store.queryRecord('configuredrule', {id: sourceFilename})
						}

						if (targetFilename) {
							target = this.store.queryRecord('configuredrule', {id: targetFilename})
						}

						this.emberizeRuleset(ruleset);

						return getItems.call(this, ruleset, source, target);

					});
				} else {
					return getItems.call(this);
				}


			});
	},
	setupController(controller, _model) {
		this._super(...arguments);

	},

	actions: {
		error(reason){
			alert(reason);
		}
	}
});
