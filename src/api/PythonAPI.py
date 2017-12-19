from __future__ import print_function
from datetime import datetime
from shutil import copyfile

import argparse
import csv
import json
import socket
import sys


class PythonAPIRule(object):
	def __init__(self, config):
		self.config = config

	# This is called when the application has something to log. Derived classes can override this method
	# to send the log to a file, a database, etc. This is the only method derived classes need to implement. The
	# other methods, error(), warning(), and info() call this method. This implementation simply writes the log to the console.
	# @param level the level of the log. One of LEVEL_ERROR, LEVEL_WARNING, and LEVEL_INFO. If null or undefined
	# then LEVEL_INFO is assumed.
	# @param problemFileName the name of the file causing the log to be generated.
	# @param ruleID the ID of the rule raising the log report or undefined if raised by some file other than a rule.
	# @param problemDescription a description of the problem encountered.
	def log(self, level, problemFileName, ruleID, problemDescription):
		level = "UNDEFINED" if level is None else level
		problemFileName = "" if problemFileName is None else problemFileName
		problemDescription = "" if problemDescription is None else problemDescription
#		 dateStr = datetime.now().isoformat(' ') # FIXME: match the node time output format.

		# For now just write the report to stderr with one JSON object per line.
		# report = { type : level, when : dateStr, problemFile : problemFileName, ruleID : ruleID, description : problemDescription }
		response = {
			"type": level,
#			 "when" : dateStr,
			"problemFile": problemFileName,
			"ruleID": ruleID,
			"description": problemDescription
		}
		jsonStr = json.dumps(response)
		jsonStr = jsonStr.replace("\n", " ")
		print(jsonStr, file=sys.stderr)

		# this.reports.push(report);
		# updateSummaries(this, level, ruleID, problemDescription);

	# Add an error to the log. If this is called and {@link RuleAPI#shouldRulesetFailOnError} returns
	# <code>true</code> then at the completion of this rule the running of the ruleset will terminate.
	# @param problemDescription {string} a description of the problem encountered.
	def error(self, problemDescription):
		# FIXME: Support shouldAbort?
		self.log("Error", self.__class__.__name__,
				 self.config["id"], problemDescription)

	# Add a warning to the log.
	# @param problemDescription {string} a description of the problem encountered.
	def warning(self, problemDescription):
		self.log("Warning", self.__class__.__name__,
				 self.config["id"], problemDescription)

	# Add an information report to the log.
	# @param problemDescription {string} a description of the problem encountered.
	def info(self, problemDescription):
		self.log("Info", self.__class__.__name__,
				 self.config["id"], problemDescription)

	def run(self, inputFile, outputFile, encoding):
		copyfile(inputFile, outputFile)


class PythonCSVRule(PythonAPIRule):
	def __init__(self, config):
		super(ValidateFilename, self).__init__(config)

	def run(self, inputFile, outputFile, encoding):
		delimiter = self.config.delimiter if "delimiter" in self.config else ","
		escapechar = self.config.escape if "escape" in self.config else '"'
		quotechar = self.config.quote if "quote" in self.config else '"'
		# FIXME: Python 2 doesn't support encoding here.
		with open(inputFile, 'r') as src, open(outputFile, 'w') as dst:
			csvreader = csv.reader(
				src, delimiter=delimiter, escapechar=escapechar, quotechar=quotechar)
			csvwriter = csv.writer(
				dst, delimiter=delimiter, escapechar=escapechar, quotechar=quotechar)
			for row in csvreader:
				updatedRecord = self.processRecord(row)
				if updatedRecord is not None:
					csvwriter.writerow(updatedRecord)

	def processRecord(self, record):
		return record


def loadConfigFromFile(filename):
	try:
		f = open(filename, 'r')
		return json.loads(f.read())
	except Exception as err:
		print("Failed to read from " + filename, file=sys.stderr)
		print(err, file=sys.stderr)
		sys.exit(1)		# Inelegant but effective.

	return None  # Should never get here.


def loadConfigFromSocket(socketAddr):
	# Create a UDS socket to receive the chunks info.
	sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

	chunks = ''
	try:
		sock.connect(socketAddr)
		while True:
			chunk = sock.recv(1024)
			if chunk == b'':
				break
			chunks += chunk.decode('utf-8')

	except socket.error as err:
		print("Failed to read from " + socketAddr, file=sys.stderr)
		print(err, file=sys.stderr)
		sys.exit(1)		# Inelegant but effective.

	return json.loads(chunks)


def process(pythonRuleClass):
	parser = argparse.ArgumentParser(description='Run a Python rule.')
	# TODO: Remove 'required' when implementing issue #232.
	parser.add_argument('-i', dest='inputName',
						help="The name of the input file to read.", required='True')
	# TODO: Remove 'required' when implementing issue #232.
	parser.add_argument('-o', dest='outputName',
						help="The name of the output file to write.", required='True')
	parser.add_argument('-e', dest='encoding',
						help="The file encoding of the input file. The output file will be written with the same encoding.", default='utf8')
	group = parser.add_mutually_exclusive_group(required=True)
	group.add_argument('-s', dest='socketAddr',
						help="The name of the socket file to read the configuration information from.")
	group.add_argument('-c', dest='configName',
						help="The name of a file to read the configuration information from.")

	try:
		args = parser.parse_args()
	except Exception as e:
		print(str(e))

	if pythonRuleClass is None:
		print("No python class specified.", file=sys.stderr)
		return
	
	if not args:
		print("No arguments specified.", file=sys.stderr)
		return
	
	inputName = args.inputName
	outputName = args.outputName
	encoding = args.encoding
	socketAddr = args.socketAddr
	configName = args.configName
	
	if socketAddr:
		config = loadConfigFromSocket(socketAddr)
	else:
		config = loadConfigFromFile(configName)

	instance = pythonRuleClass(config)
	instance.run(inputName, outputName, encoding)
