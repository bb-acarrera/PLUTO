import Ember from 'ember';

export function showRuleEditor(params, {ruleInstance, rules}) {
  var content = "<div>";

  if (!ruleInstance || !rules)
    return "";

  var uiConfig;
  rules.forEach(rule => {
    if (rule.get("filename") == ruleInstance.filename)
      uiConfig = rule.get("ui");
  });

  if (ruleInstance && uiConfig && uiConfig.properties) {
    // Place the name prompt at the top, always.
    let name = ruleInstance.config.name || ruleInstance.filename;
    content += `<div>Name <input id="Name" type="text" value="${name}"/></div><br/>`;

    for (var i = 0; i < uiConfig.properties.length; i++) {
      let property = uiConfig.properties[i];
      if (!property.name)
        continue;

      content += `<div>${property.label || property.name} <input id="${property.label || property.name}" type="text" value="${property.default || ''}"/></div>`;
    }
  }
  else if (ruleInstance && ruleInstance.config) {
    // If there is no UI do the best we can.
    // Place the name prompt at the top, always.
    let name = ruleInstance.config.name || ruleInstance.filename;
    content += `<div>Name <input id="Name" type="text" value="${name}"/></div><br/>`;

    for (var key in ruleInstance.config) {
      if (key != 'name')
        content += `<div>${key} <input id="${key}" type="text" value="${ruleInstance.config[key]}"/></div>`;
    }
  }
  content += "</div>";

  return Ember.String.htmlSafe(content);
}

export default Ember.Helper.helper(showRuleEditor);
