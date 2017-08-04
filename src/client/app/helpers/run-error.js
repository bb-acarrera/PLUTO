import Ember from 'ember';

export function runError(params, {tagName}) {
  let tag = tagName === undefined ? 'i' : tagName;
  let errors = params[0],
    warnings = params[1];

  let result = '';

  if(errors && errors > 0) {
    result += `<${tag} class="fa fa-exclamation-triangle fa" style="color:firebrick"></${tag}>`
  }

  if(warnings && warnings > 0) {
    result += `<${tag} class="fa fa-exclamation-triangle fa" style="color:gold"></${tag}>`;
  }

  return Ember.String.htmlSafe(result);
}

export default Ember.Helper.helper(runError);
