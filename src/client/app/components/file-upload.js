import Ember from 'ember';
import EmberUploader from 'ember-uploader';

export default Ember.Component.extend({
    actions: {
        processChange: function () {
            this.get( 'status' )();
            var files = this.$("#file-upload")[0].files;

            const uploader = EmberUploader.Uploader.create( {
                url: this.get( 'url' )
            } );

            if ( !Ember.isEmpty( files ) ) {
                // this second argument is optional and can to be sent as extra data with the upload
                uploader.upload( files[ 0 ], { ruleset: this.get( 'ruleset' ) } ).then( data => {
                    this.get( 'completion' )( data.runId );
                }, error => {
                    // Handle failure
                } );
            }

            this.$("#file-upload").val('');
        }
    }
});