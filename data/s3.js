const fs = require('fs-extra');
const path = require("path");

const AWS = require('aws-sdk');
const program = require("commander");

const version = '0.1';

program
	.version(version)
	.usage('[options]')
	.description('Manage data in the Scality test storage system.')
	.option('-c, --config <configFile>', 'The configuration json file to use. Expects format:\n' +
		'   {\n' +
		'       "endpoint": "hostname:port", -- default is "localhost:8000"\n' +
		'       "sslEnabled": true or false -- default is false,\n' +
		'       "forcePathStyle": true or false -- default is true,\n' +
		'       "accessKey": "your key",\n' +
		'       "accessSecretKey": "your secret key"\n' +
		'   }\n' +
		'   Defaults to PLUTO dev Scality S3 configuration if not provided')
	.option('-b, --bucket <string>', 'The bucket to use')
	.option('-l, --local <filename>', 'The path of the file on the local system.')
	.option('-r, --remote <filename>', 'The path of the on the remote system.')
	.option('-u, --upload', 'Upload the local file to the remote file in the bucket. Mutually exclusive with (d,c).')
	.option('-d, --download', 'Download the remote file in the bucket to the local file. Mutually exclusive with (u,c).')
	.option('-n, --createNewBucket', 'Create the bucket. Mutually exclusive with (u,d).')
	.option('-s, --list', 'List all the files in the remote folder, root of bucket if remote not set.')
	.parse(process.argv);

let defaultConfig = {
	endpoint: 'localhost:8000',
	sslEnabled: false,
	forcePathStyle: true,
	accessKey: 'accessKey1',
	accessSecretKey: 'verySecretKey1'
};

let config;
if (!program.config) {
	console.log('using default PLUTO dev config');

	config = defaultConfig;

} else {
	if (!fs.existsSync(program.config)) {
		console.log("Failed to find configuration file \"" + program.config + "\".\n");
		process.exit(1);
	}

	try {
		config = require(path.resolve(__dirname, program.config));
	}
	catch (e) {
		console.log("The configuration file cannot be loaded.\n" + e);
		process.exit(1);
	}
}


let resp;

if(program.createNewBucket) {
	resp = createBukcet(program.bucket, config);
} else if(program.upload) {
	resp = uploadFile(program.bucket, program.remote, program.local, config);
} else if(program.download) {
	resp = downloadFile(program.bucket, program.remote, program.local, config);
} else if(program.list) {
	resp = listFolder(program.bucket, program.remote, config);
} else {
	console.log('Nothing to do.')
}

if(!resp) {
	process.exit(1);
}

function createBukcet(bucket, config) {

	if(!bucket) {
		console.log('No bucket');
		return false;
	}

	const s3 = new AWS.S3({
		accessKeyId: config.accessKey,
		secretAccessKey: config.accessSecretKey,
		endpoint: config.endpoint,
		sslEnabled: config.sslEnabled || false,
		s3ForcePathStyle: config.forcePathStyle
	});


	var params = {
		Bucket: bucket
	};
	s3.createBucket(params, function(err, data) {
		if (err) {
			console.log(err, err.stack); // an error occurred
			process.exit(1);
		}

		console.log(data);           // successful response

	});

	return true;
}

function downloadFile(bucket, remote, local, config) {

	if(!local) {
		console.log('No local file name');
		return false;
	}

	if(!remote) {
		console.log('No remote file name');
		return false;
	}

	if(!bucket) {
		console.log('No bucket');
		return false;
	}


	const s3 = new AWS.S3({
		accessKeyId: config.accessKey,
		secretAccessKey: config.accessSecretKey,
		endpoint: config.endpoint,
		sslEnabled: config.sslEnabled || false,
		s3ForcePathStyle: config.forcePathStyle
	});

	let params = {
		Bucket: bucket,
		Key: remote
	};

	var file = fs.createWriteStream(local);

	s3.getObject(params).createReadStream()
		.on('end', () => {
			console.log(`Downloaded ${remote} in ${bucket} to ${local}`)
		})
		.on('error', (error) => {
			console.log(error);
			process.exit(1);
		})
		.pipe(file);

	return true;
}

function uploadFile(bucket, remote, local, config) {

	if(!local) {
		console.log('No local file name');
		return false;
	}

	if(!remote) {
		console.log('No remote file name');
		return false;
	}

	if(!bucket) {
		console.log('No bucket');
		return false;
	}


	const s3 = new AWS.S3({
		accessKeyId: config.accessKey,
		secretAccessKey: config.accessSecretKey,
		endpoint: config.endpoint,
		sslEnabled: config.sslEnabled || false,
		s3ForcePathStyle: config.forcePathStyle
	});

	let file = fs.createReadStream(local);

	if(!file) {
		console.log('Error opening file for upload: ' + local);
		return false;
	}

	let params = {
		Bucket: bucket,
		Key: remote,
		Body: file
	};

	s3.upload(params, (err) => {
		if(err) {
			console.log(err, err.stack); // an error occurred
			process.exit(1);
		}
		console.log(`Uploaded ${local} to ${remote} in ${bucket}`)

	});

	return true;

}

function listFolder(bucket, remote, config) {

	if(!bucket) {
		console.log('No bucket');
		return false;
	}

	const s3 = new AWS.S3({
		accessKeyId: config.accessKey,
		secretAccessKey: config.accessSecretKey,
		endpoint: config.endpoint,
		sslEnabled: config.sslEnabled || false,
		s3ForcePathStyle: config.forcePathStyle
	});


	ls(s3, bucket, remote, function(err, data) {
		if (err) {
			console.log(err, err.stack); // an error occurred
			process.exit(1);
		}

		data.files.forEach((file) => {
			if(file) {
				console.log(file);
			}

		});

		data.folders.forEach((folder) => {
			if(folder) {
				console.log(folder);
			}

		});           // successful response

	});

	return true;
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
		Prefix: prefix,
		//StartAfter: prefix // removes the folder name from the file listing
	}, s3ListCallback);
}


function trimStart(string, character) {

	if(!string || !string.length) {
		return string;
	}

	var startIndex = 0;

	while (string[startIndex] === character && startIndex < string.length) {
		startIndex++;
	}

	return string.substr(startIndex);
}

function  trimEnd(string, character) {

	if(!string || !string.length) {
		return string;
	}

	var endIndex = string.length - 1;

	while (string[endIndex] === character && endIndex > 0) {
		endIndex--;
	}

	return string.substr(0, endIndex+1);
}