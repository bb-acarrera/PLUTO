import Ember from 'ember';
import moment from 'moment';

function getIconClass() {
    let classes = "fa fa-calendar-o na-color";
    let good = "fa fa-calendar-check-o good-color";
    let bad = "fa fa-calendar-times-o error-color";
    let now = moment();

    let lastsuccess = moment(this.get('ruleset.ruleset.lastsuccesstime'));//last time a file was successfully processed (either skipped or uploaded)
    let lastupload = moment(this.get('ruleset.ruleset.lastuploadtime'));//last time a file was uploaded (not skipped)

    let mustchange = this.get('ruleset.ruleset.periodicity.config.mustchange');

    let frequency = this.get('ruleset.ruleset.periodicity.config.frequency');
    if(!frequency) {
        this.set('ruleset.timestatus', "This ruleset has no timed validation requirements.");
        return classes;
    }

    if(mustchange) {
        lastsuccess = lastupload;
    }

    // if (!this.get('runcounts.passed')) {
    //     this.set('ruleset.timestatus', "Last run failed.");
    //     return bad;
    // }

    if(!lastsuccess) {
        this.set('ruleset.timestatus', "No run was performed on a file with " + frequency + " validation requirement!");
        return bad;
    }

    let days = now.diff(lastsuccess, "days");
    let months = now.diff(lastsuccess, "months");

    let setDayTooltip = ()=> {
        if(classes === bad) {
            if(mustchange) {
                this.set( 'ruleset.timestatus', "Latest successful unique run with " + frequency + " validation requirement was last ran " + (days + 1) + " days ago." );
            } else {
                this.set( 'ruleset.timestatus', "Latest successful run with " + frequency + " validation requirement was last ran " + (days + 1) + " days ago." );
            }
        } else {
            this.set('ruleset.timestatus', "All validations passed.");
        }
    };

    let setMonthTooltip = () => {
        if(classes === bad) {
            if (mustchange) {
                this.set( 'ruleset.timestatus', "Latest successful  unique run with " + frequency + " validation requirement was last ran " + (months + 1) + " months ago." );
            } else {
                this.set( 'ruleset.timestatus', "Latest successful run with " + frequency + " validation requirement was last ran " + (months + 1) + " months ago." );
            }
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
