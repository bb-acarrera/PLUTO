FROM node:8.9-alpine

ADD . /opt/PLUTO

RUN cd /opt/PLUTO && npm install pg@^7.0 commander@^2.9.0 node-pg-migrate@^2.11.1 fs-extra@^3.0.1

VOLUME ["/opt/PLUTO/config"]
WORKDIR /opt/PLUTO
CMD ["./run_importer.sh"]