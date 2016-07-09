# homebridge-mqttlightbulb
An homebridge plugin that create an HomeKit Lightbulb accessory mapped on MQTT topics

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-mqttlightbulb) and should be installed "globally" by typing:

    npm install -g homebridge-mqttlightbulb

# Release notes
Version 0.0.1
+ Initial public draft

# Configuration
Remember to configure the plugin in config.json in your home directory inside the .homebridge directory. Configuration parameters:
```javascript
{
  "accessory": "mqttlightbulb",
  "name": "<name of lightbulb>",
  "url": "<url of broker>", // i.e. "http://mosquitto.org:1883"
  "username": "<username>",
  "password": "<password>",
  "caption": "<label>",
  "topics":
  {
    "getOn": 	        "<topic to get the status>",
    "setOn": 	        "<topic to set the status>",
    "getBrightness": 	"<topic to get the brightness>",
    "setBrightness": 	"<topic to set the brightness>",
    "getHue": 	       "<topic to get the hue>",
    "setHue": 	       "<topic to set the hue>",
    "getSaturation": 	"<topic to get the saturation>",
    "setSaturation": 	"<topic to set the saturation>"
  }
}
```

Look for a sample config in [config.json example](https://github.com/ameeuw/homebridge-mqttlightbulb/blob/master/config.json)
