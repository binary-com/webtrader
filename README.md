#Webtrader ![Build Status](https://travis-ci.org/binary-com/webtrader.svg?branch=master)
This repository contains HTML, Javascript, CSS, and images for [Web Trader](http://binary-com.github.io/webtrader) website.
 
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

To release code (beta release, [Web Trader (beta)](http://binary-com.github.io/webtrader/beta)) - Not recommended to be used from local environment

        $ grunt gh-pages:gh-pages-beta

To release code (prod release, [Web Trader](http://binary-com.github.io/webtrader)) - Not recommended to be used from local environment

        $ grunt gh-pages:gh-pages-prod
    
You can now access the charting page by opening http://localhost:9001/main.html in browser

Every checking into master will trigger travis-ci build process. Release is based on commit hooks. 

    [release_prod]
    With this commit message, travis-ci will automatically deploy code into gh-pages for production release

    [release_beta]
    With this commit message, travis-ci will automatically deploy code into gh-pages for beta release

####Follow these rules:
##### General Guidelines
[Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

##### Anonymous closures
To prevent global variables, use closures:

        (function () {
            // ... all vars and functions are in this scope only
            // still maintains access to all globals
        }());
    
##### Strict Mode
Include at the beginning of each .js file:
        
        "use strict";

#####More details on strict mode:

[ECMAScript 5 Strict Mode, JSON, and More](http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/)

[Strict Mode ](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode)

[It’s time to start using JavaScript strict mode](http://www.nczonline.net/blog/2012/03/13/its-time-to-start-using-javascript-strict-mode/)

##### Naming conventions
Variables that contain jquery selected elements should start with a '$'.

Don't:

        var due = $('#due');

Do:

        var $due = $('#due');

#####Test thoroughly:
Every module, JS file, classes, function, etc that is coded for this project, should be accompanied by a corresponding test file. We use QUnit and it is expected that every src code submission is covered by a unit test scenario. Our project is connected with travis CI and each checkin is validated by Travis Continuous Integration system. 

#####Get your code to our repo:
In order to contribute, please fork and submit pull request by following all the above mentioned coding rules.
    
#####Other details
When commit is done with [release] tag in the master branch, it will trigger deployment into webtrader gh-pages automatically and will update the release files and changes could be seen live @ [Web Trader](http://binary-com.github.io/webtrader)
