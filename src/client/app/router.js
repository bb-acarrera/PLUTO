import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('editRuleset', {path: '/editRuleset/:ruleset_id'}, function() {
    this.route('run', {path: '/run/:run_id'});
  });
  this.route('runs');
  this.route('rulesets');
  this.route('admin', function() {
    this.route('configuredrule');
  });
  this.route('editConfiguredRule', {path: '/editConfiguredRule/:rule_id'});

  this.route('run', {path: '/run/:run_id'});

  this.route('edit-basic-ruleset', {path: '/editBasicRuleset/:ruleset_id'}, function() {
    this.route('run', {path: '/run/:run_id'});
  });
});

Router.reopen({
  location: 'hash'
});

export default Router;
