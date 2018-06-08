FROM pluto_dev

CMD ["/node_modules/qunitjs/bin/qunit", "src/validator/tests/unit/test-*.js"]
