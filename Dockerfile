FROM node:slim

ADD ./Release /opt/PLUTO

VOLUME ["/opt/PLUTO/config"]
EXPOSE 8000
WORKDIR /opt/PLUTO
CMD ["node","server/server.js","-s","serverConfig.json","-v","config/validatorConfig.json"]