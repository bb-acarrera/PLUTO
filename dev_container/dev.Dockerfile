FROM pluto_base

WORKDIR /code

COPY package.json /code/package.json
RUN npm install
RUN mv /code/node_modules /node_modules

VOLUME ["/code"]
ENV PLUTOAPI /code/src/api
ENV PLUTOCONFIG /code/src/runtime
