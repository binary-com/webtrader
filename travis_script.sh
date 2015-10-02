#!/bin/bash

git config --global user.email "arnab@binary.com"
git config --global user.name "Arnab Karmakar"
echo $TRAVIS_BRANCH
echo $TRAVIS_PULL_REQUEST
if [ $TRAVIS_PULL_REQUEST ]; then
    mkdir beta
    mv dist/compressed/* beta
    mv beta dist/compressed
    grunt gh-pages:travis-uncompressed
fi
if [[ $TRAVIS_BRANCH == 'master' ]]; then
    grunt gh-pages:travis-uncompressed
fi
