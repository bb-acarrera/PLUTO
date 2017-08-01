/*
 * This is a base class for the routers. All routers must implement the methods defined here.
 */

 class BaseRouter {
 	constructor(config) {
 		this.config = config || {};
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
