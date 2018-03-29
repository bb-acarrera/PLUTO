from __future__ import print_function
import os.path
import re
import imp
import sys

import PythonAPI as api

class ValidateColumnRegEx(api.PythonCSVDataframeRule):
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
		
		self.columnName = self.config["column"]
		
		self.onError = self.config["onError"] if "onError" in self.config else 'warning'

	#processChunk is called once for each dataframe chunk, and should be overridden
	#returns the validated dataframe chunk, which can be modified
	#  dataframe is the dataframe
	def processChunk(self, dataframe):
	
		dataframe.apply(lambda row: self.checkRegEx(row), axis=1)
	
		return dataframe
	
	def checkRegEx(self, row):
		value = row[self.columnName]
		
		if (isinstance(value, unicode) or isinstance(value, str)) and self.prog.match(value) is None:
			if self.onError == "error":
				self.error(value + " does not match the regular expression", row)
			elif self.onError == "dropped":
				self.dropped(value + " does not match the regular expression", row)
				return None
			else:
				self.warning(value + " does not match the regular expression", row)
	
	#finish is called at the end of processing, but before the file is closed
	def finish(self):
		return	
		
api.process(ValidateColumnRegEx)
