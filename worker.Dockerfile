FROM pluto:develop

CMD ["node","validator/queueWorker.js","-v","config/validatorConfig.json"]