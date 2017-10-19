import luigi
import os

class FakeDownloadTask(luigi.Task):

    targetFile = luigi.Parameter()

	def output(self):
		'''
		Return a luigi.localTarget() object pointing to the output
		'''
		return luigi.LocalTarget(os.path.abspath(targetFile))
