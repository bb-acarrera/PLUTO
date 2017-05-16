import Ember from 'ember';

export function ruleLogIcons(params, {rule, log, tagName}) {
  let tag = tagName === undefined ? 'i' : tagName;

  const ruleFileName = rule.get('filename');
  let hasInfo = false, hasWarnings = false, hasErrors = false;

  log.get('reports').forEach((report) => {
    const reportFile = report.get('problemFile');
    if (reportFile == ruleFileName) {
      switch (report.get('logType').toLowerCase()) {
        case 'error':
          hasErrors = true;
          break;
        case 'warning':
          hasWarnings = true;
          break;
        case 'info':
        default:
          hasInfo = true;
          break;
      }
    }
  });

  var result = "";
  if (hasErrors) {
    // {{#fa-stack as |s|}}
    // {{s.stack-1x "square" size="lg" style="color:firebrick"}}
    // {{s.stack-1x "exclamation" inverse=true}}
    // {{/fa-stack}}
    result += `<span class="fa-stack"><${tag} class="fa fa-square fa-lg fa-stack-1x" style="color:firebrick"></${tag}><${tag} class="fa fa-exclamation fa-stack-1x fa-inverse"></${tag}></span>`;
  }
  else if (hasWarnings) {
    // {{fa-icon "exclamation-triangle" size="lg" style="color:gold"}}
    result += `<${tag} class="fa fa-exclamation-triangle fa-lg" style="color:gold"></${tag}>`;
  }
  else if (hasInfo) {
    // {{fa-icon "info-circle" size="lg" style="color:deepskyblue"}}
    result += `<${tag} class="fa fa-info-circle fa-lg" style="color:deepskyblue"></${tag}>`;
  }

  return Ember.String.htmlSafe(result);
}

export default Ember.Helper.helper(ruleLogIcons);
