import { LiveApi } from '../lib/';

var api = new LiveApi();

const token = '3wXTOFIMNvhIs5UpARelBFQHzRhd2k2tQoxIK1VarnFOeAmd';
api.authorize(token).then(() =>{ console.log('Authorized!') }, () => { console.log('Not Authorized')});

function tickHistoryDemo() {
    api.events.on('history', function(response) {
        console.log(response);
    });
    api.getTickHistory({symbol: 'frxUSDJPY', end: 'latest', count: 10});
}

function tickHistoryPromiseDemo() {
    api.getTickHistory('frxUSDJPY', {end: 'latest', count: 10}).then(function(response) {
        console.log(response);
    });
}

function forgetDemo() {
    api.unsubscribeFromAllTicks();
}

function tickStreamDemo() {
    api.events.on('tick', function(response) {
        console.log(response);
    });
    api.subscribeToTick('frxUSDJPY');
}

function pingDemo() {
    api.events.on('ping', function(response) {
        console.log(response);
    });
    api.ping();
}

function pingPromiseDemo() {
    api.ping().then(response => {
        console.log(response)
    });
}

function openPositionsDemo() {
    api.events.on('portfolio', function(response) {
        console.log(response);
    });
    api.getPortfolio();
}

function tradingTimesDemo() {
    api.events.on('trading_times', function(response) {
        console.log(response);
    });
    api.getTradingTimes();
}

api.events.on('*', function(response) {
    console.log('all', response);
});

console.log(api.events.messageHandlers);

// tickHistoryPromiseDemo();
pingPromiseDemo();
