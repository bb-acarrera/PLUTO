const fs = require("fs");
const program = require("commander");
const path = require("path");
const util = require('util');
const amqp = require('amqplib');

const Util = require('../common/Util');

var PlutoQueue = 'pluto_runs';

let version = "0";
if(fs.existsSync("../../package.json")) {
	version = require("../../../package.json").version;
} else if(fs.existsSync("../package.json")) {
	version = require("../../package.json").version;
}

class QueueWorker {
	constructor(config) {
		this.config = config;
		
		
		this.rootDir = path.resolve(this.config.rootDirectory || ".");
		this.config.tempDir = Util.getRootTempDirectory(this.config, this.rootDir);

		this.config.runMaximumDuration = this.config.runMaximumDuration || 600;
		
        this.shuttingDown = false;
        
        this.queue = PlutoQueue;

        this.currentJob = null;

		
	}

	/*
	 * Start the server.
	 */
	start() {
		amqp.connect(this.config.rabbitMQ).then((conn) => {

            this.amqpConn = conn;

            return conn.createChannel();

        }, (err) => {
            console.log("Error connecting to RabbitMQ: " + err);
            process.exit(1);
        }).then((ch) => {
            ch.assertQueue(this.queue, {durable: true});
            ch.prefetch(1);
        
            console.log('Waiting for jobs');

            ch.consume(this.queue, 
                (msg) => {

                    if(this.shuttingDown) {
                       ch.nack(msg);
                       return; 
                    }

                    this.currentJob = this.handleJob(msg, ch).then(() => {
                        this.currentJob = null;
                        ch.ack(msg);
                        console.log("Ack'd job");
                    });

                    
                }, 
                {noAck: false});

        }, (err) => {
            console.log("Error creating channel: " + err);
            process.exit(1);
        }).catch((e) => {
            console.log("Got exception: " + e);
            process.exit(1);
        })
    }

    handleJob(msg) {

        return new Promise((resolve) => {
            var secs = msg.content.toString().split('.').length - 1;
    
            console.log(" [x] Received %s", msg.content.toString());
            
            setTimeout(
                function() {
                    console.log(" [x] Done");
                    resolve();
        
                }, 
                secs * 1000);
        });

        
    }
    
	shutdown() {

        function wait(secs) {
            return new Promise((resolve) => {
                setTimeout(
                    function() {
                        resolve();
            
                    }, 
                    secs * 1000);
            });
        }

		console.log('Got shutdown request');
        this.shuttingDown = true;
        
        if(!this.currentJob) {
            this.currentJob = Promise.resolve();
        } 

        //need to put a wait in since the ack takes sometime but doesn't indicate when done
        this.currentJob.then(() => { return wait(1); }, ()=>{}).catch(()=>{}).then(()=>{

            console.log('All jobs finished, closing connection to RabbitMQ');

            if(this.amqpConn) {
                return this.amqpConn.close();
            }

            return;
        }).then(() => {}, ()=>{}).catch(()=>{}).then(()=>{
            console.log('RabbitMQ connection closed');
            process.exit(0);
        })

	}

	
}



let scriptName = process.argv[1];
if (__filename == scriptName) {	// Are we running this as the server or unit test? Only do the following if running as a server.

	//override the console messages to be filebeat/ES compliant (JSON)
	["log", "warn", "error", "info"].forEach(function(method) {
		var oldMethod = console[method].bind(console);
		console[method] = function(data,...args) {

			let obj = null;

			if(data !== null && typeof data === 'object') {
				obj = data;

			} else {

				obj = {
					message: util.format(data,...args),
					messageType: method
				}
			}

			obj.time = new Date();
			if(!obj.log) {
				obj.log = "plutoworker";
			}

			oldMethod.apply(
				console,
				[JSON.stringify(obj)]
			);
		};
	});


	program
		.version(version)
		.usage('[options]')
		.description('Validator worker that pulls jobs off a queue')
		.option('-v, --validatorConfig <configFile>', 'The validator configuration file to use.')
		.parse(process.argv);


	if (!program.validatorConfig)
		program.help((text) => {
			return "A validator configuration file must be specified.\n" + text;
		});

	let validatorConfigPath = path.resolve(program.validatorConfig);

	if (!fs.existsSync(validatorConfigPath)) {
		console.log("Failed to find validator configuration file \"" + program.validatorConfig + "\".\n");
		process.exit(1);
	}

	let validatorConfig = require(validatorConfigPath);

	validatorConfig = Util.recursiveSubStringReplace(validatorConfig, Util.replaceStringWithEnv);

	validatorConfig.scriptName = scriptName;

	const server = new QueueWorker(validatorConfig, validatorConfigPath);
	server.start();

	process.on('SIGTERM', (signal) => {
		console.log('Got SIGTERM: ' + signal);
		server.shutdown();
	});

	process.on('SIGINT', (signal) => {
		console.log('Got SIGINT: ' + signal);
		server.shutdown();
	});
}

module.exports = QueueWorker;
