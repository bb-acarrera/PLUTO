from __future__ import print_function
import os.path
import re
import imp
api = imp.load_source('PythonAPI', 'api/PythonAPI.py')

class ValidateFilename(api.PythonAPIRule):
	def __init__(self, config):
		super(ValidateFilename, self).__init__(config)
	
	def run(self, inputFile, outputFile, encoding):
		# NOTE: dot syntax doesn't work for dereferencing fields on self.config because the properties are defined using UTF-8 strings. 
		if not "regex" in self.config:
			self.error("No regex specified.")
		elif not "importConfig" in self.config:
			self.error("No importConfig specified in the rule config.")
		elif not "file" in self.config["importConfig"]:
			self.error("No file specified in the rule config.importConfig.")
		else:
			filename = os.path.basename(self.config["importConfig"]["file"])
			prog = re.compile(self.config["regex"], re.UNICODE)
			if not prog.match(filename):
				self.error(filename + " does not match the regular expression " + self.config["regex"])
		
		# Copy the file.	
		api.PythonAPIRule.run(self, inputFile, outputFile, encoding)
		
api.process(ValidateFilename)
