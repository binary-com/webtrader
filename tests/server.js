var connect = require('connect'),
    serveStatic = require('serve-static');
var app;
module.exports = {
    connect: () => {
        app = connect()
            .use(serveStatic('dist/uncompressed'))
            .listen(3000);
        console.log('\n\033[0;32mConnected web server on http://localhost:3000')
    },
    disconnect: () => {
        app.close();
    }
}