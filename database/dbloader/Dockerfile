FROM node:alpine

RUN npm install pg@^7.0 commander@^2.9.0

ADD . /opt/PLUTO

VOLUME ["/opt/PLUTO/config"]
WORKDIR /opt/PLUTO
CMD ["./run_importer.sh"]