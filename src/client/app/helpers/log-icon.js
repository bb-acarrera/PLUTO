import Ember from 'ember';

export function logIcon(params, {type, tagName}) {
  let tag = tagName === undefined ? 'i' : tagName;
  if (type.toLowerCase() == 'error') {
    // {{#fa-stack as |s|}}
    // {{s.stack-1x "square" size="lg" style="color:firebrick"}}
    // {{s.stack-1x "exclamation" inverse=true}}
    // {{/fa-stack}}
    return Ember.String.htmlSafe(`<span class="fa-stack"><${tag} class="fa fa-square fa-lg fa-stack-1x" style="color:firebrick"></${tag}><${tag} class="fa fa-exclamation fa-stack-1x fa-inverse"></${tag}></span>`);
  }
  else if (type.toLowerCase() == 'warning') {
    // {{fa-icon "exclamation-triangle" size="lg" style="color:gold"}}
    return Ember.String.htmlSafe(`<${tag} class="fa fa-exclamation-triangle fa-lg" style="color:gold"></${tag}>`);
  }
  else {  // if (type.toLowerCase() == 'info')
    // {{fa-icon "info-circle" size="lg" style="color:deepskyblue"}}
    return Ember.String.htmlSafe(`<${tag} class="fa fa-info-circle fa-lg" style="color:deepskyblue"></${tag}>`);
  }
}

export default Ember.Helper.helper(logIcon);
