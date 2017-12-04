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
import { app_id } from 'websockets/binary_websockets';

export default (token) => {
  return new Promise((resolve, reject) => {
    const config = local_storage.get('config');
    const i18n_name = (local_storage.get('i18n') || { value: 'en' }).value;
    const api_url = ((config && config.websocket_url)  || 'wss://ws.binaryws.com/websockets/v3?l=' + i18n_name) + '&app_id=' + app_id;
    const ws = new WebSocket(api_url);

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
