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
	print >> sys.stdout, "Python connecting to " + socketAddr
	sock.connect(socketAddr)
	print >> sys.stdout, "Python connected to " + socketAddr
	while True:
		chunk = sock.recv(1024)
		print >> sys.stdout, "Python received " + chunk
		if chunk == '':
			break
		chunks.append(chunk)

	print >> sys.stderr, chunks
except socket.error, msg:
	print >>sys.stderr, msg
	sys.exit(1)

config = json.loads(chunks)

copyfile(sys.argv[1], sys.argv[2])
