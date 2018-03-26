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
        this.set('ruleset.timestatus', "This validation does not have an expected update frequency.");
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
        this.set('ruleset.timestatus', "This validation has an expected update of " + frequency.toLowerCase() + " but has never been uploaded.");
        return bad;
    }

	let dateStr = lastsuccess.format('MMMM Do YYYY, h:mm:ss a');

    let hours = now.diff(lastsuccess, "hours");
    let days = now.diff(lastsuccess, "days");
    let months = now.diff(lastsuccess, "months");

	let badMsg = "This validation is out of date. It is expected to update " + frequency.toLowerCase() + " but was last successfully processed on " + dateStr;
	let badMsgMustChange = "This validation is out of date. It is expected to update and be changed " + frequency.toLowerCase() + " but was last uploaded on " + dateStr;
	let goodMsg = "This validation was successfully processed within the expected updated frequency (" + frequency.toLowerCase() + ").";

    let setHourTooltip = ()=> {
        if(classes === bad) {
            if(mustchange) {
                this.set( 'ruleset.timestatus', badMsgMustChange + " (" + (hours + 1) + " hours ago)." );
            } else {
                this.set( 'ruleset.timestatus', badMsg + " (" + (hours + 1) + " hours ago)." );
            }
        } else {
            this.set('ruleset.timestatus', goodMsg);
        }
    };

    let setDayTooltip = ()=> {
        if(classes === bad) {
			if(mustchange) {
                this.set( 'ruleset.timestatus', badMsgMustChange + " (" + (days + 1) + " days ago)." );
            } else {
                this.set( 'ruleset.timestatus', badMsg + " (" + (days + 1) + " days ago)." );
            }
        } else {
            this.set('ruleset.timestatus', goodMsg);
        }
    };

    let setMonthTooltip = () => {
        if(classes === bad) {
            if (mustchange) {
                this.set( 'ruleset.timestatus', badMsgMustChange + " (" + (months + 1) + " months ago)." );
            } else {
                this.set( 'ruleset.timestatus', badMsg + " (" + (months + 1) + " months ago)." );
            }
        } else {
            this.set('ruleset.timestatus', goodMsg);
        }
    };

    if(frequency === 'Hourly') {
        classes = hours>0?bad:good;
        setHourTooltip();
    }else if(frequency === 'Daily') {
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
    } else if(frequency === 'Annually') {
        classes = months>11?bad:good;
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
