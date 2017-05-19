import Ember from 'ember';

export function ruleLogRow(params, {rule, log}) {
  const ruleFileName = typeof rule === 'string' ? rule : rule.get('filename');

  var result = '';
  log.get('reports').forEach((report) => {
    const reportFile = report.get('problemFile');
    if (reportFile == ruleFileName)
      result += `<tr><td>${report.get('logType')}</td><td>${report.get('description')}</td></tr>`;
  });

  return Ember.String.htmlSafe(result);
}

export default Ember.Helper.helper(ruleLogRow);
