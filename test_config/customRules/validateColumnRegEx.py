from __future__ import print_function
import os.path
import re
import imp
import sys

plutoAPI = os.environ.get('PLUTOAPI')
if not plutoAPI:
	print("PLUTOAPI enviroment variable must be set and point to the directory containing PythonAPI.py.", file=sys.stderr)
	sys.exit(1)

try:
	apiPath = os.path.join(plutoAPI, "PythonAPI.py")
	api = imp.load_source('PythonAPI', apiPath)
except IOError:
	print("Failed to load the PythonAPI from \"" + plutoAPI + "\".", file=sys.stderr)
	sys.exit(1)

class ValidateColumnRegEx(api.PythonCSVRule):
	def __init__(self, config):
		super(ValidateColumnRegEx, self).__init__(config)
	
	def start(self):
		# NOTE: dot syntax doesn't work for dereferencing fields on self.config because the properties are defined using UTF-8 strings. 
		if not "regex" in self.config:
			self.error("No regex specified.")
		elif not "column" in self.config:
			self.error("No column specified in the rule config.")
		else:
			self.prog = re.compile(self.config["regex"], re.UNICODE)
		
		self.columnIndex = self.getColumnIndex(self.config["column"])
		
	
	def processRecord(self, record, isHeaderRow, rowNumber):
		
		if isHeaderRow:
			return record
		
		value = record[self.columnIndex]
		
		if self.prog.match(value) is None:
			self.error(value + " does not match the regular expression", rowNumber)
		
		return record
	
		
		
api.process(ValidateColumnRegEx)
