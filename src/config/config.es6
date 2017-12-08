// /**
// * Created by arnab on 5/12/16.
// */
// import $ from 'jquery';
// import windows from '../windows/windows';
// import rv from '../common/rivetsExtra';
// import liveapi from '../websockets/binary_websockets';
// import _ from 'lodash';
// import '../common/util';
// import html from 'text!./config.html';
// import 'css!./config.css';
//
// let win = null, win_view = null;
//
// const initConfigWindow = () => {
//    const root = $(html).i18n();
//    const state = init_state(root);
//    win_view = rv.bind(root[0], state);
//
//    win = windows.createBlankWindow(root, {
//       title: 'Change Backend Server'.i18n(),
//       resizable: false,
//       collapsable: false,
//       minimizable: false,
//       maximizable: false,
//       modal: true,
//       ignoreTileAction:true,
//       open: () => {
//          state.app_id = liveapi.app_id;
//          state.server_url = liveapi.server_url;
//          state.oauth_url = liveapi.server_url ? 'https://' + liveapi.server_url + '/oauth2/authorize' : 'https://oauth.binary.com/oauth2/authorize';
//       },
//       close: () => {
//          win_view && win_view.unbind();
//          win && win.dialog('destroy').remove();
//          win_view = win = null;
//       },
//       buttons: [
//          {
//             text: 'Apply'.i18n(),
//             icons: { primary: 'ui-icon-check' },
//             click: state.apply
//          },
//          {
//             text: 'Reset to Defaults'.i18n(),
//             icons: { primary: 'ui-icon-refresh' },
//             click: state.reset
//          }
//       ]
//    });
//
//    win.dialog( 'open' );
// }
//
// const init_state = (root) => {
//    const state = {
//       server_url: liveapi.server_url,
//       oauth_url: liveapi.server_url || 'oauth.binary.com',
//       app_id: liveapi.app_id
//    };
//
//    state.apply = () => {
//       const lang = (local_storage.get('i18n') || {value:'en'}).value;
//       const config = {
//          server_url: state.server_url,
//          oauth_url: 'https://' + state.oauth_url + '/oauth2/authorize',
//          app_id: state.app_id
//       }
//       local_storage.set('config', config);
//       state.reload_page();
//    }
//
//    state.reset = () => {
//       local_storage.remove('config');
//       state.reload_page();
//    }
//
//    state.reload_page = () => {
//       $.growl.notice({message: 'Config changes successful.<br/>Reloading page ...'.i18n()});
//       setTimeout(() => {
//          window.location.reload();
//       }, 900);
//    }
//
//    return state;
// }
//
//
// export const init = ($menuLink) => {
//    $menuLink.click(() => {
//       if (!win)
//          initConfigWindow();
//       else
//          win.moveToTop();
//    });
// }
//
// export default { init }
