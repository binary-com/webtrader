#Webtrader ![Build Status](https://travis-ci.org/binary-com/webtrader.svg?branch=master)

This repository contains HTML, Javascript, CSS, and images for [WebTrader](http://binary-com.github.io/webtrader) website.

##Project goal
The goal of this project is to create a full-screen trading interface for [Binary.com](https://www.binary.com) according to the following design:
![Webtrader](https://banners.binary.com/misc/webtrader-layout.jpg)

##How to work with this project
####Linux Users
        $ sudo apt-get install git
        $ git clone https://github.com/binary-com/webtrader.git
        $ cd webtrader
        $ sudo apt-get install node npm
        $ sudo apt-get install nodejs-legacy
        $ sudo npm install -g grunt-cli
        $ sudo npm install -g bower
        $ npm install
        $ bower install

####Windows Users
    * Download and install Git from [the official website](https://git-scm.com/download). Git Bash is included.
    * Download and install NodeJS from [the official website](https://www.nodejs.org). NPM is included.
    * Open Git Bash and run the following commands:
        $ git clone https://github.com/binary-com/webtrader.git
        $ cd webtrader
        $ npm install -g grunt-cli
        $ npm install -g bower
        $ npm install
        $ bower install
These will clone the repository, install `grunt-cli` and then resolve all of the dependencies from `package.json` and `bower.json` files.

At this point, your project is properly setup.

Run grunt to compile the project

        $ grunt

You can now run following command to start a local server

        $ grunt connect:compressed
        For compressed file serving

        $ grunt connect:uncompressed
        For uncompressed file serving(this is default, you can just do grunt connect)

Running this command will launch local server at http://localhost:9001

You should always combine the above command with

        $ grunt watch
This command will help to automatically run grunt task when files are changed under src directory

Since backend needs an https web address for **oauth app register** if you intend to debug oauth login on localhost,  you need to modify your `/etc/hosts` file. For example the `https://webtrader.local/` token in `src/oauth/app_id.josn` is registered to `https://webtrader.local/` address, you need to do the following in order to use it locally.

*Add this line to your /etc/hosts file.*

        127.0.0.1 webtrader.local

*Use this command to run your local server on https.*

        $ sudo grunt connect:https

*Use this command to watch the files.*

        $ grunt && grunt watch:https

Go to https://webtrader.local:35729 and accept the self signed ssl certificate for grunt livereload.

Now you can debug your app on https://webtrader.local/ locally.

In order to get SLOC(Source line of Code, which displays total number of lines of source code) report, run

        $ grunt sloc

To bump release version, run

        $ grunt bump:major

        or

        $ grunt bump:minor

        or

        $ grunt bump:patch

Every checkin or merge into master will trigger travis-ci build and do a release to production.

Every checkin or merge of PR into development will trigger travis-ci build and do a beta release

#####Translation-related command

Translation related files are in `/translations` folder.
to extract text for translation:

1- `cd ./translations`
2- `python extract.py` This will extract text from `../src/**/*.html` files.
`extract.py` runs `extract.js` which extracts string literals form `../src/**/*.js` files.
3- `extract.py` for merging `.po` files uses `msgmerge` command line tool.

The tool should be available on linux, if you are on Osx try `brew install gettext && brew link gettext --force`.
to submit text to translators: push to *translation* branch, weblate hook will be triggered.

#####Contribution
In order to contribute, please fork and submit pull request by following all the above mentioned coding rules.
While submitting your PR, make sure that you deploy your code to your forked gh-pages by running following command, so that the reviewer can have a look at the deployed code:

        $ grunt deploy
        For releasing compressed code
