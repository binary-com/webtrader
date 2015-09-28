#!/bin/bash

git config --global user.email "arnab@binary.com"
git config --global user.name "Arnab Karmakar"
release_prod="$(git log -1 --pretty=%B | awk '/[release_prod]]/ { print $1 } ')"
release_beta="$(git log -1 --pretty=%B | awk '/[release_beta]]/ { print $1 } ')"
if [ ! -z "$release_beta" -a "$release_beta" != " " ]; then
    mkdir beta
    mv dist/compressed/* beta
    mv beta dist/compressed
    grunt gh-pages:gh-pages-beta-uncompressed
fi
if [ ! -z "$release_prod" -a "$release_prod" != " " ]; then
    grunt gh-pages:gh-pages-prod-uncompressed
fi
