from __future__ import print_function
import os.path
import os
import re
import imp
import sys
import zipfile
import tempfile
import shutil

import PythonAPI as api

class Unzip(api.PythonAPIRule):
	def __init__(self, config):
		super(Unzip, self).__init__(config)

	def run(self, inputFile, outputFile, encoding):
		destRoot = os.path.dirname(inputFile)

		destDir = tempfile.mkdtemp(dir=destRoot)

		zip_ref = zipfile.ZipFile(inputFile, 'r')
		zip_ref.extractall(destDir)
		zip_ref.close()

		files = []
		for (dirpath, dirnames, filenames) in os.walk(destDir):
			files.extend(filenames)
			break

		if files:
			shutil.copy(os.path.join(destDir, files[0]), outputFile)

		shutil.rmtree(destDir)

api.process(Unzip)
