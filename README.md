#Webtrader ![Build Status](https://travis-ci.org/binary-com/webtrader.svg?branch=master)

[![Join the chat at https://gitter.im/binary-com/webtrader](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/binary-com/webtrader?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
This repository contains HTML, Javascript, CSS, and images for [WebTrader](http://binary-com.github.io/webtrader) website.
 
##How to work with this project
####Learn how to setup the project:
In order to get started on this project, follow these steps. The steps are meant for Linux OS users. However Windows and MacOS should be similar

        $ sudo apt-get install git
        $ git clone https://github.com/binary-com/webtrader.git
        $ cd webtrader
        $ sudo apt-get install node npm
        $ sudo apt-get install nodejs-legacy
        $ sudo npm install -g grunt-cli
        $ npm install
    
At this point, your project is properly setup. You can now run following command to start a local server
        
        $ grunt connect:compressed
        For compressed file serving

        $ grunt connect:uncompressed
        For uncompressed file serving

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
    
        $ grunt compressed-deploy
        For releasing compressed code

        $ grunt uncompressed-deploy
        For releasing uncompressed code
