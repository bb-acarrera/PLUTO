import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: [],
  actions: {
    showErrors(rule) {
      this.set('showErrors', rule);
    },

    toggleRowHighlight(rowID, rule) {
      const row = document.getElementById(rowID);

      var siblings = row.parentNode.childNodes;
      for (var i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling.nodeName.toLowerCase() == "tr" && sibling.classList)
          sibling.classList.remove('success');
      }

      row.classList.add('success');

      this.set('showErrors', rule);
    }
  },
  init: function() {
  }
});

