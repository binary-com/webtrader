import $banner from "text!./banners.html";
import liveapi from "../websockets/binary_websockets";
import "css!banners/banners.css";

export const isEuCountry = (clients_country, landing_company) => {
  const eu_shortcode_regex = new RegExp("^(maltainvest|malta|iom)$");
  const eu_excluded_regex = new RegExp("^mt$");
  const financial_shortcode =
    (landing_company && landing_company.financial_company)
      ? landing_company.financial_company.shortcode
      : "";
  const gaming_shortcode =
    (landing_company && landing_company.gaming_company)
      ? landing_company.gaming_company.shortcode
      : "";

  return financial_shortcode || gaming_shortcode
    ? eu_shortcode_regex.test(financial_shortcode) ||
        eu_shortcode_regex.test(gaming_shortcode)
    : eu_excluded_regex.test(clients_country);
};

export const isMFCountry = (landing_company) => {
  const mf_shortcode_regex = new RegExp("^(maltainvest)$");
  const gaming_shortcode =
  (landing_company && landing_company.gaming_company)
    ? landing_company.gaming_company.shortcode
    : "";

    return gaming_shortcode 
    ? mf_shortcode_regex.test(gaming_shortcode) 
    : false;
}

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
  if (local_storage.get("oauth")) {
    liveapi.cached.authorize().then(() => {
      const current_loginId =  local_storage.get('authorize').loginid;
      const getLoginId = loginids().filter( item => item.id === current_loginId);
      const is_mf_account = getLoginId[0].is_mf;
      const is_virtual = getLoginId[0].is_virtual;
      const country = local_storage.get("authorize").country;
      liveapi.send({ landing_company: country }).then((data) => {
        const landing_company = data.landing_company;
        if (isEuCountry(country, landing_company) && 
        (is_mf_account || (isMFCountry(landing_company) && is_virtual))) {
          banner.classList.remove("invisible");
        } else {
          banner.classList.add("invisible");
        }
      });
    });
  } else {
    liveapi.send({ website_status: 1 }).then((data) => {
      const country = data.website_status.clients_country;
      liveapi.send({ landing_company: country }).then((response) => {
        const landing_company = response.landing_company;
        if (isEuCountry(country, landing_company)) {
          banner.classList.remove("invisible");
        } else {
          banner.classList.add("invisible");
        }
      });
    });
  }
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
  isEuCountry
};
