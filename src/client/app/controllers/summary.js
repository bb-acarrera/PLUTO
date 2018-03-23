import Ember from 'ember';
import moment from 'moment';

export default Ember.Controller.extend({
    buttonGroupValue2: 'week',
    chartData: Ember.computed('model.result.buckets','buttonGroupValue2',function(){
        let rawData = this.get('model.result.buckets');
        let selection = this.get('buttonGroupValue2');
        let buckets = 0;
        let width = 'd';
        let now = moment(new Date());

        //% jobs failed, average warnings, average dropped rows, is currently out of date
        buckets = 100000;
        if (selection == "week") {
            buckets = -moment(new Date()).subtract(1,"weeks").diff(now,"days");
        }else if (selection == "month"){
            buckets = -moment(new Date()).subtract(1,"months").diff(now,"days");
        }else if (selection == "quarter") {
            buckets = -moment(new Date()).subtract(1,"quarters").diff(now,"weeks");
            width = "weeks";
        }else if (selection == "year") {
            buckets = -moment(new Date()).subtract(1,"year").diff(now,"weeks");
            width = "weeks";
        }


        let dates = {};

        rawData.forEach((val)=>{
            let time = moment(val.get('time'));
            let day = time.format("L");
            let delta = now.diff(time, width);

            let bucket_start = moment(new Date()).subtract(delta,width).format("L");
            let bucket_end = moment(new Date()).subtract(delta - 1,width).format("L");

            let title = width == 'd'? day: bucket_start + "+";


            if ( delta>buckets ){
                return;
            }
            let errors = val.get('errorcount');
            if (!dates[title]) {
                dates[title] = {failed: 0, passed: 0, start: bucket_start, end: bucket_end, buckets: width !=='d'}
            }
            dates[title][errors > 0 ? 'failed': 'passed']++;
        });
        let data = [];
        for (const key of Object.keys(dates)) {
            data.push({date: key, start: dates[key].start, end: dates[key].end,  passed : dates[key].passed, failed : dates[key].failed, buckets: dates[key].buckets});
        }
        return data.reverse();
    })
});
