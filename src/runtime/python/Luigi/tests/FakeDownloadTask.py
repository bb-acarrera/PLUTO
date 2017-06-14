import luigi
import os

class FakeDownloadTask(luigi.Task):
	def output(self):
		'''
		Return a luigi.localTarget() object pointing to the output
		'''
		return luigi.LocalTarget(os.path.abspath('../../../../examples/data/simplemaps-worldcities-basic.csv'))
