ARG  NGINX_LOCATION=/usr/share/nginx/html/beta
FROM nginx:alpine
<<<<<<< HEAD
ARG NGINX_LOCATION
COPY ./dist/compressed $NGINX_LOCATION
=======
COPY ./dist/compressed /usr/share/nginx/html
>>>>>>> 34983f54192a57eacdad9eace193dcbdfe404821
COPY ./default.conf /etc/nginx/conf.d/default.conf
