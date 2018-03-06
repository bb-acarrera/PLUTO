FROM docker.elastic.co/beats/metricbeat:6.1.2
COPY metricbeat.yml /usr/share/metricbeat/metricbeat.yml
USER root
RUN chown root /usr/share/metricbeat/metricbeat.yml
#USER metricbeat
RUN chmod go-w /usr/share/metricbeat/metricbeat.yml