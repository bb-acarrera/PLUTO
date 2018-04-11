FROM pluto_base

ADD . /opt/PLUTO

RUN cd /opt/PLUTO && npm install --production

RUN cd /opt/PLUTO && \
  npm install gdal@"^0.9.6" --build-from-source --shared_gdal --force

VOLUME ["/opt/PLUTO/config"]
ENV PLUTOAPI /opt/PLUTO/api
ENV PLUTOCONFIG /opt/PLUTO/config
ENV PYTHONPATH="${PYTHONPATH}:/opt/PLUTO/api"
EXPOSE 3000
WORKDIR /opt/PLUTO
CMD ["node","server/server.js","-s","serverConfig.json","-v","config/validatorConfig.json"]
