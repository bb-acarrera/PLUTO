/**
 * Created by cgerber on 2017-07-27.
 */

const fs = require('fs-extra');
const path = require("path");
const program = require("commander");
const rimraf = require('rimraf');
const stream = require('stream');
const Validator = require('../validator/validator');

const Util = require("../common/Util");
const Data = require("../common/dataDb");
const DataFS = require("../common/dataFs");

const ErrorLogger = require("./ErrorLogger");
const RuleSet = require("./RuleSet");

const version = '0.1'; //require("../../package.json").version;


program
    .version(version)
    .usage('[options]')
    .description('Validate an input file.')
    .option('-c, --config <configFile>', 'The configuration file to use.')
    .option('-e, --encoding [encoding]', 'The encoding to use to load the input file. [utf8]', 'utf8')
    .option('-i, --input <filename>', 'The name of the input file.')
    .option('-o, --output <filename>', 'The name of the output file.')
    .option('-r, --ruleset <ruleset>', 'The ruleset to use.')
    .option('-v, --rulesetoverride <rulesetOverrideFile>', 'The ruleset overrides file to use.')
    .option('-l, --local', 'Run the validator locally (no database, run rulesets from disk, write outputs to results folder)')
    .option('-n, --inputname <string>', 'Filename to use in run record for reporting')
    .parse(process.argv);

if (!program.config)
    program.help((text) => {
        return "A configuration file must be specified.\n" + text;
    });
 if (!fs.existsSync(program.config)) {
     console.log("Failed to find configuration file \"" + program.config + "\".\n");
     process.exit(1);
 }

let config;
try {
    config = require(path.resolve(__dirname, program.config));
}
catch (e) {
    console.log("The configuration file cannot be loaded.\n" + e);
    process.exit(1);
}

config.ruleset = program.ruleset || config.ruleset;
if (!config.ruleset)
    program.help((text) => {

    return "A ruleset must be specified either as an argument or a property in the config. file.\n" + text;
    });

if(program.rulesetoverride) {
    config.rulesetOverride = program.rulesetoverride;
}

let dataAccess = Data;

if(program.local) {
    dataAccess = DataFS;
}

    // If the input or output are not set they'll be grabbed from the ruleset file later.
let inputFile = program.input;	//  ? path.resolve(program.input) : undefined;
let outputFile = program.output;
let inputEncoding = program.encoding;
let inputDisplayName = program.inputname;

//config.scriptName = scriptName;
const validator = new Validator(config, dataAccess);


process.on('uncaughtException', (err) => {
        // Caught an uncaught exception so something went extraordinarily wrong.
        // Log the error and then give up. Do not attempt to write the output file because we have no idea
        // how many rules have been run on it or what state it is in.
    if (err) {
        if (typeof err == 'string') {
            validator.error(err);	// Record the uncaught exception.
            console.log("Exiting with uncaught exception: " + err);
        }
        else if (err.message) {
            validator.error(err.message);
            console.log("Exiting with uncaught exception: " + err.message);
        }
        else {
            validator.error(JSON.stringify(err));	// No idea what this is but try to represent it as best we can.
            console.log("Exiting with uncaught exception: " + JSON.stringify(err));
        }
    }
    else {
        validator.error(`Unspecified error. Last rule attempted was ${validator.ruleName} in ruleset ${validator.rulesetName}.`)
        console.log("Exiting with unspecified error.");
    }

    validator.finishRun()	// Write the log.
        .then(() => {
            process.exit(1);	// Quit.
        });

}).on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);

    validator.finishRun()	// Write the log.
        .then(() => {
            process.exit(1);	// Quit.
        });

});

try {
    validator.runRuleset(inputFile, outputFile, inputEncoding, inputDisplayName);
}
catch (e) {
    console.log("Failed.\n\t" + e);
    validator.error("Failed: " + e);
    validator.finishRun();	// Write the log.
    process.exit(1);	// Quit.
}
