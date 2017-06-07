const BaseRouter = require('./baseRouter');

class ValidationRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	get(req, res) {
		// The user has done a refresh of other operation that's caused the Ember routers to be skipped.
		var queryStr = "?";
		for (var key in req.query) {
			if (queryStr.length > 1)
				queryStr += "&";
			queryStr += key + "=" + encodeURIComponent(req.query[key]);
		}
		if (queryStr.length > 1)
			res.redirect("/" + queryStr);
		else
			res.redirect("/");
	}
}

module.exports = ValidationRouter;
