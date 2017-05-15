# server.js
## 1. Overview
`server.js` is a web server which provides a client front end to the validator. It allows users to review
the results from command line validator runs and allows users to create and edit rulesets and rules.

<span style="color:red">**_TODO_:** Flesh out...</span>
## 2. Command Line Arguments
### 2.1. -s, --serverConfig \<configFile> _(Required)_
The server configuration file to use.

The given `configFile` should either be an absolute path on the local file system or a path relative to the directory
containing the `server.js` script.

See the [Configuration](#Configuration) section for the contents of the configuration file.

### 2.2. -v, --validatorConfig \<configFile> _(Required)_
The validator configuration file to use. By changing the configuration file the behavior of the
validator can easily be changed. For example one configuration could allow the validator to retrieve data files from
the local filesystem while a different configuration file could allow it to retrieve data from a database.

The given `configFile` should either be an absolute path on the local file system or a path relative to the directory
containing the `server.js` script.

See the [Configuration](#Configuration) section for the contents of the configuration file.

## 3. Configuration
The server configuration file is used by the server to define resources.

### 3.1. RootDirectory
The directory used to locate other directories, configuration files, etc. If this is not set then the directory
containing `server.js` is used.

### 3.2 Port
The TCP port the web server will listen on. This defaults to 8000 if not set.