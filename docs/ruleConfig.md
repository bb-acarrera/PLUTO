# Common Rule Configuration Properties

Each rule has a constructor which is called by the validator with a `config` object. This config object
is initialized with properties from the ruleset file. After this it is updated with a set of common
properties. Generally these properties allow the rule to locate commonly shared resources.

## 1. rootDirectory

The `rootDirectory` property is a string which is an absolute path to the root of the validator install.
All resources exist in directories below this one.

## 2. tempDirectory

The `tempDirectory` is a directory that exists for the duration of the current ruleset run. It is created
at the start of the run and it and its contents are deleted at the completion of the run. Rules can place
any temporary data here. Rules should not modify anything that might already exist in this directory as
the validator places its own temporary files here.

## 3. encoding

This is the data encoding on the input data to the rule. By default this is '`utf8`' but may be something
else if the a previous rule has changed it or a different encoding was specified when starting the
validator.

If a rule changes the encoding of the data for some reason it should set this property
to the new value. This will then be shared with the following rule.

## 4. sharedData

This is data shared between rules. See the documentation on [metadata rules](metadataRules.md) for detailed
information.
