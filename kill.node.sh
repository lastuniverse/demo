#!/bin/sh

ps -ef | grep 'nodejs' | grep -v grep | awk '{print $2}' | xargs -r kill -9