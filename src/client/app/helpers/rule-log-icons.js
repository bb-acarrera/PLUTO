import Ember from 'ember';

export function ruleLogIcons([value]) {
  let result =  '';
  let err = Ember.get(value,'errorcount');
  let warn = Ember.get(value,'warningcount');
  if (err) {
    result = 'error-color';
  }
  if (warn) {
    result = 'warning-color';
  }
  if (warn && err) {
    result = 'warning-and-error-icon';
  }

  if(!(warn || err)) {
    result = 'no-icon';
  }
  return result;
}

export default Ember.Helper.helper(ruleLogIcons);
