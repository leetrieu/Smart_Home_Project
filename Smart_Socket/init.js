load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_sys.js');
load('api_timer.js');
load('api_rpc.js');

// Helper C function get_led_gpio_pin() in src/main.c returns built-in LED GPIO
let led = ffi('int get_led_gpio_pin()')();

RPC.addHandler('GetStatus', function() {
  let i,array = [],json,state;
  for(i = 0; i < 17; i++)
  {
    state = GPIO.read(i);
    array[i] = state; 
  }
  json = JSON.stringify(array);
  return json;
});

let getInfo = function() {
  return JSON.stringify({total_ram: Sys.total_ram(), free_ram: Sys.free_ram()});
};

// Blink built-in LED every second
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
Timer.set(2000 /* 1 sec */, true /* repeat */, function() {
  let value = GPIO.toggle(led);
  //print(value ? 'Tick' : 'Tock', 'uptime:', Sys.uptime(), getInfo());
}, null);

// Publish to MQTT topic on a button press. Button is wired to GPIO pin 0
GPIO.set_button_handler(4, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  let topic = 'devices/' + Cfg.get('device.id');
  let message = getInfo();
  let ok = MQTT.pub(topic, message, message.length);
  print('Published:', ok ? 'yes' : 'no', 'topic:', topic, 'message:', message);
}, null);
