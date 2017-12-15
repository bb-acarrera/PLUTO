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

export default Ember.Mixin.create({
	emberizeRuleset(ruleset) {
		//Emberize the ruleset
		const propertiesToConvert = ["import","export","config","parser","general", "source", "target"];
		const arraysToConvert = ["rules", "reporters"];

		propertiesToConvert.forEach((item) => {
			const base = ruleset.get(item);
			if(base) {
				ruleset.set(item, convertElement(base));
			}

		});

		arraysToConvert.forEach((item) => {

			const baseList = ruleset.get(item);
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
});
