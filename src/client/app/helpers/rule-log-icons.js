import Ember from 'ember';

export function ruleLogIcons(params, {rule, log, tagName}) {
  let tag = tagName === undefined ? 'i' : tagName;

  const ruleFileName = typeof rule === 'string' ? rule : rule.filename;
  let hasInfo = false, hasWarnings = false, hasErrors = false;

  if(log && log.get) {
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
  }


  var result = "<td>";
  if (hasErrors) {
    // {{#fa-stack as |s|}}
    // {{s.stack-1x "square" size="lg" style="color:firebrick"}}
    // {{s.stack-1x "exclamation" inverse=true}}
    // {{/fa-stack}}
    // result += `<span class="fa-stack"><${tag} class="fa fa-square fa-lg fa-stack-1x" style="color:firebrick"></${tag}><${tag} class="fa fa-exclamation fa-stack-1x fa-inverse"></${tag}></span>`;
    result += `<${tag} class="fa fa-exclamation-triangle fa" style="color:firebrick"></${tag}>`;
  }
  result += "</td><td>"
  if (hasWarnings) {
    // {{fa-icon "exclamation-triangle" size="lg" style="color:gold"}}
    result += `<${tag} class="fa fa-exclamation-triangle fa" style="color:gold"></${tag}>`;
  }
  result += "</td><td>"
  if (hasInfo) {
    // {{fa-icon "info-circle" size="lg" style="color:deepskyblue"}}
    result += `<${tag} class="fa fa-info-circle fa" style="color:deepskyblue"></${tag}>`;
  }
  result += "</td>"

  return Ember.String.htmlSafe(result);
}

export default Ember.Helper.helper(ruleLogIcons);
