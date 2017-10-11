import Ember from 'ember';
import EmberUploader from 'ember-uploader';

// export default EmberUploader.FileField.extend( {
//     filesDidChange: function ( files ) {
//         const uploader = EmberUploader.Uploader.create( {
//             url: this.get( 'url' )
//         } );
//
//         if ( !Ember.isEmpty( files ) ) {
//             // this second argument is optional and can to be sent as extra data with the upload
//             uploader.upload( files[ 0 ], { ruleset: this.get( 'ruleset' ) } ).then( data => {
//                 console.log( data.runId );
//                 this.get( 'toggleUpload' )( data.runId );
//             }, error => {
//                 // Handle failure
//             } );
//         }
//
//         this.$().val( null );
//     },
//     actions: {
//         upload: function () {
//             this.$().click();
//         }
//     }
// } );

export default Ember.Component.extend({
    file: "",
    onFileChange: Ember.observer( 'file', function () {
        var files = $("#file-upload")[0].files;

        const uploader = EmberUploader.Uploader.create( {
            url: this.get( 'url' )
        } );

        if ( !Ember.isEmpty( files ) ) {
            // this second argument is optional and can to be sent as extra data with the upload
            uploader.upload( files[ 0 ], { ruleset: this.get( 'ruleset' ) } ).then( data => {
                console.log( data.runId );
                this.get( 'completion' )( data.runId );
            }, error => {
                // Handle failure
            } );
        }

        this.$().val( null );
    }),
    actions: {
        processChange: function (value) {
            console.log(value);
        }
    }
});

// export default Ember.Component.extend(Ember.Evented, {
//     tagName: 'input',
//     type: 'file',
//     attributeBindings: [
//         'name',
//         'disabled',
//         'form',
//         'type',
//         'accept',
//         'autofocus',
//         'required',
//         'multiple'
//     ],
//     multiple: false,
//     change (event) {
//         const input = event.target;
//         if (!Ember.isEmpty(input.files)) {
//             this.trigger('filesDidChange', input.files);
//         }
//     }
// });
