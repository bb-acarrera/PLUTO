# /bin/sh

docker stop rabbitTest
docker rm rabbitTest

docker volume create testRabbitData

docker run -v testRabbitData:/var/lib/rabbitmq -p 4369:4369 -p 5672:5672 -p 15672:15672 -p 25672:25672 -d --name rabbitTest rabbitmq:3.7.4-management-alpine