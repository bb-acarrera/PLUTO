import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: ["page", "perPage"],

  // set default values, can cause problems if left out
  // if value matches default, it won't display in the URL
  page: 1,
  perPage: 13,

  // binding the property on the paged array
  // to a property on the controller
  totalPages: Ember.computed.oneWay("model.log.meta.totalPages"),

  errors: Ember.computed('showErrors','model.log',function(){
    let log  = this.get('model.log').result;
    let rule = this.get('showErrors');

    let ruleID = undefined;

    if(rule === "global") {
      ruleID = rule;
    } else if(rule && rule.config) {
      ruleID = rule.config.id;
    }

    let result = [];
    log.forEach((report) => {
      if ((ruleID && ruleID == report.get("ruleID")) ||
        (ruleID === "global" && typeof report.get("ruleID") === "undefined") ||
        typeof ruleID === "undefined"){

        result.push({type: report.get('logType'), description: report.get('description')});
      }

    });

    return result;
  }),
  ruleData: Ember.computed('ruleset.rules','log', function(){
    let rules = this.get('model.ruleset.rules');
    let log = this.get('model.log.meta.ruleState');

    rules.forEach(function(rule){

      rule.warningcount = false;
      rule.errorcount = false;
      rule.hasAny = false;

      if(log[rule.config.id]){
        rule.warningcount = log[rule.config.id].warn;
        rule.errorcount = log[rule.config.id].err;
        rule.hasAny = rule.warningcount || rule.errorcount;
      }
    });

    return rules;
  }),
  showErrors: null,
  actions: {
    toggleRowHighlight(rowID, rule) {
      const row = document.getElementById(rowID);

      const selected = row.classList.contains('selected');

      deselectItems(selected, this);

      if(!selected) {
        row.classList.add('selected');

        this.set('showErrors', rule);
        this.set('page',1);
      }

    }
  },
  init: function() {
  }
});

function deselectItems(clearProperties, controller) {
  const rulesElem = document.getElementById('rulesTable');

  const items = rulesElem.childNodes;
  for (var i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.nodeName.toLowerCase() == "tr" && item.classList)
      item.classList.remove('selected');
  }

  if(clearProperties) {
    controller.set('showErrors', null);
    this.set('page',1);
  }

}


