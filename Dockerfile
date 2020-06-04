ARG  NGINX_LOCATION=/usr/share/nginx/html/beta
FROM nginx:alpine
ARG NGINX_LOCATION
COPY ./dist/compressed $NGINX_LOCATION
COPY ./default.conf /etc/nginx/conf.d/default.conf
