const RulesetRouter = require('../../routes/rulesets');
const rulesetRouter = new RulesetRouter({});

QUnit.test( "validateInputOwnerGroupEdit: No auth group and input group provided", function(assert){
  let auth = {
    admin: false,
    group: undefined 
  }
  let inputgroup = 'GroupA';
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: No auth group and no input group provided", function(assert){
  let auth = {
    admin: false,
    group: undefined 
  }
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, undefined);

  assert.equal(true, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with single group and correct input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA" 
  }
  let inputgroup = "GroupA"
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with single group and incorrect input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA" 
  }
  let inputgroup = "GroupB"
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with single group and no input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA" 
  }
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, undefined);

  assert.equal(true, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with mult group and correct input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA;GroupB" 
  }
  let inputgroup = "GroupA";
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with mult group and correct input group provided 2", function(assert){
  let auth = {
    admin: false,
    group: "GroupA;GroupB" 
  }
  let inputgroup = "GroupB";
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with mult group and incorrect input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA;GroupB" 
  }
  let inputgroup = "GroupC";
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with mult group and no input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA;GroupB" 
  }
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, undefined);

  assert.equal(true, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin No auth group and input group provided", function(assert){
  let auth = {
    admin: true,
    group: undefined
  }
  let inputgroup = "GroupA";
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin No auth group and no input group provided", function(assert){
  let auth = {
    admin: true,
    group: undefined
  }
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, undefined);

  assert.equal(true, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with single group and correct input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA"
  }
  let inputgroup = "GroupA";
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with single group and incorrect input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA"
  }
  let inputgroup = "GroupB";
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with single group and no input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA"
  }
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, undefined);

  assert.equal(true, rv.valid);
  assert.equal(undefined, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with mult group and correct input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA;GroupB"
  }
  let inputgroup = "GroupA"
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with mult group and correct input group provided 2", function(assert){
  let auth = {
    admin: true,
    group: "GroupA;GroupB"
  }
  let inputgroup = "GroupB"
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with mult group and incorrect input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA;GroupB"
  }
  let inputgroup = "GroupC"
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with mult group and no input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA;GroupB"
  }
  let rv = rulesetRouter.validateInputOwnerGroupEdit(auth, undefined);

  assert.equal(true, rv.valid);
  assert.equal(undefined, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: No auth group and input group provided", function(assert){
  let auth = {
    admin: false,
    group: undefined
  }
  let inputgroup = "GroupA";
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: No auth group and no input group provided", function(assert){
  let auth = {
    admin: false,
    group: undefined
  }
  let rv = rulesetRouter.validateInputOwnerGroup(auth, undefined);

  assert.equal(true, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with single group and correct input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA"
  }
  let inputgroup = "GroupA";
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with single group and incorrect input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA"
  }
  let inputgroup = "GroupB";
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with single group and no input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA"
  }
  let rv = rulesetRouter.validateInputOwnerGroup(auth, undefined);

  assert.equal(false, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with mult group and correct input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA;GroupB"
  }
  let inputgroup = "GroupA"
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with mult group and correct input group provided 2", function(assert){
  let auth = {
    admin: false,
    group: "GroupA;GroupB"
  }
  let inputgroup = "GroupB"
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with mult group and incorrect input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA;GroupB"
  }
  let inputgroup = "GroupC"
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with mult group and no input group provided", function(assert){
  let auth = {
    admin: false,
    group: "GroupA;GroupB"
  }
  let rv = rulesetRouter.validateInputOwnerGroup(auth, undefined);

  assert.equal(false, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin No auth group and input group provided", function(assert){
  let auth = {
    admin: true,
    group: undefined
  }
  let inputgroup = "GroupA"
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin No auth group and no input group provided", function(assert){
  let auth = {
    admin: true,
    group: undefined
  }
  let rv = rulesetRouter.validateInputOwnerGroup(auth, undefined);

  assert.equal(true, rv.valid);
  assert.equal(auth.group, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with single group and correct input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA"
  }
  let inputgroup = "GroupA";
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with single group and incorrect input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA"
  }
  let inputgroup = "GroupB";
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with single group and no input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA"
  }
  let rv = rulesetRouter.validateInputOwnerGroup(auth, undefined);

  assert.equal(true, rv.valid);
  assert.equal(undefined, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with mult group and correct input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA;GroupB"
  }
  let inputgroup = "GroupA";
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with mult group and correct input group provided 2", function(assert){
  let auth = {
    admin: true,
    group: "GroupA;GroupB"
  }
  let inputgroup = "GroupB";
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with mult group and incorrect input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA;GroupB"
  }
  let inputgroup = "GroupC";
  let rv = rulesetRouter.validateInputOwnerGroup(auth, inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with mult group and no input group provided", function(assert){
  let auth = {
    admin: true,
    group: "GroupA;GroupB"
  }
  let rv = rulesetRouter.validateInputOwnerGroup(auth, undefined);

  assert.equal(true, rv.valid);
  assert.equal(undefined, rv.ownergroup);
});
