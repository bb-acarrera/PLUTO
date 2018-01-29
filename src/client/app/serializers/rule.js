import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
	keyForAttribute: function(attr) {

		switch(attr) {
			case 'requiredParser':
				return 'requiredParser';
		}

		return this._super(...arguments);
	}
});
