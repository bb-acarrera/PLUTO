import Ember from 'ember';

export function showRuleEditor(params, {ruleInstance, rules, ruleset,
	parsers, importers, exporters, rulesetconfiguis, readOnly}) {
  var content = "<div>";

  if (!ruleInstance || !rules)
    return "";


  var uiConfig;

  const itemSets = [rules, parsers, importers, exporters, rulesetconfiguis];
  let items;

  for(var i = 0; i < itemSets.length; i++) {
    items = itemSets[i];

    items.forEach(item => {
      if (item.get("filename") == ruleInstance.filename)
        uiConfig = item.get("ui");
    });

    if(uiConfig) {
      break;
    }
  }

  //get the column names from the parser
  var parser = ruleset.get("parser");

  var columnLabels = [];
  if(parser && parser.config && parser.config.columnNames) {
    columnLabels = parser.config.columnNames;
  }

  let name = ruleInstance.name || ruleInstance.filename;
  if(name) {
    content += `<div>Name <input id="name" type="text" value="${name}" disabled=${readOnly}/></div><br/>`;
  }


  if (ruleInstance && uiConfig && uiConfig.properties) {
    // Place the name prompt at the top, always.

    content += addProperties(ruleInstance, uiConfig.properties, columnLabels, readOnly);
  }
  else if (ruleInstance && ruleInstance.config) {
    // If there is no UI do the best we can.
    // Place the name prompt at the top, always.
   for (var key in ruleInstance.config) {
      // if (key != 'name')
        content += `<div>${key} <input id="${key}" type="text" value="${ruleInstance.config[key]} disabled=${readOnly}"/></div>`;
    }
  }
  content += "</div>";

  return Ember.String.htmlSafe(content);
}

function addProperties(instance, properties, columnLabels, readOnly) {
  var content = "";
  for (var i = 0; i < properties.length; i++) {
    let property = properties[i];
    if (!property.name)
      continue;

    switch (property.type) {
      case 'boolean':
        content += addBooleanProperty(instance, property, readOnly);
        break;
      case 'choice':
        content += addChoiceProperty(instance, property, readOnly);
        break;
      case 'column':
        content += addColumnProperty(instance, property, columnLabels, readOnly);
        break;
      case 'date':
        content += addDateProperty(instance, property, readOnly);
        break;
      case 'float':
      case 'number':
        content += addFloatProperty(instance, property, readOnly);
        break;
      case 'integer':
        content += addIntegerProperty(instance, property, readOnly);
        break;
      case 'time':
        content += addTimeProperty(instance, property, readOnly);
        break;
      case 'validator':
        content += addValidator(instance, property, readOnly);
        break;
      case 'string': // Fall through to default.
      default:
        content += addStringProperty(instance, property, readOnly);
    }
  }
  return content;
}

function addBooleanProperty(instance, property, readOnly) {
  let initialValue = instance.config[property.name] || property.default || false;
  return `<div>${property.label || property.name} <input id="${property.name}" type="checkbox" ${initialValue ? "checked" : ""} disabled=${readOnly}/></div>`;
}

function iterateChoices(choices, fn) {

	for (var i = 0; i < choices.length; i++) {
		let item = choices[i];
		let choice, label;

		if (Array.isArray(item)) {
			choice = item[0];
			label = item[1];
		} else if (typeof item == 'object') {
			choice = item.value;
			label = item.label;
		} else {
			choice = item;
			label = item;
		}

		fn(choice, label);
	}
}

function addChoiceProperty(instance, property, readOnly) {
	if (!property.choices || property.choices.length == 0)
		return "";

	let content = `<div>${property.label || property.name}<select id="${property.name}" disabled=${readOnly}>`;
	let initialValue = instance.config[property.name] || property.default || property.choices[0];

	iterateChoices(property.choices, (choice, label) => {
		content += `<option value="${choice}"`;
		if (choice == initialValue) {
			content += " selected";
		}

		content += `>${label}</option>`;
	});

	content += "</select></div>";
	return content;
}

function addColumnProperty(instance, property, columnLabels, readOnly) {
  if (!columnLabels || columnLabels.length == 0)
    return "";

  let content=`<div>${property.label || property.name} <select id="${property.name}" disabled=${readOnly}>`
  let initialValue = instance.config[property.name] || property.default || columnLabels[0];
  for (var i = 0; i < columnLabels.length; i++) {
    let choice = columnLabels[i];
    content += `<option value="${choice}"`;
    if (choice == initialValue)
      content += " selected";
    content += `>${choice}</option>`;
  }
  content += "</select></div>";
  return content;
}

function addDateProperty(instance, property, readOnly) {
  var today = new Date();
  let initialValue = instance.config[property.name] || property.default || property.minimum || property.maximum || (today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate());
  let content = `<div>${property.label || property.name} <input id="${property.name}" type="date" value="${initialValue}" disabled=${readOnly}`;
  if (property.minimum)
    content += ` min="${property.minimum}"`;
  if (property.maximum)
    content += ` max="${property.maximum}"`;
  content += `/></div>`;
  return content;

}

function addFloatProperty(instance, property, readOnly) {
  let initialValue = instance.config[property.name] || property.default || property.minimum || property.maximum || 0;
  let content = `<div>${property.label || property.name} <input id="${property.name}" type="number" value="${initialValue}" step="0.01" disabled=${readOnly}`;  // TODO: Calculate a better step value?
  if (property.minimum)
    content += ` min="${property.minimum}"`;
  if (property.maximum)
    content += ` max="${property.maximum}"`;
  content += `/></div>`;
  return content;
}

function addIntegerProperty(instance, property, readOnly) {
  let initialValue = instance.config[property.name] || property.default || property.minimum || property.maximum || 0;
  let content = `<div>${property.label || property.name} <input id="${property.name}" type="number" value="${initialValue}" disabled=${readOnly}`;
  if (property.minimum)
    content += ` min="${property.minimum}"`;
  if (property.maximum)
    content += ` max="${property.maximum}"`;
  content += `/></div>`;
  return content;
}

function addStringProperty(instance, property, readOnly) {
  let initialValue = instance.config[property.name] || property.default || "";
  return `<div>${property.label || property.name} <input id="${property.name}" type="text" value="${initialValue}" disabled=${readOnly}/></div>`;
}

function addTimeProperty(instance, property, readOnly) {
  var today = new Date();
  let initialValue = instance.config[property.name] || property.default || property.minimum || property.maximum || (today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds());
  let content = `<div>${property.label || property.name} <input id="${property.name}" type="time" value="${initialValue}" disabled=${readOnly}`;
  if (property.minimum)
    content += ` min="${property.minimum}"`;
  if (property.maximum)
    content += ` max="${property.maximum}"`;
  content += `/></div>`;
  return content;

}

function addValidator(instance, property, readOnly) {
  let initialValue = instance.config[property.name] || property.default || "";
  let validator = property.validator || "*";
  return `<div>${property.label || property.name} <input id="${property.name}" type="text" pattern="${validator}" value="${initialValue}" disabled=${readOnly}/></div>`;
}

export default Ember.Helper.helper(showRuleEditor);
