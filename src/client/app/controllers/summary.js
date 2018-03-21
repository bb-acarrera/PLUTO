import Ember from 'ember';
import moment from 'moment';

export default Ember.Controller.extend({
    buttonGroupValue2: 'all',
    chartData: Ember.computed('model.result.buckets','buttonGroupValue2',function(){
        let rawData = this.get('model.result.buckets');
        let selection = this.get('buttonGroupValue2');
        let now = moment(new Date());
        let dates = {};
        rawData.forEach((val)=>{
            let time = moment(val.get('time'));
            let day = time.format("L");
            if(selection =='all') {
                selection = 100000;//a lot of days
            }else {
                selection = Number(selection);
            }
            if ( now.diff(time, 'days')>selection){
                return;
            }
            let errors = val.get('errorcount');
            if (!dates[day]) {
                dates[day] = {failed: 0, passed: 0}
            }
            dates[day][errors > 0 ? 'failed': 'passed']++;
        });
        let data = [];
        for (const key of Object.keys(dates)) {
            data.push({date: key, passed : dates[key].passed, failed : dates[key].failed});
        }
        return data;
    })
});
