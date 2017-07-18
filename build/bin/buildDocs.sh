#!/bin/sh -c

ROOT=`dirname $0`/../..
ROOT=`cd $ROOT; echo $PWD`
SRC=$ROOT/src
BIN=$ROOT/node_modules/.bin
DOCS=$ROOT/public/docs
API=$SRC/runtime/api
VAL=$SRC/validator

if ! [ -e "$DOCS" ]; then
	mkdir "$DOCS"
# else
# Don't want to do this as it will delete the .md files. Instead 'docs' should be cleaned
# up manually.
# 	(cd "$DOCS" && rm -r *)
fi

"$BIN/jsdoc" "$API" "$VAL" -r -d "$DOCS"

