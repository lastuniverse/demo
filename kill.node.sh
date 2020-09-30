#!/bin/sh

ps -ef | grep '.js' | grep -v grep | awk '{print $2}' | xargs -r kill -9