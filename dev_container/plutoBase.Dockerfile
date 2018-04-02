FROM node:8.9-alpine

ARG PANDAS_VERSION=0.22.0

RUN apk --no-cache add \
  python \
  python-dev \
  py-pip \
  build-base

RUN apk add --no-cache --virtual .build-deps g++ && \
    ln -s /usr/include/locale.h /usr/include/xlocale.h && \
    pip install --no-cache-dir numpy==1.14.0 && \
    pip install --no-cache-dir pandas==${PANDAS_VERSION} && \
    apk del .build-deps

RUN pip install --upgrade requests==2.18.4