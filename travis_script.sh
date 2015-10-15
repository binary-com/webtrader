#!/bin/bash

git config --global user.email "arnab@binary.com"
git config --global user.name "Arnab Karmakar"
echo GIT Branch : $TRAVIS_BRANCH , Pull request number : $TRAVIS_PULL_REQUEST

if [ $TRAVIS_BRANCH = development ]; then
    mkdir beta
    mv dist/compressed/* beta
    mv beta dist/compressed
fi
if [ $TRAVIS_BRANCH = "master" ]; then
    grunt gh-pages:travis-deploy
fi
