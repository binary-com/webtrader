FROM nginx:alpine
COPY ./dist/compressed /usr/share/nginx/html/beta
COPY ./default.conf /etc/nginx/conf.d/default.conf
