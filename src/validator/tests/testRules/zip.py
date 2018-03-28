from __future__ import print_function
import os.path
import os
import re
import imp
import sys
import zipfile

try:
    import zlib
    compression = zipfile.ZIP_DEFLATED
except:
    compression = zipfile.ZIP_STORED

import PythonAPI as api

class Zip(api.PythonAPIRule):
	def __init__(self, config):
		super(Zip, self).__init__(config)

	def run(self, inputFile, outputFile, encoding):
		zip_ref = zipfile.ZipFile(outputFile, mode='w')
		zip_ref.write(inputFile,os.path.basename(inputFile),compress_type=compression)
		zip_ref.close()
		
api.process(Zip)
