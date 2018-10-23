# Webtrader ![Build Status](https://travis-ci.org/binary-com/webtrader.svg?branch=master)

This repository contains HTML, Javascript, CSS, and images for [WebTrader](http://binary-com.github.io/webtrader) website.

## Project goal
The goal of this project is to create a full-screen trading interface for [Binary.com](https://www.binary.com) according to the following design:
![Webtrader](https://banners.binary.com/misc/webtrader-layout.jpg)

## Prerequisites

        * git
        * node JS
        * yarn

## How to work with this project

        $ git clone https://github.com/binary-com/webtrader.git
        $ cd webtrader
        $ yarn install
        $ yarn build #compiles the project
        $ yarn start #Start a local server and serve the compiled files

Running this command will launch local server at http://localhost:9001

Since backend needs an https web address for **oauth app register** if you intend to debug oauth login on localhost,  you need to modify your `/etc/hosts` file. For example the `https://webtrader.local/` token in `src/oauth/app_id.josn` is registered to `https://webtrader.local/` address, you need to do the following in order to use it locally.

*Add this line to your /etc/hosts file.*

        127.0.0.1 webtrader.local

*Use this command to run your local server on https.*

        $ sudo node_modules/.bin/grunt connect:https

*Use this command to watch the files.*

        $ node_modules/.bin/grunt && node_modules/.bin/grunt watch:https

Go to https://webtrader.local:35729 and accept the self signed ssl certificate for grunt livereload.

Now you can debug your app on https://webtrader.local/ locally.

To bump release version, run

        $ yarn major-rel
        or
        $ yarn minor-rel
        or
        $ yarn patch-rel

Every check-in or merge into master will trigger travis-ci build and do a release to production.

Every check-in or merge of PR into development will trigger travis-ci build and do a beta release

#### Translations

Translation related files are in `/translations` folder.
    
  To extract text for translation:

        $ yarn build
        $ cd ./translations
        $ python extract.py
        $ extract.py # extracts string literals from `dist/uncompressed` (from *.html and *.js)
        $ extract.py # for merging `.po` files uses `msgmerge` command line tool.

The tool should be available on linux, if you are on Osx try `brew install gettext && brew link gettext --force`.
to submit text to translators: push to *translation* branch, weblate hook will be triggered.

To see CrowdIn In-Context translations pass querystring `?lang=ach` (obs not for production env)

### Contribution
In order to contribute, please fork and submit pull request by following all the above mentioned coding rules.
While submitting your PR, make sure that you deploy your code to your forked gh-pages by running following command, so that the reviewer can have a look at the deployed code:

        $ grunt deploy-branch
        For releasing compressed code