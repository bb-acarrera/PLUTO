var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(err, conn) {
	
  if(err) {
	  console.log(err);
	  return;
  }	
	
  conn.createChannel(function(err, ch) {
    var q = 'pluto_runs';
    //var msg = process.argv.slice(2).join(' ') || "Hello World!";
    
    var msg = JSON.stringify({
        ruleset: process.argv.slice(2).join(' ') || "219"
    });

	ch.assertQueue(q, {durable: true});
	ch.sendToQueue(q, new Buffer(msg), {persistent: true});
	console.log(" [x] Sent '%s'", msg);
  });
  setTimeout(function() { conn.close(); process.exit(0) }, 500);
});