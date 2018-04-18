FROM pluto_base

WORKDIR /code

COPY package.json /code/package.json
RUN npm install
RUN mv /code/node_modules /node_modules

RUN cd / && \
  npm install gdal@"^0.9.6" --build-from-source --shared_gdal --force


VOLUME ["/code"]
ENV PLUTOAPI /code/src/api
ENV PLUTOCONFIG /code/src/runtime
ENV PYTHONPATH="${PYTHONPATH}:/code/src/api"
