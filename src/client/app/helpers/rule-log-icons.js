import Ember from 'ember';

export function ruleLogIcons([value]) {
  let result =  '';
  let err = value.hasErrors || Ember.get(value,'errorcount');
  let warn = value.hasWarnings || Ember.get(value,'warningcount');
  if (err) {
    result = 'error-icon';
  }
  if (warn) {
    result = 'warning-icon';
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
