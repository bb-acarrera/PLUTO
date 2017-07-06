const fs = require('fs');
const path = require("path");
const spawn = require('child_process').spawn;
var http = require('http')

const LocalCopyExport = {

    exportFile: function(fileName, config, runId, errorLog) {

        return new Promise((resolve, reject) => {

            if(!config.file) {
                reject('No source file name');
            }

            if(fileName) {
                const targetFileName = path.resolve(config.file);

                // Copy using a spawned process.
				const proc = spawn('cp', [fileName, targetFileName]);
                proc.on('close', () => {
					console.log(errorLog);

                    //call out to external REST API
                    var body = JSON.stringify({
                        foo: "bar"
                    });

                    var request = new http.ClientRequest({
                        hostname: "localhost",
                        port: 3000,
                        path: "/get_stuff",
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Content-Length": Buffer.byteLength(body)
                        }
                    });

                    request.end(body);

                    request.on('response', function (response) {

                        //log the response to stdout for now

                        console.log('STATUS: ' + response.statusCode);
                        console.log('HEADERS: ' + JSON.stringify(response.headers));
                        response.setEncoding('utf8');
                        response.on('data', function (chunk) {
                            console.log('BODY: ' + chunk);
                        });
                    });

                    //resolve this promise
				    resolve();
				});
                proc.on('error', () => {
				    reject("Failed to copy file.");
				});
			}


        });
    }

};

module.exports = LocalCopyExport;
