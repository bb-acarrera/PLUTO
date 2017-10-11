import Ember from 'ember';

export default Ember.Controller.extend({
    queryParams: ["page", "perPage", "ruleid", "type"],

    // set default values, can cause problems if left out
    // if value matches default, it won't display in the URL
    page: 1,
    perPage: 13,
    ruleid: null,
    type: null,

    // binding the property on the paged array
    // to a property on the controller
    totalPages: Ember.computed.oneWay("model.log.meta.totalPages"),

    errorTitle: Ember.computed('showErrors', function(){
        let rule = this.get('showErrors');
        if (rule) {
            if (rule.filename == 'global') {
                return "Global Notifications";
            }else {
                return "Notifications for " + rule.filename;
            }
        } else {
            return "All Notifications";
        }
    }),


    errors: Ember.computed('showErrors','model.log',function(){
        let log  = this.get('model.log').result;
        let rule = this.get('showErrors');

        let ruleID = undefined;

        if(rule && rule.config) {
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
    ruleData: Ember.computed('model.ruleset.rules','model.log', function() {
        let rules = this.get('model.ruleset.rules');
        let log = this.get('model.log.meta.ruleState');

        if (Array.isArray(rules)) {

            if(rules.length > 0 && rules[rules.length - 1].config.id !== 'global') {
                rules.push({
                    name: 'Global Errors',
                    filename: 'global',
                    config: {
                        id: 'global'
                    }
                });
            }


            rules.forEach(function (rule) {

                rule.warningcount = false;
                rule.errorcount = false;
                rule.hasAny = false;

                if (log[rule.config.id]) {
                    rule.warningcount = log[rule.config.id].warn;
                    rule.errorcount = log[rule.config.id].err;
                    rule.hasAny = rule.warningcount || rule.errorcount;
                }
            });

            return rules;
        }
        return [];
    }),
    showErrors: null,
    actions: {
        decPage() {
            this.transitionToRoute({queryParams: {page: Math.max(this.page - 1, 1)}});
        },
        incPage() {
            this.transitionToRoute({queryParams: {page: Math.min(this.page + 1, this.get('totalPages'))}});
        },
        toggleRowHighlight(rowID, rule) {
            const row = document.getElementById(rowID);

            const selected = row.classList.contains('selected');

            deselectItems(selected, this);

            if(!selected) {
                row.classList.add('selected');

                this.set('showErrors', rule);
                this.set('page', 1);
                this.set('ruleid', rule.config.id);


            }

            this.transitionToRoute({queryParams:{
                page: this.get('page'),
                ruleid: this.get('ruleid'),
                perPage: this.get('perPage'),
                type: this.get('type')
            }});

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
        controller.set('page',1);
        controller.set('ruleid', null);
    }

    controller.transitionToRoute({queryParams:{
        page: controller.get('page'),
        ruleid: controller.get('ruleid'),
        perPage: controller.get('perPage'),
        type: controller.get('type')
    }});

}


