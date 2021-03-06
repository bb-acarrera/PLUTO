from __future__ import print_function
import os.path
import re
import imp
import sys

import PythonAPI as api

class ValidateColumnRegEx(api.PythonCSVRule):
	def __init__(self, config):
		super(ValidateColumnRegEx, self).__init__(config)
	
	#start is called at the beginning of processing after the file is opened, and any property processing should happen here	
	def start(self):
		# NOTE: dot syntax doesn't work for dereferencing fields on self.config because the properties are unicode strings. 
		if not "regex" in self.config:
			self.error("No regex specified.")
		elif not "column" in self.config:
			self.error("No column specified in the rule config.")
		else:
			self.prog = re.compile(self.config["regex"], re.UNICODE)
		
		self.columnIndex = self.getColumnIndex(self.config["column"])
		
		self.onError = self.config["onError"] if "onError" in self.config else 'warning'
		
	#processRecord is called once for each record in the csv
	#returns the validated record, which can be modified, and return None to drop the record 
	#  record is the array of column values
	#  isHeaderRow is a boolean which is True if this row is in the csv header
	#  rowNumber is the current line number of the csv, with 1 being the first row
	def processRecord(self, record, isHeaderRow, rowNumber):
		
		if isHeaderRow:
			return record
		
		value = record[self.columnIndex]
		
		if (isinstance(value, unicode) or isinstance(value, str)) and self.prog.match(value) is None:
			if self.onError == "error":
				self.error(value + " does not match the regular expression", rowNumber)
			elif self.onError == "dropped":
				self.dropped(value + " does not match the regular expression", rowNumber)
				return None
			else:
				self.warning(value + " does not match the regular expression", rowNumber)
		
		return record
	
	#finish is called at the end of processing, but before the file is closed
	def finish(self):
		return	
		
api.process(ValidateColumnRegEx)
