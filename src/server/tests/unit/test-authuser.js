const AuthUser = require('../../../common/authUser');

QUnit.test( "AuthUser: Construct with no inputs", function(assert){
  const authUser = new AuthUser(undefined, undefined, undefined);
  assert.deepEqual(undefined, authUser.user);
  assert.deepEqual([], authUser.groups);
  assert.deepEqual("", authUser.groupsAsString);
  assert.deepEqual(false, authUser.admin);
});

QUnit.test( "AuthUser: Construct with no blank string group", function(assert){
  const authUser = new AuthUser(undefined, "", undefined);
  assert.deepEqual(undefined, authUser.user);
  assert.deepEqual([], authUser.groups);
  assert.deepEqual("", authUser.groupsAsString);
  assert.deepEqual(false, authUser.admin);
});

QUnit.test( "AuthUser: Construct with user, not admin, and single group", function(assert){
  const authUser = new AuthUser('testUser', "groupA", 'what');
  assert.deepEqual('testUser', authUser.user);
  assert.deepEqual(['groupA'], authUser.groups);
  assert.deepEqual('groupA', authUser.groupsAsString);
  assert.deepEqual(false, authUser.admin);
});

QUnit.test( "AuthUser: Construct with user, admin, and single group", function(assert){
  const authUser = new AuthUser('testUser', "groupA", 't');
  assert.deepEqual('testUser', authUser.user);
  assert.deepEqual(['groupA'], authUser.groups);
  assert.deepEqual('groupA', authUser.groupsAsString);
  assert.deepEqual(true, authUser.admin);
});

QUnit.test( "validateInputOwnerGroupEdit: No auth group and input group provided", function(assert){
  const authUser = new AuthUser(undefined, undefined, 'f');
  let inputgroup = 'GroupA';
  let rv = authUser.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(authUser.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: No auth group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, undefined, 'f');
  let rv = auth.validateInputOwnerGroupEdit(undefined);

  assert.equal(true, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: No auth group and blank string input group provided", function(assert){
  let auth = new AuthUser(undefined, undefined, 'f');
  let rv = auth.validateInputOwnerGroupEdit('');

  assert.equal(true, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with single group and correct input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 'f');
  let inputgroup = "GroupA"
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with single group and incorrect input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 'f');
  let inputgroup = "GroupB"
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with blank group and incorrect input group provided", function(assert){
  let auth = new AuthUser(undefined, "", 'f');
  let inputgroup = "GroupB"
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with blank group and correct input group provided", function(assert){
  let auth = new AuthUser(undefined, "", 'f');
  let inputgroup = ""
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with single group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 'f');
  let rv = auth.validateInputOwnerGroupEdit(undefined);

  assert.equal(true, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with mult group and correct input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 'f');
  let inputgroup = "GroupA";
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with mult group and correct input group provided 2", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 'f');
  let inputgroup = "GroupB";
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with mult group and incorrect input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 'f');
  let inputgroup = "GroupC";
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Auth group with mult group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 'f');
  let rv = auth.validateInputOwnerGroupEdit(undefined);

  assert.equal(true, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin No auth group and input group provided", function(assert){
  let auth = new AuthUser(undefined, undefined, 't');
  let inputgroup = "GroupA";
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin No auth group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, undefined, 't');
  let rv = auth.validateInputOwnerGroupEdit(undefined);

  assert.equal(true, rv.valid);
  assert.equal(undefined, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with single group and correct input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 't');
  let inputgroup = "GroupA";
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with single group and incorrect input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 't');
  let inputgroup = "GroupB";
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with single group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 't');
  let rv = auth.validateInputOwnerGroupEdit(undefined);

  assert.equal(true, rv.valid);
  assert.equal(undefined, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with mult group and correct input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 't');
  let inputgroup = "GroupA"
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with mult group and correct input group provided 2", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 't');
  let inputgroup = "GroupB"
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with mult group and incorrect input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 't');
  let inputgroup = "GroupC"
  let rv = auth.validateInputOwnerGroupEdit(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroupEdit: Admin Auth group with mult group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 't');
  let rv = auth.validateInputOwnerGroupEdit(undefined);

  assert.equal(true, rv.valid);
  assert.equal(undefined, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: No auth group and input group provided", function(assert){
  let auth = new AuthUser(undefined, undefined, 'f');
  let inputgroup = "GroupA";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: No auth group and blank input group provided", function(assert){
  let auth = new AuthUser(undefined, undefined, 'f');
  let inputgroup = "";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  console.log(auth);
  console.log(auth.groupsAsString);
  console.log(rv);
  assert.equal(true, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: No auth group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, undefined, 'f');
  let rv = auth.validateInputOwnerGroup(undefined);

  assert.equal(true, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with single group and correct input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 'f');
  let inputgroup = "GroupA";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with single group and blank input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 'f');
  let inputgroup = "";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with single group and incorrect input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 'f');
  let inputgroup = "GroupB";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with blank group and incorrect input group provided", function(assert){
  let auth = new AuthUser(undefined, "", 'f');
  let inputgroup = "GroupB";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with blank group and correct input group provided", function(assert){
  let auth = new AuthUser(undefined, "", 'f');
  let inputgroup = "";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with single group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 'f');
  let rv = auth.validateInputOwnerGroup(undefined);

  assert.equal(false, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with mult group and correct input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 'f');
  let inputgroup = "GroupA"
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with mult group and correct input group provided 2", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 'f');
  let inputgroup = "GroupB"
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with mult group and incorrect input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 'f');
  let inputgroup = "GroupC"
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(false, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Auth group with mult group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 'f');
  let rv = auth.validateInputOwnerGroup(undefined);

  assert.equal(false, rv.valid);
  assert.equal(auth.groupsAsString, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin No auth group and input group provided", function(assert){
  let auth = new AuthUser(undefined, undefined, 't');
  let inputgroup = "GroupA"
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin No auth group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, undefined, 't');
  let rv = auth.validateInputOwnerGroup(undefined);

  assert.equal(true, rv.valid);
  assert.equal(undefined, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with single group and correct input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 't');
  let inputgroup = "GroupA";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with single group and incorrect input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 't');
  let inputgroup = "GroupB";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with single group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA", 't');
  let rv = auth.validateInputOwnerGroup(undefined);

  assert.equal(true, rv.valid);
  assert.equal(undefined, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with mult group and correct input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 't');
  let inputgroup = "GroupA";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with mult group and correct input group provided 2", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 't');
  let inputgroup = "GroupB";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with mult group and incorrect input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 't');
  let inputgroup = "GroupC";
  let rv = auth.validateInputOwnerGroup(inputgroup);

  assert.equal(true, rv.valid);
  assert.equal(inputgroup, rv.ownergroup);
});

QUnit.test( "validateInputOwnerGroup: Admin Auth group with mult group and no input group provided", function(assert){
  let auth = new AuthUser(undefined, "GroupA;GroupB", 't');
  let rv = auth.validateInputOwnerGroup(undefined);

  assert.equal(true, rv.valid);
  assert.equal(undefined, rv.ownergroup);
});
