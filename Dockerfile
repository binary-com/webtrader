FROM nginx:alpine
COPY ./dist/compressed /usr/share/nginx/html
COPY ./default.conf /etc/nginx/conf.d/default.conf
