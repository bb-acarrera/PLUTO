import Ember from 'ember';

export function ifIn([obj, list]) {
  return list.indexOf(obj) > -1;
}

export default Ember.Helper.helper(ifIn);
