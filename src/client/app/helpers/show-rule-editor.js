import Ember from 'ember';

export function showRuleEditor(params, {rule}) {
  var content = "<div>";
  if (rule && rule.config) {
    for (var key in rule.config) {
      content += `<div>${key} <input id="${key}" type="text" value="${rule.config[key]}"/></div>`;
    }
  }
  content += "</div>";
  
  return Ember.String.htmlSafe(content);
}

export default Ember.Helper.helper(showRuleEditor);
