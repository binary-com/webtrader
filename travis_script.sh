#!/bin/bash

git config --global user.email "arnab@binary.com"
git config --global user.name "Arnab Karmakar"
echo $TRAVIS_BRANCH
echo $TRAVIS_PULL_REQUEST
if [ $TRAVIS_PULL_REQUEST ]; then
    mkdir beta
    mv dist/uncompressed/* beta
    mv beta dist/uncompressed
    grunt travis-uncompressed-deploy
fi
if [[ $TRAVIS_BRANCH == 'master' ]]; then
    grunt travis-uncompressed-deploy
fi
