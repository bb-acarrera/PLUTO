# validator.js
## 1. Overview
The command line tool is run on a schedule by a system scheduler such as `cron`. Through plug-ins it finds changed
files and runs them against a set of rules (a "ruleset") checking for invalid data and correcting it where possible.

<span style="color:red">**_TODO_:** Flesh out...</span>
## 2. Command Line Arguments
### 2.1. -c, --config \<configFile> _(Required)_
The validator configuration file to use. By changing the configuration file the behavior of the
validator can easily be changed. For example one configuration could allow the validator to retrieve data files from
the local filesystem while a different configuration file could allow it to retrieve data from a database.

The given `configFile` should either be an absolute path on the local file system or a path relative to the directory
containing the `validator.js` script.

See the [Configuration](#Configuration) section for the contents of the configuration file.

### 2.2. -i, --input \<filename> _(Required)_
The name of the input file to validate. The validator will use it's DataAPI plug-in to retrieve the file.

### 2.3. -o, --output \<filename> _(Optional)_
The name of the output file (the file after all the rules have been run). This is passed to the DataAPI plug-in to save
upon completion.

### 2.4. -e, --encoding \[encoding] _(Optional)_
The encoding used by the input file. The default is `utf-8`. This valid is passed to the rules without verifying that
it is a valid encoding. It is the responsibility for rules to decide if an encoding is valid and whether or not they
can handle it.

### 2.5. -r, --ruleset \<rulesetFile> _(Optional)_
The ruleset file to use to process the input file. If this is not set then the ruleset specified in the validator
configuration file is used. If both are specified then the ruleset specified on the command line takes precedence over
the one specified in the configuration file. This will be resolved against the RulesetDirectory specified in the
validator configuration file.

## 3. Configuration
The validator configuration file is used by the validator to find resources such as plug-ins and rulesets. By using
different configuration files the behavior of the validator can easily be changed. For example changing the plug-ins
referenced in the configuration file can change how the validator retrieves data files.

The configuration file is a JSON file with the following properties. Only the `Plugins` property is required. The
other properties have default values which are included in the descriptions below.

### 3.1. RootDirectory
The directory used to locate other directories, configuration files, etc. If this is not set then the directory
containing `validator.js` is used.

### 3.2. RulesetDirectory
The directory used to locate the rulesets. Defaults to the `RootDirectory` if not set. If this is specified as a
relative path it is resolved against the `RootDirectory`.

### 3.3. RulesDirectory
The directory used to locate the rules used by the rulesets. This will default to the `RulesetDirectory` if not set.
If this is a relative path it is resolved against the `RulesetDirectory` _not_ the `RootDirectory`.

### 3.4. TempDirectory
The directory to use for temporary files created while running a ruleset. The validator creates a unique directory
below this directory and deletes it when it is done. If this is not set then a directory called _`tmp`_ is created
below the `RootDirectory`.

### 3.5. PluginsDirectory
The directory that contains JavaScript plug-ins used by the validator. At present the only plug-in is a `DataAPI`
plug-in used to load and save the data files.

### 3.6. Plugins
The plug-ins used by the validator. This is a map mapping the type of plug-in to specific settings. At present
the only one is a `DataAPI` plug-in identified with `DataAPI` in `Plugins`. Plug-ins settings have two properties,
- **FileName**  
the filename of the plug-in (minus the “.js” suffix) relative to the `PluginsDirectory`.
- **Config**  
a set of configuration properties specific to the plug-in.

### 3.7. RuleSet
An optional reference to a specific ruleset file. This is used if no ruleset is specified on
the application command line. If this is set and one is specified on the command line, the command line ruleset
takes precedence. Generally it is best to specify rulesets on the command line rather than in validator configuration
file. This allows one configuration to be run with many different rulesets.

