#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

process_id=`ps ax | grep "$DIR/server.js" | grep "node" | awk '{print $1}'` 
if [ $? -eq "0" ] && [ -n "$process_id" ]; then
	echo "Killing previous server..."
        forever stop "$DIR/server.js"
	sleep 5;
fi
echo "Starting new server..."

#node $DIR/server.js &>$DIR/output.txt &

forever start -o $DIR/output.txt -e $DIR/output.txt --minUptime 2000 --spinSleepTime 500 --append --sourceDir $DIR/ server.js

sleep 2

echo "Done."
