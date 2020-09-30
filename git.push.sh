#!/bin/sh

git add .

git commit -m "autopush: $1"

git push -u origin master
