import $banner from "text!./banners.html";
import liveapi from "../websockets/binary_websockets";
import "css!banners/banners.css";


const shouldShowBanner = (auth) => {
  const has_mf  = auth.account_list.filter( item => item.landing_company_name === 'maltainvest').length;
  const has_mlt = auth.account_list.filter( item => item.landing_company_name === 'malta').length;
  const has_iom = auth.account_list.filter( item => item.landing_company_name === 'iom').length;
  const current_loginId =  local_storage.get('authorize').loginid;
  const getLoginId = loginids().filter( item => item.id === current_loginId);
  const is_mf = getLoginId[0].is_mf;
  const is_virtual = getLoginId[0].is_virtual;
  if (is_mf) {
    return true;
  } else if (is_virtual && has_mf && !has_iom && !has_mlt) {
    return true;
  }
  return false;
};

export const init = () => {
  const banner = $($banner).i18n();
  const nav = $("body").find("nav");
  nav.after(banner);
  const go_to_deriv_el = document.getElementById("close_banner_btn_iom");
  go_to_deriv_el.href = getDerivUrl("");
  showBanner();
};

const showBanner = () => {
  const banner = document.getElementById("close_banner_container");
  liveapi.cached.send({ website_status: 1 }).then((status) => {
    const client_country = status.website_status.clients_country;
      if (local_storage.get("oauth")) {
      liveapi.cached.authorize().then((res) => {
        const country = local_storage.get("authorize").country;
        liveapi.send({ landing_company: country }).then((data) => {
          const landing_company = data.landing_company;
          if ((isEuCountry(country, landing_company) && shouldShowBanner(res.authorize))
          || (loginids().length == 1 && isEuCountrySelected(client_country))) {
            banner.classList.remove("invisible");
          } else {
            banner.classList.add("invisible");
          }
        });
      });
    } else {
      liveapi.send({ landing_company: client_country }).then((response) => {
        const landing_company = response.landing_company;
        if (isEuCountry(client_country, landing_company)) {
          banner.classList.remove("invisible");
        } else {
          banner.classList.add("invisible");
        }
      });
    }
  })
  
};

liveapi.events.on("login", () => {
  showBanner();
});
liveapi.events.on("logout", () => {
  showBanner();
});
liveapi.events.on("switch_account", () => {
  showBanner()
});

export default {
  init,
};
