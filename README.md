# homebridge-mqttswitch
An homebridge plugin that create an HomeKit Switch accessory mapped on MQTT topics

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-mqttswitch) and should be installed "globally" by typing:

    npm install -g homebridge-mqttswitch
    
# Release notes
Version 0.0.4 Dynamic Status
+ This new version uses an additional status command, sent via the "set" Topic, to dynamically retrieve the status of the switch from the device. The status should be then published by the device on the "get" topic, as usual. You should develop the device code to accept the status command on the "set" topic and answer publishing the actual status using the "get" topic. The status values must be the same used for the onValue and offValue configurations. This new version is able to detect the actual state of the device. This fixes also partially the issue #12. But, if the switch is off (I mean, the MQTT client is not responding to the status command) the best thing on the Home app is to put the device in a "No Response" state. You can't be sure that the device is really off, just think about a network problem, instead of a power problem. The method for this is not yet implemented in this version.    

Version 0.0.3
+ Added onValue, offValue and integerValue params

Version 0.0.2
+ Initial public draft

# Configuration
Remember to configure the plugin in config.json in your home directory inside the .homebridge directory. Configuration parameters:
+ "accessory": "mqttswitch",
+ "name": "PUT THE NAME OF YOUR SWITCH HERE",
+ "url": "PUT URL OF THE BROKER HERE",
+ "username": "PUT USERNAME OF THE BROKER HERE",
+ "password": "PUT PASSWORD OF THE BROKER HERE",
+ "caption": "PUT THE LABEL OF YOUR SWITCH HERE",
+ "topics": {
 	"statusGet": 	"PUT THE MQTT TOPIC FOR THE GETTING THE STATUS OF YOUR SWITCH HERE",
 	"statusSet": 	"PUT THE MQTT TOPIC FOR THE SETTING THE STATUS OF YOUR SWITCH HERE"
	}
+ "onValue": "OPTIONALLY PUT THE VALUE THAT MEANS ON HERE (DEFAULT true)",
+ "offValue": "OPTIONALLY PUT THE VALUE THAT MEANS OFF HERE (DEFAULT false)",
+ "statusCmd": "OPTIONALLY PUT THE STATUS COMMAND HERE" 
+ "integerValue": "OPTIONALLY SET THIS TRUE TO USE 1/0 AS VALUES"

Look for a sample config in [config.json example](https://github.com/ilcato/homebridge-mqttswitch/blob/master/config.json)
