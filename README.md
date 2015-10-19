#Webtrader ![Build Status](https://travis-ci.org/binary-com/webtrader.svg?branch=master)

[![Join the chat at https://gitter.im/binary-com/webtrader](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/binary-com/webtrader?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
This repository contains the HTML, Javascript, CSS, and images for the [WebTrader](http://binary-com.github.io/webtrader) website.

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
        $ npm install
        $ bower install
    
####Windows Users
1.  Download and install Git from [the official website](https://git-scm.com/download). Git Bash is included.
2. Download and install NodeJS from [the official website](https://www.nodejs.org). NPM is included.
3. Open Git Bash and run the following commands:
```
$ git clone https://github.com/binary-com/webtrader.git
$ cd webtrader
$ install -g grunt-cli
$ npm install
$ bower install
```
These will clone the repository, install `grunt-cli` and then resolve all of the dependencies from `package.json` and `bower.json` files.

At this point, your project is properly setup. You can now run following command to start a local server
        
        $ grunt connect:compressed
        For compressed file serving

        $ grunt connect:uncompressed
        For uncompressed file serving(this is default, you can just do grunt connect)

Running this command will launch local server at http://localhost:9001

You should always combine the above command with 
        
        $ grunt watch
This command will help to automatically run grunt task when files are changed under src directory

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

#####Contribution
In order to contribute, please fork and submit pull request by following all the above mentioned coding rules.
While submitting your PR, make sure that you deploy your code to your forked gh-pages by running following command, so that the reviewer can have a look at the deployed code:
    
        $ grunt deploy
        For releasing compressed code

