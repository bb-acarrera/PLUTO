const fs = require('fs');
const path = require("path");
const child_process = require('child_process');
var http = require('http');

class LocalCopyExport {
	constructor(config) {
		this.config = config;
	}

	exportFile(fileName, runId, errorLog) {

        return new Promise((resolve, reject) => {

            if(!this.config.file) {
                reject('No source file name');
            }

            if(fileName) {
                const targetFileName = path.resolve(this.config.file);

                // Copy using a spawned process.

                child_process.exec('python /opt/PLUTO/config/copy.py ' + fileName + ' ' + targetFileName, (error, stdout, stderr) => {

                    if (error) {
                        console.log(`stdout: ${stdout}`);
                        console.log(`stderr: ${stderr}`);
                        reject("Failed to copy file.");
                        return;
                    }
                    //call out to external REST API
                    var body = JSON.stringify({
                        foo: "bar"
                    });

                    try {
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

                        request.on('error', function(err) {
                            console.log('REST error: ' + err);
                        });

                    } catch (e) {
                        console.log('Error calling REST API: ' + e);
                    }

                    //resolve this promise
                    resolve();
                });
			}


        });
    }

};

module.exports = LocalCopyExport;
