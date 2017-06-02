import luigi
import json

from pydoc import locate
from subprocess import (run, STDOUT)

class PlutoTask(luigi.Task):
	configFile = luigi.Parameter()
	previousTaskModule = luigi.Parameter()
	previousTaskClass = luigi.Parameter()

	def requires(self):
		'''
		TODO: How is the dependency on the download task done? Does it require this script to be
		modified or can it be done dynamically?
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
		TODO: From the name of the input generate a name for the output and then
		exec() the validator given values from within the PlutoTask.json config. file.
		'''
		f = open(self.configFile, "r", encoding="utf-8")	# Assume utf-8 for the config file. Could make this a class parameter if it is an issue.
		config = json.load(f)

		result = run([config['NodeExecutable'], config['ValidatorExecutable'], "-c", config['ValidatorConfig'], "-i", self.input().path, "-o", self.getOutputName()], stderr=STDOUT)

		print("**** " + config['NodeExecutable'] + " " + config['ValidatorExecutable'] + " -c "+ config['ValidatorConfig'] + " -i " + self.input().path + " -o " + self.getOutputName())


if __name__ == "__main__":
    luigi.run()
