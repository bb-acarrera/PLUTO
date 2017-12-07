const fs = require('fs-extra');
const path = require("path");

const AWS = require('aws-sdk');
var http = require('http');
http.globalAgent.maxSockets = 250;

var https = require('https');
https.globalAgent.maxSockets = 250;

class Exporter {
	constructor(config) {
		this.config = config;
	}

	exportFile(sourceFileName, runId, errorLog) {

		return new Promise((resolve, reject) => {

			if(!this.config.file) {
				reject('No target file name.');
				return;
			}

			if(sourceFileName) {

				const s3 = new AWS.S3({
					accessKeyId: this.config.accessId,
					secretAccessKey: this.config.accessKey,
					endpoint: this.config.endpoint,
					sslEnabled: this.config.sslEnabled || false,
					s3ForcePathStyle: this.config.forcePathStyle
				});

				let file = fs.createReadStream(sourceFileName);

				if(!file) {
					reject('Error opening file for export: ' + sourceFileName);
				}

				let params = {
					Bucket: this.config.bucket,
					Key: this.config.file,
					Body: file
				};

				s3.upload(params, (err) => {
					if(err) {
						reject(err);
						return;
					}
					resolve(this.config.file);
				});

			} else {
				resolve(null);
			}
		});
	}

	static get Type() {
		return "exporter";
	}

	static get ConfigProperties() {
		return [
			{
				name: 'file',
				label: 'Source file path',
				type: 'string',
				tooltip: 'The path to a file in the bucket'
			},
			{
				name: 'bucket',
				label: 'Bucket name',
				type: 'string',
				tooltip: 'The bucket name'
			},
			{
				name: 'endpoint',
				label: 'base URL endpoint (e.g. s3.amazonaws.com)',
				type: 'string',
				tooltip: 'The URL (without protocol), including port if not standard'
			},
			{
				name: 'sslEnabled',
				label: 'Use secure transfer (SSL/TLS)',
				type: 'boolean',
				tooltip: 'If checked, all communications with the storage will go through encrypted SSL/TLS channel'
			},
			{
				name: 'forcePathStyle',
				label: 'Force Path Style (S3 compatible systems)',
				type: 'boolean',
				tooltip: 'If checked, forcePathStyle is set to true, used by some S3 compatible systems'
			},
			{
				name: 'accessId',
				label: 'Access Key ID',
				type: 'string',
				tooltip: ''
			},
			{
				name: 'accessKey',
				label: 'Secret Access Key',
				type: 'string',
				tooltip: ''
			}
		];
	}

};

module.exports = Exporter;
