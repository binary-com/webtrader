#!/bin/bash

release_prod="$(git log -1 --pretty=%B | awk '/[release_prod]]/ { print $1 } ')"
release_beta="$(git log -1 --pretty=%B | awk '/[release_beta]]/ { print $1 } ')"
if [ -n $release ]; then
    git config --global user.email "arnab@binary.com"
    git config --global user.name "Arnab Karmakar"
    if [ -n $release_beta ]; then
        mkdir beta
        mv dist/compressed/* beta
        mv beta dist/compressed
        grunt gh-pages:gh-pages-beta
    fi
    if [ -n $release_beta ]; then
      	grunt gh-pages:gh-pages-prod
    fi
fi
