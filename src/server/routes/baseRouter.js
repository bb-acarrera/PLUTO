/*
 * This is a base class for the routers. All routers must implement the methods defined here.
 */

 class BaseRouter {
 	constructor(config) {
 		this.config = config || {};
	}

	/*
	 * Implement the Ember.Router callback used by router.get() et al.
	 */
	route(req, res) {
 		throw(this.constructor.name + " does not implement the route() method.");
	}
 }

module.exports = BaseRouter;	// Export this so derived classes can extend it.
