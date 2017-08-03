#!/bin/sh -c

ROOT=`dirname $0`/../..
ROOT=`cd $ROOT; echo $PWD`
SRC=$ROOT/src
BIN=$ROOT/node_modules/.bin
DOCS=$ROOT/docs/generatedDocs
API=$SRC/api
VAL=$SRC/validator

if ! [ -e "$DOCS" ]; then
	mkdir -p "$DOCS"
# else
# Don't want to do this as it will delete the .md files. Instead 'docs' should be cleaned
# up manually.
# 	(cd "$DOCS" && rm -r *)
fi

"$BIN/jsdoc" "$API" "$VAL" -r -d "$DOCS"
if [ $? -eq 0 ]; then
	echo "Done."
else
	echo "Build docs failed."
	exit 1
fi

