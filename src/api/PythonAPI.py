from __future__ import print_function
from datetime import datetime
from shutil import copyfile

import argparse
import csv
import json
import socket
import sys
import os

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
	def log(self, level, problemFileName, ruleID, problemDescription, dataItemId):
		level = "UNDEFINED" if level is None else level
		problemFileName = "" if problemFileName is None else problemFileName
		problemDescription = "" if problemDescription is None else problemDescription
#		 dateStr = datetime.now().isoformat(' ') # FIXME: match the node time output format.
		dataItemId = "" if dataItemId is None else str(dataItemId)

		# For now just write the report to stderr with one JSON object per line.
		# report = { type : level, when : dateStr, problemFile : problemFileName, ruleID : ruleID, description : problemDescription, dateItemId : dataItemIdentifier }
		response = {
			"type": level,
#			 "when" : dateStr,
			"problemFile": problemFileName,
			"ruleID": ruleID,
			"description": problemDescription,
			"dataItemId": dataItemId
		}
		jsonStr = json.dumps(response)
		jsonStr = jsonStr.replace("\n", " ")
		print(jsonStr, file=sys.stderr)

		# this.reports.push(report);
		# updateSummaries(this, level, ruleID, problemDescription);

	# Add an error to the log. If this is called and {@link RuleAPI#shouldRulesetFailOnError} returns
	# <code>true</code> then at the completion of this rule the running of the ruleset will terminate.
	# @param problemDescription {string} a description of the problem encountered.
	def error(self, problemDescription, dataItemId=None):
		# FIXME: Support shouldAbort?
		self.log("Error", self.__class__.__name__,
				 self.config["id"], problemDescription, dataItemId)

	# Add a warning to the log.
	# @param problemDescription {string} a description of the problem encountered.
	def warning(self, problemDescription, dataItemId=None):
		self.log("Warning", self.__class__.__name__,
				 self.config["id"], problemDescription, dataItemId)

	# Add an information report to the log.
	# @param problemDescription {string} a description of the problem encountered.
	def info(self, problemDescription, dataItemId=None):
		self.log("Info", self.__class__.__name__,
				 self.config["id"], problemDescription, dataItemId)
				 
	# Add an dropped item report to the log.
	# @param problemDescription {string} a description of the problem encountered.
	def dropped(self, problemDescription, dataItemId=None):
		self.log("Dropped", self.__class__.__name__,
				 self.config["id"], problemDescription, dataItemId)

	def run(self, inputFile, outputFile, encoding):
		copyfile(inputFile, outputFile)


class PythonCSVRule(PythonAPIRule):
	def __init__(self, config):
		super(PythonCSVRule, self).__init__(config)

	def run(self, inputFile, outputFile, encoding):
	
		if not "parserConfig" in self.config:
			self.error("No parser configuration specified for PythonCSVRule")
			return			
	
		if not "parserState" in self.config:
			self.error("No parser state supplied to PythonCSVRule")
			return
	
		delimiter = self.config["parserConfig"]["delimiter"].encode('ascii', 'replace') if "delimiter" in self.config["parserConfig"] else ","
		escapechar = self.config["parserConfig"]["escape"].encode('ascii', 'replace') if "escape" in self.config["parserConfig"] else '"'
		quotechar = self.config["parserConfig"]["quote"].encode('ascii', 'replace') if "quote" in self.config["parserConfig"] else '"'
		numHeaderRows = int(self.config["parserConfig"]["numHeaderRows"]) if "numHeaderRows" in self.config["parserConfig"] else 1
		
		self.columnNames = self.config["parserState"]["columnNames"] if "columnNames" in self.config["parserState"] else []
		self.rowIdColumnIndex = self.config["parserState"]["rowIdColumnIndex"] if "rowIdColumnIndex" in self.config["parserState"] else None
		
		doublequote = False
		if escapechar == quotechar:
			doublequote = True
			escapechar = None

		self.currentRow = None		
				
		# FIXME: Python 2 doesn't support encoding here.
		with open(inputFile, 'rb') as src, open(outputFile, 'wb') as dst:
		
			csvreader = csv.reader(
				src, delimiter=delimiter, quotechar=quotechar, escapechar=escapechar, doublequote=doublequote)
				
			csvwriter = csv.writer(
				dst, delimiter=delimiter, escapechar=escapechar, quotechar=quotechar, doublequote=doublequote, lineterminator="\n")
				
			rowHeaderOffset = numHeaderRows + 1;
			self.start()
			
			for row in csvreader:
				isHeaderRow = csvreader.line_num < rowHeaderOffset
				self.currentRow = row
				updatedRecord = self.processRecord(row, isHeaderRow, csvreader.line_num)
				if updatedRecord is not None:
					csvwriter.writerow(updatedRecord)
							
			self.currentRow = None
			
			#remove the extra newline the writer adds
			dst.seek(-1, os.SEEK_END) # <---- 1 : len('\n')
			dst.truncate()           
			
			self.finish()
	
	# override of base log class to get the correct line number
	def log(self, level, problemFileName, ruleID, problemDescription, dataItemId):
		
		rowNumber = dataItemId
		
		if hasattr(self, "rowIdColumnIndex") and hasattr(self, "currentRow"):
			if self.rowIdColumnIndex is not None and self.currentRow is not None:
				if len(self.currentRow) > self.rowIdColumnIndex:
					rowNumber = self.currentRow[self.rowIdColumnIndex]
					problemDescription = problemDescription + " : Row " + str(rowNumber)
			
		super(PythonCSVRule, self).log(level, problemFileName, ruleID, problemDescription, rowNumber)
	
					
	def getColumnIndex(self, columnName):
		return self.columnNames.index(columnName)
	
	#processRecord is called once for each record in the csv, and should be overridden
	#returns the validated record, which can be modified, and return None to drop the record 
	#  record is the array of column values
	#  isHeaderRow is a boolean which is True if this row is in the csv header
	#  rowNumber is the current line number of the csv, with 1 being the first row	
	def processRecord(self, record, isHeaderRow, rowNumber):
		return record
	
	#start is called at the beginning of processing after the file is opened, and any property processing should happen here	
	def start(self):
		return
	
	#finish is called at the end of processing, but before the file is closed
	def finish(self):
		return
	


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
