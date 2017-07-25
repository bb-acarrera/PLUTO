import Ember from 'ember';

export function showRuleEditor(params, {ruleInstance}) {
  var content = "<div>";

  if (ruleInstance && ruleInstance.config) {
    // Place the name prompt at the top, always.
    var name = ruleInstance.config.Name || ruleInstance.filename;
    content += `<div>Name <input id="Name" type="text" value="${name}"/></div><br/>`;

    for (var key in ruleInstance.config) {
      if (key != 'Name')
        content += `<div>${key} <input id="${key}" type="text" value="${ruleInstance.config[key]}"/></div>`;
    }
  }
  content += "</div>";

  return Ember.String.htmlSafe(content);
}

export default Ember.Helper.helper(showRuleEditor);
