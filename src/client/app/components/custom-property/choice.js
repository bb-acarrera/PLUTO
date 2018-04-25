import Base from './base';
import Ember from 'ember';

export default Base.extend({

    choices: Ember.computed('uiItem.choices', function() {

        let choices = [];
        let items = this.get('uiItem.choices');
        
        if(items) {
            items.forEach(element => {
                if(Array.isArray(element)) {
                    choices.push({label: element[1], value : element[0]});
                } else if(element.label) {
                    choices.push(element);
                } else {
                    choices.push({label: element, value : element});
                }
            });
        }

        return choices;

    }),
    
    selectedValue: Ember.computed('choices', 'value', function() {

        let choices = this.get('choices');
        let value = this.get('value');
        let item = null;
        
        if(choices) {
            choices.forEach(element => {
                if(element.value === value) {
                    item = element;
                }
            });
        } else {
            item = value;
        }

        return item;

    }),

    actions: {
        setValue(entry) {

            if(!entry) {
                this.set('value', null);
            } else {
                this.set('value', entry.value);
            }
		}
    }
});
