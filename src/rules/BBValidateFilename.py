from __future__ import print_function
import imp
import os.path
import re
import sys
import zipfile

api = None
try:
	api = imp.load_source('PythonAPI', 'api/PythonAPI.py')
except IOError:
	print("Failed to load the PythonAPI.", file=sys.stderr)
	sys.exit(1)


class BBValidateFilename(api.PythonAPIRule):
	MAX_FILENAME_WITHOUT_EXTENSION_LENGTH = 35
	allowed_extensions = ['.csv', '.geojson', '.shp', '.shx', '.dbf', '.sbn', '.sbx', '.fbn',
						  '.fbx', '.ain', '.aih', '.atx', '.ixs', '.mxs', '.prj', '.xml', '.cpg', '.qix', '.shp.xml']

	def __init__(self, config):
		super(BBValidateFilename, self).__init__(config)

	def getFileExtension(self, filename):
		_, file_extension = os.path.splitext(filename)
		return file_extension

	def validateFilename(self, filename):
		"""Validate the filename.  Returns a tuple with a boolean and a string"""

		# Verify the file has an extension
		extension = self.getFileExtension(filename)
		if(None is extension):
			msg = 'Filename [{}] is missing extension'.format(filename)
			return (False, msg)

		# Verify the extension is one of the pre-approved extensions
		if(extension not in BBValidateFilename.allowed_extensions):
			msg = ('Filename [{}] extension is not supported. Only {} extensions are currently supported'
				   .format(filename, str(BBValidateFilename.allowed_extensions)))
			return (False, msg)

		# Verify the length of the filename (minus extension)
		filename_without_extension = filename[:len(extension) * -1]
		if(BBValidateFilename.MAX_FILENAME_WITHOUT_EXTENSION_LENGTH < len(filename_without_extension)):
			msg = ('Filename [{}] is longer than max allowed filename length (without extension) of {} characters'
				   .format(filename, str(BBValidateFilename.MAX_FILENAME_WITHOUT_EXTENSION_LENGTH)))
			return (False, msg)

		# Verify the filename only has alpha numeric characters
		# We cannot use isalnum() because it will not validate '-' and '_' chars
		if(None == re.match('^[A-Za-z][A-Za-z0-9_]+$', filename_without_extension)):
			msg = ('Filename [{}] has non-alphanumeric characters'
				   .format(filename))
			return (False, msg)

		return (True, None)

	def validateZipFileContents(self, zipFile):
		try:
			with zipfile.ZipFile(zipFile, 'r') as zipper:
				names = zipper.namelist()
				for name in names:
					result, msg = self.validateFilename(name)
					if not result:
						self.error(msg)
		except zipfile.BadZipfile:
			self.error("\"" + zipFile + "\" is not a valid zip file.")
		except zipfile.LargeZipFile:
			self.error("\"" + zipFile + "\" is too large. Enable Zip64.")
		except Exception as e:
			self.error(
				"Received unexpected exception processing \"" + zipFile + "\".")

	def run(self, inputFile, outputFile, encoding):
		# NOTE: dot syntax doesn't work for dereferencing fields on self.config because the properties are defined using UTF-8 strings.
		if not "importConfig" in self.config:
			self.error("No importConfig specified in the rule config.")
		elif not "file" in self.config["importConfig"]:
			self.error("No file specified in the rule config.importConfig.")
		else:
			self.validateZipFileContents(inputFile)

		# Copy the file.
		api.PythonAPIRule.run(self, inputFile, outputFile, encoding)


api.process(BBValidateFilename)
