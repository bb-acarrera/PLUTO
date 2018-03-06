import Ember from 'ember';
import moment from 'moment';

function getIconClass() {
    let classes = "fa fa-calendar-o na-color";
    let good = "fa fa-calendar-check-o good-color";
    let bad = "fa fa-calendar-times-o error-color";
    let now = moment();
    //let lastupdate = moment(this.get('ruleset.ruleset.updatetime'));

    let frequency = this.get('ruleset.ruleset.periodicity.config.frequency');
    if(!frequency) {
        this.set('ruleset.timestatus', "This ruleset has no timed validation requirements.");
        return classes;
    }

    if (!this.get('runcounts.passed')) {
        this.set('ruleset.timestatus', "Last run failed.");
        return bad;
    }

    let lastrun_det = this.get('runcounts.time');

    if(!lastrun_det) {
        this.set('ruleset.timestatus', "No run was performed on a file with " + frequency + " validation requirement!");
        return bad;
    }

    let days = now.diff(lastrun_det, "days");
    let months = now.diff(lastrun_det, "months");


    let mustchange = this.get('ruleset.ruleset.periodicity.config.mustchange');
    let didnotchange = this.get('runcounts.summary.wasskipped');

    if (mustchange && didnotchange) {
        this.set('ruleset.timestatus', "The file did not change during last run as was required!");
        return bad;
    }

    let setDayTooltip = ()=> {
        if(classes === bad) {
            this.set('ruleset.timestatus', "Latest run with " + frequency + " validation requirement was last ran " + (days + 1) + " days ago");
        } else {
            this.set('ruleset.timestatus', "All validations passed.");
        }
    };

    let setMonthTooltip = () => {
        if(classes === bad) {
            this.set('ruleset.timestatus', "Latest run with " + frequency + " validation requirement was last ran " + (months + 1) + " days ago");
        } else {
            this.set('ruleset.timestatus', "All validations passed.");
        }
    };

    if(frequency === 'Daily') {
        classes = days>0?bad:good;
        setDayTooltip();
    } else if(frequency === 'Weekly') {
        classes = days>6?bad:good;
        setDayTooltip();
    } else if(frequency === 'Monthly') {
        classes = months>0?bad:good;
        setMonthTooltip();
    } else if(frequency === 'Quarterly') {
        classes = months>3?bad:good;
        setMonthTooltip();
    }


    return classes;
}

export default Ember.Component.extend({
    tagName: 'i',
    classNameBindings: ['icon'],
    icon: '',
    init() {
        this._super(...arguments);
        const classes = getIconClass.call(this);

        this.set('icon', classes);
    },
    iconTypeObserver: Ember.observer('ruleset', 'runcounts.time', 'runcounts',
        function() {

            const classes =  getIconClass.call(this);

            this.set('icon', classes);
        })
});
