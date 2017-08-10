import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: [],
  actions: {
    showErrors(rule) {
      this.set('showErrors', rule);
    },

    toggleRowHighlight(rowID, rule) {
      const row = document.getElementById(rowID);

      const selected = row.classList.contains('selected');

      deselectItems(selected, this);

      if(!selected) {
        row.classList.add('selected');

        this.set('showErrors', rule);
      }

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
  }

}

