from __future__ import print_function
import os.path
import os
import re
import imp
import sys
import shutil
import PythonAPI as api

class CopyCurrent(api.PythonAPIRule):
	def __init__(self, config):
		super(CopyCurrent, self).__init__(config)

	def run(self, inputFile, outputFile, encoding):

	    shutil.copy(inputFile, outputFile)


		
api.process(CopyCurrent)
