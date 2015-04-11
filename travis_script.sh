#!/bin/bash

release_prod="$(git log -1 --pretty=%B | awk '/[release_prod]]/ { print $1 } ')"
release_beta="$(git log -1 --pretty=%B | awk '/[release_beta]]/ { print $1 } ')"
if [ ! -z "$release_beta" -a "$release_beta" != " " ]; then
    mkdir beta
    mv dist/compressed/* beta
    mv beta dist/compressed
    grunt gh-pages:gh-pages-beta
fi
if [ ! -z "$release_prod" -a "$release_prod" != " " ]; then
    grunt gh-pages:gh-pages-prod
fi
