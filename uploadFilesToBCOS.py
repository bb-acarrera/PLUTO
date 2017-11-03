import os
import sys
import requests
import ConfigParser
from os.path import abspath, exists, isfile, isdir, join
from bcosAccessor import BCOSAccessor



YES_ANSWERS = {'y', 'Y', 'yes', 'YES'}
NO_ANSWERS = {'n', 'N', 'no', 'NO'}
VALID_EXTENSIONS = {'.csv', '.txt', '.zip', '.kml', '.xlsx', '.xls', '.geojson', '.json'}
MAX_FILE_SIZE = 60 * 1024 * 1024 # 60 MB
MAX_FILENAME_LENGTH = 30

def createConfig():
	while True:
		stage = raw_input('What stage would you like to upload to? [dev/qa/prod]: ')
		if stage not in {'dev', 'qa', 'prod'}:
			print('Sorry, please type in "dev", "qa", or "prod".')
		else:
			break

	print('You are currently in [%s] ' % os.getcwd())
	while True:
		config_path = raw_input('What is the path of the config (including name)?: ')
		if not exists(config_path):
			print('Sorry, we could not find [%s], please try again.' % abspath(config_path))
		else:
			try:
				config = initFromConfig(config_path, stage)
			except:
				print('Failed to load configuration.')
				sys.exit(1)
			else:
				break

	return config

def initFromConfig(config, stage):
    '''Read and initialize from config'''
    parser = ConfigParser.RawConfigParser()
    parser.read(config)
    try:
        return {
                   'BCOS_BUCKET': parser.get(stage, 'BCOS_BUCKET'),
                   'BCOS_ACCOUNT': parser.get(stage, 'BCOS_ACCOUNT'),
                   'BCOS_SECRET_KEY': parser.get(stage, 'BCOS_SECRET_KEY')
               }
    except Exception, error:
        print('Could not find configuration file, using environment variables instead, error=%s' % str(error))
        return {
                   'BCOS_BUCKET': os.environ['BCOS_BUCKET'],
                   'BCOS_ACCOUNT': os.environ['BCOS_ACCOUNT'],
                   'BCOS_SECRET_KEY': os.environ['BCOS_SECRET_KEY']
               }

def promptFileUpload():
	# Prompt for directory of files
	dentries = None
	files = None
	while True:
		path_to_files = abspath(raw_input('What is the path to the directory of the data you wish to upload?: '))
		if not exists(path_to_files):
			print('Sorry, [%s] does not exist. Try again.' % path_to_files)
		elif not isdir(path_to_files):
			print('Sorry, [%s] is not a directory. Try again.' % path_to_files)
		else:
			dentries = os.listdir(path_to_files)
			files = [f for f in dentries if isfile(join(path_to_files, f))]
			if len(files) == 0:
				print('There are no files in [%s].' %  path_to_files)
				continue
			break

	# Prompt which files we need
	print('\nThe files currently in [%s] are:' % abspath(path_to_files))
	for index, f in enumerate(files):
		print('%s. %s') % (index + 1, f)

	print

	need_valid_upload = True
	while need_valid_upload:
		files2upload = raw_input('Please list the numbers (separated by commas) of the files you would like to upload.\n')
		upload_indices = map(int, files2upload.replace(' ', '').split(','))

		for index in upload_indices:
			if index > len(files) or index <= 0:
				print('Option [%d] is not valid. Please type in numbers in the range [1,%d].' %(index, len(files)))
				need_valid_upload = True
				break
			# If code gets to this point, we've verified all indices
			need_valid_upload = False

	
	print
	upload_paths = [join(path_to_files, files[index - 1]) for index in upload_indices]
	return upload_paths

def __formatFileInfo(file_info):
	return 'Last Modified: %s\tFile Size: %s\n' % (file_info.get('Last-Modified'), file_info.get('Content-Length'))

def __uploadFile(file, bcos_accessor):
	bcos_filename = file.split(os.sep)[-1]

	# Check if overwriting file
	upload_flag = True
	try:
		pre_file_info = bcos_accessor.getBCOSFileInfo(bcos_filename)
	except requests.exceptions.HTTPError:
		print('Creating [%s]...' % bcos_filename)
	else:
		answer = raw_input('[%s] already exists on BCOS. Do you want to overwrite it? [y/n] ' % bcos_filename)
		print
		if answer in YES_ANSWERS:
			print('Overwriting [%s]...' % bcos_filename)
			print('---Before Stats---')
			print(__formatFileInfo(pre_file_info))
		else:
			print('Skipping [%s]...\n' % bcos_filename)
			upload_flag = False

	# Upload file
	if upload_flag:
		try:
			bcos_accessor.putFileToBCOS(bcos_filename, file)
			post_file_info = bcos_accessor.getBCOSFileInfo(bcos_filename)
		except:
			print('Failed to add [%s] to bucket [%s].' % (bcos_filename, bcos_accessor.bucket))
			sys.exit(1)
		else:
			print('Added [%s] to bucket [%s].' % (bcos_filename, bcos_accessor.bucket))
			print('---Current Stats---')
			print(__formatFileInfo(post_file_info))

def __checkValidFile(file):
	short_name = file.split(os.sep)[-1]
	root, ext = os.path.splitext(short_name)
	if ext == '.shp':
		print('Please upload the entire zip folder instead.\n')
		return False
	if not ext in VALID_EXTENSIONS:
		print('[%s] does not have a valid file type for MAPS.\n' % file)
		return False
	elif len(short_name) > 30:
		print('The name [%s] is too long: %d\t[Max Filename Length is: %d]\n' % (root, len(root), MAX_FILENAME_LENGTH))
		return False
	elif os.path.getsize(file) > MAX_FILE_SIZE:
		print('[%s] is too large: %d\t[Max File Size is: %d]\n' % (short_name, os.path.getsize(file), MAX_FILE_SIZE))
		return False
	return True

def uploadFiles(files, config):
	uploader = BCOSAccessor(config)
	for f in files:
		if(__checkValidFile(f)):
			__uploadFile(f, uploader)

def main():

	config = createConfig()
	config['HTTP_PROXY'] = 'bproxy.tdmz1.bloomberg.com:80'
	config['HTTPS_PROXY'] = 'bproxy.tdmz1.bloomberg.com:80'

	while True:
		upload_paths = promptFileUpload()
		uploadFiles(upload_paths, config)

		# Prompt user if they want to upload more files
		continue_upload = raw_input('Would you like to upload more files? [y/n] ')
		print
		if continue_upload in YES_ANSWERS:
			continue
		else:
			break


if __name__ == '__main__':
	main()
