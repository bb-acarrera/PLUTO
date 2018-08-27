const BaseRouter = require('./baseRouter');

class AuthRouter extends BaseRouter {
    constructor(config) {
        super(config);
        this.config = config || {};
    }

    get(req, res) {
      // Echo the auth group header back
      // Split it by delimiter though
      const authgroups = [];
      const auth = this.getAuth(req);
      if(auth['group']) {
        const groups = auth['group'].split(';');
        for( let ii = 0; ii < groups.length; ii++ ) {
          authgroups.push( { type: "authgroup", id: ii, attributes: { group: groups[ii] } } );
        }
      }
      let jsonResp = {
        data: authgroups
      };
      res.json(jsonResp);
    }
}

module.exports = AuthRouter;
