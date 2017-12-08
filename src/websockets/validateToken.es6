/**
 * Created by Arnab Karmakar on 11/13/17.
 *
 * History -
 *  CopyTrader and MAM are two modules in Webtrader which requires token validation.
 *  This token is not user's token. It is either traders' or other users' token.
 *  In order to understand more about what these tokens are, please visit these screens.
 *  I had a detailed discussion with backend team. As of 13th Nov 2017, either there
 *  are no backend resources to create new API for token validation or they are
 *  reluctant to do so. Based on my discussion with Tom, he recommended this approach
 *  for now.
 */
import 'common/util';
import { socket_url, app_id } from 'websockets/binary_websockets';

const lang = (local_storage.get('i18n') || {value:"en"}).value;
const url = socket_url + '?app_id=' + app_id + '&l=' +lang;

export default (token) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        "authorize": token
      }));
    });
    ws.addEventListener('close', () => {});
    ws.addEventListener('message', msg => {
      const data = JSON.parse(msg.data);
      resolve(data.authorize);
      ws.close();
    });

    ws.addEventListener('error', (event) => reject(event.error));
  });
};
