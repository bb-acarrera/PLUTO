import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  //this.route('run', {path: '/run/:run_id'});
  this.route('editRuleset', {path: '/editRuleset/:ruleset_id'}, function() {
    this.route('run', {path: '/run/:run_id'});
    this.route('about');
  });
});

Router.reopen({
  location: 'hash'
});

export default Router;
