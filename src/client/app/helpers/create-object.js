import Ember from 'ember';

export function createObject(/*params, hash*/) {
  return Ember.Object.create();
}

export default Ember.Helper.helper(createObject);
