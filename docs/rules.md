# Rules

Rules are at the heart of the validator. They are used to validate and perform simple modifications to
files. Validation can include operations such as checking the number of columns in a [CSV](https://en.wikipedia.org/wiki/Comma-separated_values)
(comma-separated values) file, checking a column
against a regular expression, or checking that longitude and latitude values are correct, etc. Modification can
include operations such as modifying values in a column, changing header titles, etc.

Rules write to a common log file any warnings or errors they encounter while operating on a file. At the completion
of a ruleset run the final version of the input file and the error log are sent to the validator's [exporter].

Rules come in several types:
- [Python Rules][python], rules written in Python and run as a separate process from the validator executable.
- [CSV Rules][csv], rules written in JavaScript that operate on a CSV file one line at a time.
- [General Rules][basic], any rules that cannot be written as a Python Rule or a CSV Rule can be written as a general rule.
- [Metadata Rules][metadata], rules that do not operate on the data but on the data about the data.

Common Rule [configuration][config] attributes common to all rules (config settings, logging errors, SharedData, ???)

Location? Where should rules be placed?

[Existing Rules][existing]

[exporter]: exporter.md
[python]: pythonRules.md
[csv]: csvRules.md
[basic]: basicRules.md
[existing]: existingRules.md
[metadata]: metadataRules.md
[config]: ruleConfig.md