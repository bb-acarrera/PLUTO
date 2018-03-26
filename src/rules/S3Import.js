const fs = require('fs-extra');
const path = require("path");

const AWS = require('aws-sdk');

class Importer {
	constructor(config) {
		this.config = config;
	}

	importFile(targetFileName) {

        return new Promise((resolve, reject) => {

            if(!targetFileName) {
                reject('No target file name');
            }

            if(!this.config.file) {
                reject('No source file name');
            }


            const s3 = new AWS.S3({
                accessKeyId: this.config.accessId,
                secretAccessKey: this.config.accessKey,
                endpoint: this.config.endpoint,
                sslEnabled: this.config.sslEnabled || false,
                s3ForcePathStyle: this.config.forcePathStyle
            });

            let params = {
                Bucket: this.config.bucket,
                Key: this.config.file
            };

            var file = fs.createWriteStream(targetFileName);

            s3.getObject(params).createReadStream()
                .on('end', () => {
                    resolve(this.config.file);
                })
                .on('error', (error) => {
                    return reject(error); })
                .pipe(file);

        });
    }

    getFileList(path) {
        return new Promise((resolve, reject) => {
            const s3 = new AWS.S3({
                accessKeyId: this.config.accessId,
                secretAccessKey: this.config.accessKey,
                endpoint: this.config.endpoint,
                sslEnabled: this.config.sslEnabled || false,
                s3ForcePathStyle: this.config.forcePathStyle
            });

            ls(s3, this.config.bucket, path, function(err, data) {
                if (err) {
                    reject(err);
                    return;
                }

                let result = {
                    files: [],
                    folders: []
                };

                data.files.forEach((file) => {
                    if(file) {
                        result.files.push(file);
                    }

                });

                data.folders.forEach((folder) => {
                    if(folder) {
                        result.files.push(folder);
                    }

                });

            });

        });
    }

    static get Type() {
        return "importer";
    }

    static get ConfigProperties() {
        return [
            {
                name: 'file',
                label: 'File path',
                type: 'string',
                tooltip: 'The path to a file in the bucket'
            },
            {
                name: 'bucket',
                label: 'Bucket name',
                type: 'string',
                tooltip: 'The bucket name',
                hidden: true
            },
            {
                name: 'endpoint',
                label: 'Base URL endpoint (e.g. s3.amazonaws.com)',
                type: 'string',
                tooltip: 'The URL (without protocol), including port if not standard',
                hidden: true
            },
            {
                name: 'sslEnabled',
                label: 'Use secure transfer (SSL/TLS)',
                type: 'boolean',
                tooltip: 'If checked, all communications with the storage will go through encrypted SSL/TLS channel',
                hidden: true
            },
            {
                name: 'forcePathStyle',
                label: 'Force Path Style (S3 compatible systems)',
                type: 'boolean',
                tooltip: 'If checked, forcePathStyle is set to true, used by some S3 compatible systems',
                hidden: true
            },
            {
                name: 'accessId',
                label: 'Access Key ID',
                type: 'string',
                tooltip: '',
                private: true,
                hidden: true
            },
            {
                name: 'accessKey',
                label: 'Secret Access Key',
                type: 'string',
                tooltip: '',
                private: true,
                hidden: true
            }
        ];
    }

}

function ls(s3, bucket, path, callback) {

    if(!path) {
        path = '';
    }

    var prefix = trimStart(trimEnd(path, '/') + '/', '/');
    var result = {files: [], folders: []};

    function s3ListCallback(error, data) {
        if (error) return callback(error);

        result.files = result.files.concat(data.Contents.map( x => x.Key !== prefix ? x.Key : null ));
        result.folders = result.folders.concat(data.CommonPrefixes.map(x => x.Prefix));

        if (data.IsTruncated) {
            s3.listObjects({
                Bucket: bucket,
                MaxKeys: 2147483647, // Maximum allowed by S3 API
                Delimiter: '/',
                Prefix: prefix,
                ContinuationToken: data.NextContinuationToken
            }, s3ListCallback)
        } else {
            callback(null, result);
        }
    }

    s3.listObjects({
        Bucket: bucket,
        MaxKeys: 2147483647, // Maximum allowed by S3 API
        Delimiter: '/',
        Prefix: prefix //,
        //StartAfter: prefix // removes the folder name from the file listing
    }, s3ListCallback);
}

module.exports = Importer;
