const BaseRouter = require('./baseRouter');

class AuthRouter extends BaseRouter {
    constructor(config) {
        super(config);
        this.config = config || {};
    }

    get(req, res) {
      // Echo the auth group header back
      // Split it by delimiter though
      const groupString = this.getAuth(req)['group'] || '';
      const authgroups = groupString.split(';').map((group, id) => { return { type: 'authgroup', id, attributes: { group } } }); 
      let jsonResp = {
        data: authgroups
      };
      res.json(jsonResp);
    }
}

module.exports = AuthRouter;
