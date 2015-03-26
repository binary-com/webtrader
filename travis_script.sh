#!/bin/bash

release="$(git log -1 --pretty=%B | awk '/[release]]/ { print $1 } ')"
if [ -n $release ]; then 
    git config --global user.email "arnab@binary.com"
    git config --global user.name "Arnab Karmakar"
  	grunt gh-pages
fi
