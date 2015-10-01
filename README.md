#Webtrader ![Build Status](https://travis-ci.org/binary-com/webtrader.svg?branch=master)

[![Join the chat at https://gitter.im/binary-com/webtrader](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/binary-com/webtrader?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
This repository contains HTML, Javascript, CSS, and images for [WebTrader](http://binary-com.github.io/webtrader) website.
 
##How to work with this project
####Learn how to setup the project:
In order to get started on this project, follow these steps. The steps are meant for Linux OS users. However Windows and MacOS should be similar

        > Open command prompt
        $ sudo apt-get install git
        $ git clone https://github.com/binary-com/webtrader.git
        $ cd webtrader
        $ sudo apt-get install node npm
        $ sudo apt-get install nodejs-legacy
        $ sudo npm install -g grunt-cli
        $ npm install
    
At this point, your project is properly setup. You can now run following command to start a local server
        
        $ grunt connect

In order to get SLOC(Source line of Code, which displays total number of lines of source code) report, run

        $ grunt sloc

To bump release version, run

        $ grunt bump:major

        or

        $ grunt bump:minor

        or

        $ grunt bump:patch

To release code (beta release, [WebTrader (beta)](http://binary-com.github.io/webtrader/beta)) - Not recommended to be used from local environment

        $ grunt gh-pages:gh-pages-beta

To release code (prod release, [WebTrader](http://binary-com.github.io/webtrader)) - Not recommended to be used from local environment

        $ grunt gh-pages:gh-pages-prod
    
You can now access the charting page by opening http://localhost:9001/main.html in browser

Every checking into master will trigger travis-ci build process. Release is based on commit hooks. 

    [release_prod]
    With this commit message, travis-ci will automatically deploy code into gh-pages for production release

    [release_beta]
    With this commit message, travis-ci will automatically deploy code into gh-pages for beta release

#####Get your code to our repo:
In order to contribute, please fork and submit pull request by following all the above mentioned coding rules.
    
#####Other details
When commit is done with [release] tag in the master branch, it will trigger deployment into webtrader gh-pages automatically and will update the release files and changes could be seen live @ [WebTrader](http://binary-com.github.io/webtrader)

