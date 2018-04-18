from __future__ import print_function
import os.path
import os
import re
import imp
import sys
import shutil
import errno
import PythonAPI as api


def copyanything(src, dst):
    try:
        shutil.copytree(src, dst)
    except OSError as exc: # python >2.5
        if exc.errno == errno.ENOTDIR:
            shutil.copy(src, dst)
        else: raise

class CopyCurrent(api.PythonAPIRule):
	def __init__(self, config):
		super(CopyCurrent, self).__init__(config)

	def run(self, inputFile, outputFile, encoding):

	    copyanything(inputFile, outputFile)


		
api.process(CopyCurrent)
