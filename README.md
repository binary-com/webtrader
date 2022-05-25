<h1 align="center">
  Webtrader
</h1>

Webtrader.binary.com - The goal of this project is to create a full-screen trading interface for [Binary.com](https://www.binary.com) according to the following design:

![Webtrader](https://banners.binary.com/misc/webtrader-layout.jpg)

![Build Status](https://travis-ci.org/binary-com/webtrader.svg?branch=master) ![node](https://img.shields.io/badge/node-%3E%3D12.3.0-blue.svg) ![npm](https://img.shields.io/badge/npm-%3E%3D6.9.0-blue.svg)

## In this document:

- [Pre-installation](#pre-installation)
- [Quick start](#quick-start)
- [How to contribute](#how-to-contribute)
- [Manage translations](#manage-translations)
- [Test link deployment](#test-link-deployment)

## Pre-installation

Before running or contribute to this project, you need to have the setup of the following packages in your environment:

-   node >=12.3.0
-   npm 
-   git

## Quick start


1.  **Fork the project**

    In order to work on your own version, please fork the project to your own repo.

2.  **Clone using SSH**

    ```sh
    git clone git@github.com:your-github-username/webtrader.git
    ```

3. **Verify Remote**

    ```sh
    git remote -v
    ```

4. **Add remote using webtraders ssh key**
    ```sh
    git remote add git@github.com:binary-com/webtrader.git
    ```

5.  **Enter project directory**

    ```sh
    cd webtrader
    ```

6.  **Install the dependencies:**

    ```sh
    npm install
    npm run build
    ```

7.  **Start Running the Application:**

    ```sh
    npm start
    ```

8.  **Open the source code and start editing!**

    Your site is now running at `http://localhost:9001`!


Note\*: Since backend needs an https web address for **oauth app register** if you intend to debug oauth login on localhost, you need to modify your `/etc/hosts` file. For example the `https://webtrader.local/` token in `src/oauth/app_id.josn` is registered to `https://webtrader.local/` address, you need to do the following in order to use it locally.

_Add this line to your /etc/hosts file._

        127.0.0.1 webtrader.local

_Use this command to run your local server on https._

        $ sudo node_modules/.bin/grunt connect:https

_Use this command to watch the files._

        $ node_modules/.bin/grunt && node_modules/.bin/grunt watch:https

Go to https://webtrader.local:35729 and accept the self signed ssl certificate for grunt livereload.

Now you can debug your app on https://webtrader.local/ locally.

To bump release version, run

        $ npm major-rel
        or
        $ npm minor-rel
        or
        $ npm patch-rel

Every check-in or merge into master will trigger travis-ci build and do a release to production.

Every check-in or merge of PR into development will trigger travis-ci build and do a beta release

## How to contribute

In order to contribute, please fork and submit pull request by following all the following mentioned coding rules:

1.  **Create branch from latest master branch**

        ```sh
        git checkout master
        git pull upstream master
        git checkout -b {your_branch_name}
        ```

2. **After finish editing, Add, Commit and Push your changes to github**

        ```sh
        $ git add .
        $ git commit -m {your ideal message}
        $ git push --set-upstream origin {your-branch-name}
        ```
3. **Go to your github and create a pull request**

4. **Go to pull request page and copy the url link that will be your PR link.**

5. **Do [Test link deployment](#test-link-deployment)**

## Manage translations

Translation related files are in `/translations` folder.

To extract text for translation:

        ```sh
        $ npm run build
        $ cd ./translations
        $ python extract.py
        $ extract.py # extracts string literals from `dist/uncompressed` (from *.html and *.js)
        $ extract.py # for merging `.po` files uses `msgmerge` command line tool.
        ```

Note\*: The tool should be available on linux, if you are on Osx try `brew install gettext && brew link gettext --force`.

Note\*: To submit text to translators: push to _translation_ branch, weblate hook will be triggered.

Note\*: To see CrowdIn In-Context translations pass querystring `?lang=ach` (obs not for production env)

## Test link deployment

While submitting your PR, make sure that you deploy your code to your forked gh-pages by running following command, so that the reviewer can have a look at the deployed code at this url `{your-username}.github.io/webtrader/{your-branch-name}`:

        ```sh
        $ grunt deploy-branch
        ```
After Completing the steps above, you will get a `Done.` in your terminal. Go to your browser and key in `{your-username}.github.io/webtrader/{your-branch-name}`. You should see the Testing page for Webtrader.