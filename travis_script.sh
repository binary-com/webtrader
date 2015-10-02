#!/bin/bash

git config --global user.email "arnab@binary.com"
git config --global user.name "Arnab Karmakar"
echo $TRAVIS_BRANCH
if [[ $TRAVIS_BRANCH == 'development' ]]; then
    mkdir beta
    mv dist/compressed/* beta
    mv beta dist/compressed
    grunt gh-pages:compressed
fi
if [[ $TRAVIS_BRANCH == 'master' ]]; then
    grunt gh-pages:compressed
fi