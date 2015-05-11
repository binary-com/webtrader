#highcharts [![Build Status](https://magnum.travis-ci.com/regentmarkets/highcharts.svg?token=G5WVALzDGxSszAeYnDnJ&branch=master)](https://magnum.travis-ci.com/regentmarkets/highcharts) <a href="https://zenhub.io"><img src="https://raw.githubusercontent.com/ZenHubIO/support/master/zenhub-badge.png" height="18px"></a>
This repository contains HTML, Javascript, CSS, and images content of the [Higcharts implementation for binary.com charts](http://regentmarkets.github.io/highcharts) website.
 
##How to work with this project
####Learn how to setup the project:
In order to get started on this project, follow these steps. The steps are meant for Linux OS users. However Windows and MacOS should be similar

        > Open command prompt
        $ sudo apt-get install git
        $ git clone https://github.com/regentmarkets/highcharts.git
        $ cd highcharts
        $ sudo apt-get install node npm
        $ sudo npm install -g grunt-cli
        $ npm install
    
At this point, your project is properly setup. You can now run following command to start a local server
        
        $ grunt connect

In order to get SLOC(Source line of Code) report, run

        $ grunt sloc

To bump release version, run

        $ grunt bump:major

        or

        $ grunt bump:minor

        or

        $ grunt bump:patch

To release code (beta release, http://regentmarkets.github.io/highcharts/beta)

        $ grunt gh-pages:gh-pages-beta

To release code (prod release, http://regentmarkets.github.io/highcharts)

        $ grunt gh-pages:gh-pages-prod
    
You can now access the charting page by opening http://localhost:10001/main.html in browser

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
When commit is done with [release] tag in the master branch, it will trigger deployment into highcharts gh-pages automatically and will update the release files and changes could be seen live @ [Higcharts implementation for binary.com charts](http://regentmarkets.github.io/highcharts)
