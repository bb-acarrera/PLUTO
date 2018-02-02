FROM pluto_dev

CMD ["/node_modules/qunitjs/bin/qunit", "src/server/tests/*/test-*.js", "src/validator/tests/*/test-*.js"]