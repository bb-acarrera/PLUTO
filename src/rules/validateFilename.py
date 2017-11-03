import json
import socket
import sys
from shutil import copyfile

inputFile = sys.argv[1]
outputFile = sys.argv[2]
encoding = sys.argv[3]
socketAddr = sys.argv[4]

# Create a UDS socket to receive the chunks info.
sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

chunks = ''
try:
	sock.connect(socketAddr)
	while True:
		chunk = sock.recv(1024)
		if chunk == '':
			break
		chunks += chunk

except socket.error, msg:
	print >>sys.stderr, msg
	sys.exit(1)

config = json.loads(chunks)

copyfile(sys.argv[1], sys.argv[2])

