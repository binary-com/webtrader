import connect from 'connect';
import serveStatic from 'serve-static';
let app;
export const start = () => {
  app = connect()
    .use(serveStatic('dist/uncompressed'))
    .listen(3000);
  console.log('\n\x1b[1;32mConnected web server on http://localhost:3000\x1b[m')
};
export const close = () => {
  app.close();
}
