import Ember from 'ember';

export function showRuleEditor(params, {ruleInstance, rules, ruleset, parsers}) {
  var content = "<div>";

  if (!ruleInstance || !rules)
    return "";

  var uiConfig;
  rules.forEach(rule => {
    if (rule.get("filename") == ruleInstance.filename)
      uiConfig = rule.get("ui");
  });

  if(!uiConfig) {
    parsers.forEach(parser => {
      if (parser.get("filename") == ruleInstance.filename)
        uiConfig = parser.get("ui");
    });
  }

  var rulesetConfig = ruleset.get("config") || {};
  var parser = ruleset.get("parser");

  var columnLabels = [];
  if(parser && parser.config && parser.config.columnNames) {
    columnLabels = parser.config.columnNames;
  }

  if (ruleInstance && uiConfig && uiConfig.properties) {
    // Place the name prompt at the top, always.
    let name = ruleInstance.name || ruleInstance.filename;
    content += `<div>Name <input id="name" type="text" value="${name}"/></div><br/>`;
    content += addProperties(ruleInstance, uiConfig.properties, columnLabels);
  }
  else if (ruleInstance && ruleInstance.config) {
    // If there is no UI do the best we can.
    // Place the name prompt at the top, always.
    let name = ruleInstance.name || ruleInstance.filename;
    content += `<div>Name <input id="Name" type="text" value="${name}"/></div><br/>`;

    for (var key in ruleInstance.config) {
      // if (key != 'name')
        content += `<div>${key} <input id="${key}" type="text" value="${ruleInstance.config[key]}"/></div>`;
    }
  }
  content += "</div>";

  return Ember.String.htmlSafe(content);
}

function addProperties(instance, properties, columnLabels) {
  var content = "";
  for (var i = 0; i < properties.length; i++) {
    let property = properties[i];
    if (!property.name)
      continue;

    switch (property.type) {
      case 'boolean':
        content += addBooleanProperty(instance, property);
        break;
      case 'choice':
        content += addChoiceProperty(instance, property);
        break;
      case 'column':
        content += addColumnProperty(instance, property, columnLabels);
        break;
      case 'date':
        content += addDateProperty(instance, property);
        break;
      case 'float':
      case 'number':
        content += addFloatProperty(instance, property);
        break;
      case 'integer':
        content += addIntegerProperty(instance, property);
        break;
      case 'time':
        content += addTimeProperty(instance, property);
        break;
      case 'validator':
        content += addValidator(instance, property);
        break;
      case 'string': // Fall through to default.
      default:
        content += addStringProperty(instance, property);
    }
  }
  return content;
}

function addBooleanProperty(instance, property) {
  let initialValue = instance.config[property.name] || property.default || false;
  return `<div>${property.label || property.name} <input id="${property.name}" type="checkbox" ${initialValue ? "checked" : ""}/></div>`;
}

function addChoiceProperty(instance, property) {
  if (!property.choices || property.choices.length == 0)
    return "";

  let content=`<div>${property.label || property.name} <select id="${property.name}">`
  let initialValue = instance.config[property.name] || property.default || property.choices[0];
  for (var i = 0; i < property.choices.length; i++) {
    let choice = property.choices[i];
    content += `<option value="${choice}"`;
    if (choice == initialValue)
      content += " selected";
    content += `>${choice}</option>`;
  }
  content += "</select></div>";
  return content;
}

function addColumnProperty(instance, property, columnLabels) {
  if (!columnLabels || columnLabels.length == 0)
    return "";

  let content=`<div>${property.label || property.name} <select id="${property.name}">`
  let initialValue = instance.config[property.name] || property.default || columnLabels[0];
  for (var i = 0; i < columnLabels.length; i++) {
    let choice = columnLabels[i];
    content += `<option value="${choice}"`;
    if (i == initialValue)
      content += " selected";
    content += `>${choice}</option>`;
  }
  content += "</select></div>";
  return content;
}

function addDateProperty(instance, property) {
  var today = new Date();
  let initialValue = instance.config[property.name] || property.default || property.minimum || property.maximum || (today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate());
  let content = `<div>${property.label || property.name} <input id="${property.name}" type="date" value="${initialValue}"`;
  if (property.minimum)
    content += ` min="${property.minimum}"`;
  if (property.maximum)
    content += ` max="${property.maximum}"`;
  content += `/></div>`;
  return content;

}

function addFloatProperty(instance, property) {
  let initialValue = instance.config[property.name] || property.default || property.minimum || property.maximum || 0;
  let content = `<div>${property.label || property.name} <input id="${property.name}" type="number" value="${initialValue}" step="0.01"`;  // TODO: Calculate a better step value?
  if (property.minimum)
    content += ` min="${property.minimum}"`;
  if (property.maximum)
    content += ` max="${property.maximum}"`;
  content += `/></div>`;
  return content;
}

function addIntegerProperty(instance, property) {
  let initialValue = instance.config[property.name] || property.default || property.minimum || property.maximum || 0;
  let content = `<div>${property.label || property.name} <input id="${property.name}" type="number" value="${initialValue}"`;
  if (property.minimum)
    content += ` min="${property.minimum}"`;
  if (property.maximum)
    content += ` max="${property.maximum}"`;
  content += `/></div>`;
  return content;
}

function addStringProperty(instance, property) {
  let initialValue = instance.config[property.name] || property.default || "";
  return `<div>${property.label || property.name} <input id="${property.name}" type="text" value="${initialValue}"/></div>`;
}

function addTimeProperty(instance, property) {
  var today = new Date();
  let initialValue = instance.config[property.name] || property.default || property.minimum || property.maximum || (today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds());
  let content = `<div>${property.label || property.name} <input id="${property.name}" type="time" value="${initialValue}"`;
  if (property.minimum)
    content += ` min="${property.minimum}"`;
  if (property.maximum)
    content += ` max="${property.maximum}"`;
  content += `/></div>`;
  return content;

}

function addValidator(instance, property) {
  let initialValue = instance.config[property.name] || property.default || "";
  let validator = property.validator || "*";
  return `<div>${property.label || property.name} <input id="${property.name}" type="text" pattern="${validator}" value="${initialValue}"/></div>`;
}

export default Ember.Helper.helper(showRuleEditor);
