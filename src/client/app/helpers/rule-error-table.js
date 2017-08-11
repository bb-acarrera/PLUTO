import Ember from 'ember';

export function ruleErrorTable(params, {rule, log}) {

  if(!log) {
    return Ember.String.htmlSafe('');
  }

  let ruleID = undefined;

  if(rule === "global") {
    ruleID = rule;
  } else if(rule && rule.config) {
    ruleID = rule.config.id;
  }


  var result = '';
  log.get('reports').forEach((report) => {
    if ((ruleID && ruleID == report.get("ruleID")) ||
      (ruleID === "global" && typeof report.get("ruleID") === "undefined") ||
      typeof ruleID === "undefined"){

      result += `<tr class="error-row"><td class="error-cell">${report.get('logType')}</td><td>${report.get('description')}</td></tr>`;
    }

  });
  if (result.length > 0)
    result = `<table class="error-table">${result}</table>`;

  return Ember.String.htmlSafe(result);
}

export default Ember.Helper.helper(ruleErrorTable);
