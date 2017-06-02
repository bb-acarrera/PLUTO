import luigi

class FakeDownloadTask(luigi.Task):
	def output(self):
		'''
		Return a luigi.localTarget() object pointing to the output
		'''
		return luigi.LocalTarget('../../../examples/data/simplemaps-worldcities-basic.csv')
