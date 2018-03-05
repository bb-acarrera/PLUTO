FROM alpine:latest

RUN apk add --no-cache curl

WORKDIR /
COPY config-es.sh /
RUN chmod 500 /config-es.sh

COPY pipelines /pipelines

CMD ["/config-es.sh"]