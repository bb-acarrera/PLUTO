from __future__ import print_function

import imp
api = imp.load_source('PythonAPI', 'api/PythonAPI.py')

class ValidateFilename(api.PythonAPIRule):
	def __init__(self, config):
		super(ValidateFilename, self).__init__(config)
		
api.process(ValidateFilename)
