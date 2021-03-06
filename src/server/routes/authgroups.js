const BaseRouter = require('./baseRouter');

class AuthRouter extends BaseRouter {
    constructor(config) {
        super(config);
        this.config = config || {};
    }

    get(req, res) {
      // Echo the auth group header back
      // Split it by delimiter though
      const authgroups = this.getAuth(req).groups.map((name, id) => { return { type: 'authgroup', id, attributes: { name } } });
      let jsonResp = {
        data: authgroups
      };
      res.json(jsonResp);
    }
}

module.exports = AuthRouter;
