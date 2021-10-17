
  var subprocess = require('child_process').fork('child01.js');
  
  //Open up the server object and send the handle
  var server = require('net').createServer();
  server.on('connection',function(socket){
      socket.end('handled by parent\n');
  });
  server.listen(1337,function(){
    subprocess.send('server',server);
  });