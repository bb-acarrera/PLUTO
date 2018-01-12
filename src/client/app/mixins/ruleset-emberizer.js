import Ember from 'ember';

function convertElement(base) {
	if(base) {
		const e = Ember.Object.create(base);

		if(base.config) {
			e.set('config', Ember.Object.create(base.config));
		}

		return e;
	}

	return null;
}

function convertModel(model, propertiesToConvert, arraysToConvert) {
	propertiesToConvert.forEach((item) => {
		const base = model.get(item);
		if (base) {
			model.set(item, convertElement(base));
		}

	});

	arraysToConvert.forEach((item) => {

		const baseList = model.get(item);
		let newList = [];

		baseList.forEach((element) => {
			newList.push(convertElement(element));
		});

		baseList.clear();
		newList.forEach((elem) => {
			baseList.push(elem);
		});

	});
}
export default Ember.Mixin.create({
	emberizeRuleset(ruleset) {
		//Emberize the ruleset
		const propertiesToConvert = ["import","export","config","parser","general", "source", "target"];
		const arraysToConvert = ["rules", "reporters"];

		convertModel(ruleset, propertiesToConvert, arraysToConvert);
	},

	emberizeConfiguredRule(configuredRule) {
		const propertiesToConvert = ["config"];
		const arraysToConvert = [];

		convertModel(configuredRule, propertiesToConvert, arraysToConvert);
	}
});
