import luigi
import json
import os

from pydoc import locate
from subprocess import (run, STDOUT)

class PlutoTask(luigi.Task):
	configFile = luigi.Parameter()
	previousTaskModule = luigi.Parameter()
	previousTaskClass = luigi.Parameter()

	def requires(self):
		'''
		Use reflection to allow this task to be dynamically dependent on a previous
		task, such as a download task.
		'''
		dependentClass = locate(self.previousTaskModule + '.' + self.previousTaskClass)
		return dependentClass()

	def getOutputName(self):
		'''
		TODO: Might want to do something smarter with naming the output file.
		'''
		return self.input().path + ".out"

	def output(self):
		'''
		Return a luigi.localTarget() object pointing to the output
		'''
		return luigi.LocalTarget(self.getOutputName())

	def run(self):
		'''
		Load the JSON config file and use values set in it to run the NodeJS validator.
		'''
		f = open(self.configFile, "r", encoding="utf-8")	# Assume utf-8 for the config file. Could make this a class parameter if it is an issue.
		config = json.load(f)

		nodeExe = os.path.abspath(config['NodeExecutable'])
		cwd = os.path.abspath(config['WorkingDirectory'])
		validatorExe = os.path.normpath(os.path.join(cwd, config['ValidatorExecutable']))
		configFile = os.path.normpath(os.path.join(cwd, config['ValidatorConfig']))
		rulesetFile = os.path.normpath(os.path.join(cwd, config['RuleSet']))

		print("**** Node: " + nodeExe)
		print("**** CWD: " + cwd)
		print("**** Validator: " + validatorExe)
		print("**** ConfigFile: " + configFile)
		print("**** RulesetFile: " + rulesetFile)
		print("**** Command: " + nodeExe + " " + validatorExe + " -c " + configFile + " -r " + rulesetFile + " -i " + self.input().path + " -o " + self.getOutputName())

		result = run([nodeExe, validatorExe, \
				"-c", configFile, \
				"-r", rulesetFile, \
				"-i", self.input().path, \
				"-o", self.getOutputName()], \
				stderr=STDOUT, cwd=cwd)


if __name__ == "__main__":
    luigi.run()
