# homebridge-mqtt-sprinkler
An homebridge plugin that create an HomeKit Switch accessory with additional Information mapped on MQTT topics

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-mqttswitch) and should be installed "globally" by typing:

    sudo npm install -g homebridge-mqtt-sprinkler

# Information
This Plugin has been forked by [homebridge-mqttswitch](https://github.com/ilcato/homebridge-mqttswitch)

This accessory provides a switch including additional informations like:
+ last Runtime of the sprinkler
+ gauge of the sprinkler at the last Runtime
+ gauge of the sprinkler within the past 24 hours

# Release notes
VERSION 0.1
+ Initial Release

# Configuration
Remember to configure the plugin in config.json in your home directory inside the .homebridge directory. Configuration parameters:
+ "accessory"		    : "mqtt-sprinkler",
+ "name"			    : "PUT THE NAME OF YOUR SWITCH HERE",
+ "url"			    : "PUT URL OF THE BROKER HERE",
+ "username"		    : "OPTIONALLY PUT USERNAME OF THE BROKER HERE",
+ "password"		    : "OPTIONALLY PUT PASSWORD OF THE BROKER HERE",
+ "qos"		        : "QOS OF THE MESSAGES (DEFAULT 0)",
+ "caption"		    : "OPTIONALLY PUT THE LABEL OF YOUR SWITCH HERE",
+ "serialNumberMAC"	: "OPTIONALLY PUT THE LABEL OF YOUR SWITCH HERE",
+ "topics"		    : {
+ + "statusGet"		: "PUT THE MQTT TOPIC FOR THE GETTING THE STATUS OF YOUR SPRINKLER ACCESSORY HERE",
+ + "statusSet"		: "PUT THE MQTT TOPIC FOR THE SETTING THE STATUS OF YOUR SPRINKLER ACCESSORY HERE"
+ },
+ "onValue"		    : "OPTIONALLY PUT THE VALUE THAT MEANS ON HERE (DEFAULT true)",
+ "offValue"		    : "OPTIONALLY PUT THE VALUE THAT MEANS OFF HERE (DEFAULT false)",
+ "statusCmd"		    : "OPTIONALLY PUT THE STATUS COMMAND HERE",
+ "integerValue"	    : "OPTIONALLY SET THIS TRUE TO USE 1/0 AS VALUES",

Look for a sample config in [config.json example](https://github.com/moppi4483/homebridge-mqtt-sprinkler/blob/master/config.json)

# GET-TOPIC-Structure
{"Zeitstempel": value1, "letzteBeregnung": value2, "TagBeregnung" : value3, "Ventil": value4}
+ value1	-	Date / Time
+ value2	-	gauge of the latest sprinkler usage (mm)
+ value3	-	gauge of the last 24 hours of sprinkler usage (mm)
+ value4	-	switch-state

In case of setting changing only the state of the switch it is possible to send only the switch-state by the GET-Topic.
