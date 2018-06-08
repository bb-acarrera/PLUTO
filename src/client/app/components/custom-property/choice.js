import Base from './base';
import Ember from 'ember';

const apiBase = document.location.origin + '/api/v1';

function updateConfigListeners() {
    let apiEndpoint = this.get('uiItem.choicesAPI');
        let apiRefresh = this.get('uiItem.choicesRefreshOnChange');

        if(this.oldConfigObject) {
            Ember.keys(this.oldConfigObject).forEach((key) => {
                this.oldConfigObject.removeObserver(key, this, 'onConfigChange')
            });

            this.oldConfigObject = null;

        }

        if(apiRefresh && apiEndpoint) {
            //this.notifyPropertyChange('uiItem.choicesAPI');
            this.oldConfigObject = this.get('config');
            if(this.oldConfigObject) {
                apiRefresh.forEach((key) => {
                    this.oldConfigObject.addObserver(key, this, this.onConfigChange)
                });
            }
        }
}

function findState(stateList, itemName, instanceName) {
	if (stateList && itemName && instanceName) {
		let id = instanceName + '::' + itemName;
		let foundIndex  = -1;
		let item = stateList.find((item, index) => {
			if(item.get('id') === id) {
				foundIndex = index;
				return true;
			}

			return false;
		});

		if(item) {
			return {index: foundIndex, item: item};
		}

		return null;
	}
}

function findOrCreateState(stateList, itemName, instanceName) {
	if (stateList && itemName && instanceName) {

		let result = findState(stateList, itemName, instanceName);

		let state;

		if (result == null) {

			state = Ember.Object.create({
				id: instanceName + '::' + itemName
			});

			stateList.pushObject(state)
		} else {
			state = result.item;
		}

		return state;
	}
}

function setError(stateList, itemName, instanceName) {

	let state = findOrCreateState(stateList, itemName, instanceName);

	if(state) {
		state.set('invalid', true);
	}

}

export default Base.extend({

    choices: Ember.computed('uiItem.choices', 'uiItem.choicesAPI', function() {

        let choices = [];
        let items = this.get('uiItem.choices');
        let apiEndpoint = this.get('uiItem.choicesAPI');
        
        if(apiEndpoint) {

            choices = new Ember.RSVP.Promise((resolve) => {
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.onreadystatechange = () => {
                    const stateList = this.get('state');
                    const itemName = this.get('uiItem.name');
                    const instanceName = this.get('instanceName');
                    const errorObject = this.get('errorObject');
                       
                    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
    
                        let list = [];
    
                        try {
                            list = JSON.parse(xmlHttp.response).data;
                        } catch (e) {
                            console.log(e);
                        }

                        // Clear the error state. This conflicts with the validators but validators don't
                        // seem to work with choice components.
                        let result = findState(stateList, itemName, instanceName);
                        if(result) {
                            result.item.set('invalid', false);
                        }
                        if (errorObject)
                            errorObject.set('error', undefined);
                
                        resolve(list);
                    }
                    else if (xmlHttp.readyState == 4) {
                        // Set the error state.
                        const msg = `Error ${xmlHttp.status}: ${xmlHttp.statusText}`;
                        setError(stateList, itemName, instanceName);
                        if (errorObject)
                            errorObject.set('error', msg);
    
                        resolve([]);
                    }
                };
    
                let theUrl = apiBase + `/uichoicelist/${apiEndpoint}`;
                let theJSON = {
                    config: this.get('config')
                };
    
                xmlHttp.open("POST", theUrl, true); // true for asynchronous
                xmlHttp.setRequestHeader("Content-Type", "application/json");
                xmlHttp.send(JSON.stringify(theJSON));
            });    
            
            if(!this.oldConfigObject) {
                updateConfigListeners.call(this);
            }


        } else if(items) {
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
        
        
        if(choices) {

            return new Ember.RSVP.Promise((resolve) => {
                

                Ember.RSVP.Promise.resolve(choices).then((list) => {
                    let item = null;
                    list.forEach(element => {
                        if(element.value === value) {
                            item = element;
                        }
                    });

                    if(item) {
                        resolve(item);
                    } else {
                        resolve(value);
                    }

                });

            });
            
        } 
            
        return value;

    }),

    configChanged: Ember.observer('config', function() {
        updateConfigListeners.call(this);
    }),

    onConfigChange: function() {
        this.notifyPropertyChange('uiItem.choicesAPI');
    },

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
