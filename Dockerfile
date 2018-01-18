FROM node:8.9-alpine

RUN apk --no-cache add \
  python \
  python-dev \
  py-pip \
  build-base

RUN pip install --upgrade requests

ADD . /opt/PLUTO

RUN cd /opt/PLUTO && npm install --production

VOLUME ["/opt/PLUTO/config"]
ENV PLUTOAPI /opt/PLUTO/api
ENV PLUTOCONFIG /opt/PLUTO/config
EXPOSE 3000
WORKDIR /opt/PLUTO
CMD ["node","server/server.js","-s","serverConfig.json","-v","config/validatorConfig.json"]
