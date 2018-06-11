FROM pluto_dev

COPY . /code

CMD ["/node_modules/qunitjs/bin/qunit", "src/server/tests/*/test-*.js", "src/validator/tests/*/test-*.js"]
