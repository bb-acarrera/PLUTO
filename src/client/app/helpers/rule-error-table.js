import Ember from 'ember';

export function ruleErrorTable(params, {rule, log}) {
  const ruleFileName = typeof rule === 'string' ? rule : rule.filename;

  var result = '';
  log.get('reports').forEach((report) => {
    const reportFile = report.get('problemFile');
    if (reportFile == ruleFileName)
      result += `<tr class="error-row"><td class="error-cell">${report.get('logType')}</td><td>${report.get('description')}</td></tr>`;
  });
  if (result.length > 0)
    result = `<table class="error-table">${result}</table>`;

  return Ember.String.htmlSafe(result);
}

export default Ember.Helper.helper(ruleErrorTable);
