const AuthUser = require('../../common/authUser');

/*
 * This is a base class for the routers. All routers must implement the methods defined here.
 */

class BaseRouter {
	constructor(config) {
		this.config = config || {};
	}

	getAuth(req) {
		return new AuthUser(
			req.header('AUTH-USER'),
			req.header('AUTH-GROUP'),
			req.header('AUTH-ADMIN')
		);
	}

	/*
	 * Implement the Ember.Router callback used by router.get().
	 */
	get(req, res, next) {
		next(new Error(this.constructor.name + " does not implement the get() method."));
	}

	/*
	 * Implement the Ember.Router callback used by router.patch().
	 */
	patch(req, res, next) {
		next(new Error(this.constructor.name + " does not implement the patch() method."));
	}
}

module.exports = BaseRouter;	// Export this so derived classes can extend it.
