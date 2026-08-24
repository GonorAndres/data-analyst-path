# Minimal redirect service for the retired Streamlit dashboard.
#
# Replaces the Streamlit image on the same Cloud Run service, so the run.app
# hostname keeps resolving and every inbound link from gonor.me, the blog and
# anything indexed continues to work. At min-instances=0 an idle redirect costs
# nothing.
FROM nginx:1.27-alpine

# nginx:alpine's entrypoint runs envsubst over /etc/nginx/templates/*.template
# into /etc/nginx/conf.d/, which is how ${PORT} reaches the config. Cloud Run
# sets PORT itself; the default keeps `docker run` working locally.
ENV PORT=8080
COPY default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
