#!/bin/bash

release="$(git log -1 --pretty=%B | awk '/[release]]/ { print $1 } ')"
if [ -n $release ]; then 
	grunt gh-pages
fi
