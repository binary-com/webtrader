/**
 * Created by Arnab Karmakar on 7/19/17.
 */
import indexTest from './indexTest';
import helpTest from './helpTest.js';
import {checkLangOnIndex, changeLangOnIndex, changeLangOnMain} from './languageChangeTest';
import currentTimeTest from './currentTimeTest';
import navigateToMainTest from './navigateToMainTest';
import checkChromeExtTest from './checkChromeExtTest';

export default {

    'Index file': indexTest,

    'Check current time': currentTimeTest,

    'Check current language [Index Page]': checkLangOnIndex,

    'Change language [Index Page]': changeLangOnIndex,

    'Navigate to Main page': navigateToMainTest,

    //'Check Chrome Ext': checkChromeExtTest, TODO

    'Help': helpTest,

    'Change language [Main Page]': changeLangOnMain,

}
