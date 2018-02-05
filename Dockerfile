FROM pluto_base

ADD . /opt/PLUTO

RUN cd /opt/PLUTO && npm install --production

VOLUME ["/opt/PLUTO/config"]
ENV PLUTOAPI /opt/PLUTO/api
ENV PLUTOCONFIG /opt/PLUTO/config
EXPOSE 3000
WORKDIR /opt/PLUTO
CMD ["node","server/server.js","-s","serverConfig.json","-v","config/validatorConfig.json"]
