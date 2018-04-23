from __future__ import print_function
import os.path
import os
import re
import imp
import sys
import shutil
import time
import PythonAPI as api

class NoOpPosttask(api.PythonAPIRule):
	def __init__(self, config):
		super(NoOpPosttask, self).__init__(config)

	def run(self, inputFile, outputFile, encoding):
	
		self.warning("start")
		time.sleep(2)
		self.warning("finished")



		
api.process(NoOpPosttask)
