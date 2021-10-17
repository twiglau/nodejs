
  process.on('message',function(m,server){
     if(m === 'server'){
        server.on('connection',function(socket){
          socket.on('handled by child\n');
        });
     }
  });