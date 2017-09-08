import Ember from 'ember';
import pagedArray from 'ember-cli-pagination/computed/paged-array';


export default Ember.Controller.extend({
  queryParams: ["page", "perPage"],

  // set default values, can cause problems if left out
  // if value matches default, it won't display in the URL
  page: 1,
  perPage: 13,

  // can be called anything, I've called it pagedContent
  // remember to iterate over pagedContent in your template
  pagedContent: pagedArray('errors', {
    page: Ember.computed.alias("parent.page"),
    perPage: Ember.computed.alias("parent.perPage")
  }),

  // binding the property on the paged array
  // to a property on the controller
  totalPages: Ember.computed.oneWay("pagedContent.totalPages"),

  errors: Ember.computed('showErrors','model.log',function(){
    let log  = this.get('model.log');
    let rule = this.get('showErrors');

    let ruleID = undefined;

    if(rule === "global") {
      ruleID = rule;
    } else if(rule && rule.config) {
      ruleID = rule.config.id;
    }

    let result = [];
    log.get('reports').forEach((report) => {
      if ((ruleID && ruleID == report.get("ruleID")) ||
        (ruleID === "global" && typeof report.get("ruleID") === "undefined") ||
        typeof ruleID === "undefined"){

        result.push({type: report.get('logType'), description: report.get('description')});
      }

    });

    return result;
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
  }

}


