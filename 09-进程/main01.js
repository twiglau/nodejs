var worker = new Worker('worker01.js');
worker.onmessage = function(event){
    document.getElementById('result').textContent = event.data;
};