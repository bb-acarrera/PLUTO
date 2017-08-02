const ErrorHandlerAPI = require('./errorHandlerAPI');

/**
 * This API class is used to describe the interface to rule operations. This base class can be used by operators that
 * do noy interact with the data, for example metadata operators.
 */
class BaseOperatorAPI extends ErrorHandlerAPI {

    /**
     * The base constructor. This simply sets <code>this.config</code> to the passed in configuration object. This config object
     * will be the rule's individual configuration (if any) and additionally contain <code>RootDirectory</code> which defaults to
     * the application's root directory if not set, <code>TempDirectory</code> which defaults to the application's temporary
     * directory if not set, <code>OutputEncoding</code> which is set to the rule's Encoding if set or to the ruleset's Encoding
     * if set, and <code>utf8</code> if none are set, and <code>Encoding</code> which is set to the input file's encoding. (Note
     * the distinction between <code>Encoding</code> and <code>OutputEncoding</code>. <code>Encoding</code> is set to the source file's encoding and
     * <code>OutputEncoding</code> is set to the encoding of the file generated by the rule. In general these would be the same
     * but rule's may want to switch one uncommon encoding for another more common one.)
     * @param localConfig {object} the rule's configuration as defined in the ruleset file or a standalone config file.
     */
    constructor(localConfig) {
        super(localConfig);
    }

    /**
     * All rules derived from {@link BaseOperatorAPI}, {@link OperatorAPI}, or {@link MetadataRuleAPI} must implement this method.
     * This method is the heart of the rule doing whatever is required.
     * @returns {Error} if the rule cannot perform it's actions at all, otherwise the return value is specific to the base
     * class of the rule. (MetadataRuleAPI rules should return nothing. OperatorAPI methods should call a method, defined
     * in OperatorAPI, to return a filename, stream, or object. The {@link OperatorAPI} documentation describes these in more
     * detail.
     */
    run() {
        return new Error("run() not implemented.");
    }

    /**
     * This method takes input from the validator and calls the rule's <code>run()</code> method.
     * @param data input from the validator. This data should come in one of three objects. <code>\{ file : filename \}</code>
     * if the input is a filename, <code>\{ data : object \}</code> if the input is a JavaScript object of some unspecified
     * type (though usually a string), and <code>\{ stream : stream \}</code> if the input is a readable stream.
     * @returns {Promise} a promise that returns the results of the rules <code>run()</code> method. This will have
     * the same structure as the <code>data</code> parameter.
     * @private
     */
    _run(data) {
        // Called from validator.
        this._data = data;
        return new Promise((resolve, reject) => {
            let runResult = this.run();
            if (runResult instanceof Promise)
                runResult.then((result) => resolve(result), (error) => reject(error));
            else if (runResult instanceof Error)
                reject(runResult);
            else
                resolve(runResult);
        });
    }

}

module.exports = BaseOperatorAPI;	// Export this so derived classes can extend it.

