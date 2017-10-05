import Ember from 'ember';
import EmberUploader from 'ember-uploader';

export default EmberUploader.FileField.extend({
  filesDidChange: function(files) {
    const uploader = EmberUploader.Uploader.create({
      url: this.get('url')
    });

    if (!Ember.isEmpty(files)) {
      // this second argument is optional and can to be sent as extra data with the upload
      uploader.upload(files[0], { ruleset: this.get('ruleset') }).then(data => {
        console.log(data.runId);
      }, error => {
        // Handle failure
      });
    }

    this.$().val(null);
  },
  actions: {
    upload: function() {
      this.$().click();
    }
  }
});
