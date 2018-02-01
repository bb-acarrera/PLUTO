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