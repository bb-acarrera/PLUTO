class AuthUser {
  constructor(user, groupsString, adminString) {
    this._user = user;
    this._groups = groupsString ? groupsString.split(';') : [];
    this._admin = (adminString && adminString.length > 0 && adminString.toLowerCase().startsWith('t')) == true;
  }

  // Getters
  get user() {
    return this._user;
  }
  
  get groups() {
    return this._groups;
  }

  get groupsAsString() {
    return this._groups.join(';');
  }

  get admin() {
    return this._admin;
  }

  validateInputOwnerGroupEdit(inputgroup) {
    // Always allow an admin to overwrite the group
    if(this.admin) {
      return {
        valid: true,
        ownergroup: inputgroup
      }
    }

    // If no input group then let it through with auth.group
    if(!inputgroup) {
      return {
        valid: true,
        ownergroup: this.groupsAsString
      }
    }

    // In an update we only need to validate the
    // input group is in the user's groups since
    //  the actual update will use the previous group
    if(this.groups.includes(inputgroup)) {
      return {
        valid: true,
        ownergroup: inputgroup
      };
    }
    else {
      return {
        valid: false,
        ownergroup: this.groupsAsString
      }
    }
  }

  validateInputOwnerGroup(inputgroup) {
    // Always allow an admin to overwrite the group
    if(this.admin) {
      return {
        valid: true,
        ownergroup: inputgroup
      };
    }

    if(!inputgroup || inputgroup === "") {
      if(this.groups.length > 0) {
          return {
            valid: false,
            ownergroup: this.groupsAsString
          };
      }
      else {
        return {
          valid: true,
          ownergroup: this.groupsAsString
        };
      }
    }

    if(this.groups.includes(inputgroup)) {
      return {
        valid: true,
        ownergroup: inputgroup
      };
    }
    else {
      return {
        valid: false,
        ownergroup: this.groupsAsString
      };
    }
  }


} // class AuthUser

module.exports = AuthUser;
