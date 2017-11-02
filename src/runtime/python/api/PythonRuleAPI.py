from datetime import datetime
import csv
import json
import socket
import sys

class PythonAPIRule(object):
    def __init__(self, config):
        self.config = config

    # This is called when the application has something to log. Derived classes can override this method
    # to send the log to a file, a database, etc. This is the only method derived classes need to implement. The
    # other methods, error(), warning(), and info() call this method. This implementation simply writes the log to the console.
    # @param level the level of the log. One of LEVEL_ERROR, LEVEL_WARNING, and LEVEL_INFO. If null or undefined
    # then LEVEL_INFO is assumed.
    # @param problemFileName the name of the file causing the log to be generated.
    # @param ruleID the ID of the rule raising the log report or undefined if raised by some file other than a rule.
    # @param problemDescription a description of the problem encountered.
    def log(self, level, problemFileName, ruleID, problemDescription):
        level = "UNDEFINED" if level is None else level
        problemFileName = "" if problemFileName is None else problemFileName
        problemDescription = "" if problemDescription is None else problemDescription
        dateStr = datetime.now().isoformat(' ') # FIXME: match the node time output format.

        # For now just write the report to stderr with one JSON object per line.
        #report = { type : level, when : dateStr, problemFile : problemFileName, ruleID : ruleID, description : problemDescription }
        print('{ "type" : "{0}", "when" : "{1}", "problemFile" : "{2}", "ruleID" : "{3}", "description" : "{4}" }\n' 
              .format(level, dateStr, problemFileName, ruleID, problemDescription), file=sys.stderr)

        # this.reports.push(report);
        # updateSummaries(this, level, ruleID, problemDescription);

    # Add an error to the log. If this is called and {@link RuleAPI#shouldRulesetFailOnError} returns
    # <code>true</code> then at the completion of this rule the running of the ruleset will terminate.
    # @param problemDescription {string} a description of the problem encountered.
    def error(self, problemDescription):
        self.log("Error", type(self).__name__, self.config.id, problemDescription)    # FIXME: Support shouldAbort?

    # Add a warning to the log.
    # @param problemDescription {string} a description of the problem encountered.
    def warning(self, problemDescription):
        self.log("Warning", type(self).__name__, self.config.id, problemDescription);

    # Add an information report to the log.
    # @param problemDescription {string} a description of the problem encountered.
    def info(self, problemDescription):
        self.log("Info", type(self).__name__, self.config.id, problemDescription);
        
    def run(self, inputFile, outputFile, encoding):
        with open(inputFile, 'r', encoding=encoding) as src, open(outputFile, 'w', encoding=encoding) as dst:
            csvreader = csv.reader(src, delimiter=',')  # FIXME: Get CSV properties from the config object. See https://docs.python.org/3/library/csv.html#csv-fmt-params
            csvwriter = csv.writer(dst, delimiter=',')
            for row in csvreader:
                updatedRecord = self.processRecord(row)
                if updatedRecord is not None:
                    csvwriter.writerow(updatedRecord)  

    def processRecord(self, record):
        return record

def processData(pythonRuleClass, argv):
    if pythonRuleClass is None:
        print("No python class specified.", file=sys.stderr)
        return
    
    if argv is None:
        print("No arguments specified.", file=sys.stderr)
        return
    
    if len(argv) < 5:
        print("Insufficient arguments specified.", file=sys.stderr)
        return
    
    inputName = argv[1]
    outputName = argv[2]
    encoding = argv[3]
    socketAddr = argv[4]
     
    # Create a UDS socket to receive the chunks info.
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

    chunks = ''
    try:
        sock.connect(socketAddr)
        while True:
            chunk = sock.recv(1024)
            if chunk == b'':
                break
            chunks += chunk.decode('utf-8')
    
    except socket.error as err:
        print(err, file=sys.stderr)
        sys.exit(1)
    
    config = json.loads(chunks)

    instance = pythonRuleClass(config)
    instance.run(inputName, outputName, encoding)
    
processData(PythonAPIRule, sys.argv)
