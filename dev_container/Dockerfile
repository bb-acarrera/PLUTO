FROM pluto_base



VOLUME ["/code"]
ENV PLUTOAPI /opt/PLUTO/src/api
ENV PLUTOCONFIG /opt/PLUTO/src/runtime/configs
ENV PYTHONPATH="${PYTHONPATH}:/opt/PLUTO/src/api"
EXPOSE 3000
EXPOSE 9222
EXPOSE 9229
WORKDIR /code
CMD ["/bin/sh"]
