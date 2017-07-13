// MQTT Sprinkler Accessory plugin for HomeBridge
//
// Remember to add accessory to config.json. Example:
// "accessories": [
//         {
//             "accessory"		    : "mqtt-sprinkler",
//             "name"			    : "PUT THE NAME OF YOUR SWITCH HERE",
//             "url"			    : "PUT URL OF THE BROKER HERE",
//             "username"		    : "OPTIONALLY PUT USERNAME OF THE BROKER HERE",
//             "password"		    : "OPTIONALLY PUT PASSWORD OF THE BROKER HERE",
//             "qos"		        : "QOS OF THE MESSAGES (DEFAULT 0)",
//             "caption"		    : "OPTIONALLY PUT THE LABEL OF YOUR SWITCH HERE",
//             "serialNumberMAC"	: "OPTIONALLY PUT THE LABEL OF YOUR SWITCH HERE",
//             "topics"		    : {
//                 "statusGet"		: "PUT THE MQTT TOPIC FOR THE GETTING THE STATUS OF YOUR SPRINKLER ACCESSORY HERE",
//                 "statusSet"		: "PUT THE MQTT TOPIC FOR THE SETTING THE STATUS OF YOUR SPRINKLER ACCESSORY HERE"
//             },
//             "onValue"		    : "OPTIONALLY PUT THE VALUE THAT MEANS ON HERE (DEFAULT true)",
//             "offValue"		    : "OPTIONALLY PUT THE VALUE THAT MEANS OFF HERE (DEFAULT false)",
//             "statusCmd"		    : "OPTIONALLY PUT THE STATUS COMMAND HERE",
//             "integerValue"	    : "OPTIONALLY SET THIS TRUE TO USE 1/0 AS VALUES",
//         }
//     ]
//
// When you attempt to add a device, it will ask for a "PIN code".
// The default code for all HomeBridge accessories is 031-45-154.

'use strict';

var Service, Characteristic;

var inherits = require('util').inherits;
var mqtt = require("mqtt");
var bkService;



module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  fixInheritance(BeregnungsanlageAccessory.BKLetzteBeregnungDatum, Characteristic);
  fixInheritance(BeregnungsanlageAccessory.BKLetzteBeregnungMenge, Characteristic);
  fixInheritance(BeregnungsanlageAccessory.BKLetzte24hBeregnungMenge, Characteristic);

  homebridge.registerAccessory("homebridge-mqtt-sprinkler", "mqtt-sprinkler", BeregnungsanlageAccessory);
}

// Necessary because Accessory is defined after we have defined all of our classes
function fixInheritance(subclass, superclass) {
    var proto = subclass.prototype;
    inherits(subclass, superclass);
    subclass.prototype.parent = superclass.prototype;
    for (var mn in proto) {
        subclass.prototype[mn] = proto[mn];
    }
}


BeregnungsanlageAccessory.BKLetzteBeregnungDatum = function() {
	Characteristic.call(this, 'zuletzt Aktiv', '00001001-0000-1000-8000-775D67EC4111');
	this.setProps({
		format: Characteristic.Formats.STRING,
		perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
	});
	this.value = this.getDefaultValue();
};

BeregnungsanlageAccessory.BKLetzteBeregnungMenge = function() {
	Characteristic.call(this, 'Menge (letzte Aktivität)', '00001001-0000-1000-8000-775D67EC4112');
	this.setProps({
		format: Characteristic.Formats.FLOAT,
		unit: "mm",
		maxValue: 1000,
		minValue: 0,
		minStep: 0.01,
		perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
	});
	this.value = this.getDefaultValue();
};

BeregnungsanlageAccessory.BKLetzte24hBeregnungMenge = function() {
	Characteristic.call(this, 'Menge (letzter Tag)', '00001001-0000-1000-8000-775D67EC4113');
	this.setProps({
		format: Characteristic.Formats.FLOAT,
		unit: "mm",
		maxValue: 1000,
		minValue: 0,
		minStep: 0.01,
		perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
	});
	this.value = this.getDefaultValue();
};


function BeregnungsanlageAccessory(log, config) {
    this.log 				= log;
	this.name 				= config["name"] || "Beregnungskreis";
  	this.manufacturer 		= "moppi4483";
	this.model 				= "Eigenbau";
	this.serialNumber 		= "0001";
	this.serialNumberMAC 	= config['serialNumberMAC'] || "";
	this.publish_options 	= {
		qos: ((config["qos"] !== undefined)? config["qos"]: 0)
								};
	
	this.caption			= config["caption"];
    this.url				= config['url'];
	this.client_Id 			= 'mqttjs_' + Math.random().toString(16).substr(2, 8);
	this.options 			= {
	    keepalive			: 10,
    	clientId			: this.client_Id,
	    protocolId			: 'MQTT',
    	protocolVersion		: 4,
    	clean				: true,
    	reconnectPeriod		: 1000,
    	connectTimeout		: 30 * 1000,
		will				: {
			topic	: 'WillMsg',
			payload	: 'Connection Closed abnormally..!',
			qos		: 0,
			retain	: false
		},
	    username			: config["username"],
	    password			: config["password"],
    	rejectUnauthorized	: false
	};

	this.topicStatusGet		= config["topics"].statusGet;
	this.topicStatusSet		= config["topics"].statusSet;
	this.statusCmd 			= config["statusCmd"];
	
    
    
    this.informationService = new Service.AccessoryInformation();
	this.informationService
		.setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.Manufacturer, "moppi4483")
        .setCharacteristic(Characteristic.Model, "Eigenbau")
        .setCharacteristic(Characteristic.SerialNumber, "0001");
        
    this.onValue = (config["onValue"] !== undefined) ? config["onValue"]: "true";
    this.offValue = (config["offValue"] !== undefined) ? config["offValue"]: "false";
	if (config["integerValue"]) {
		this.onValue = "1";
		this.offValue = "0";
	}

    this.switchStatus = false;  
        
    this.bkService = new Service.Switch(this.name);
    this.bkService
    	.getCharacteristic(Characteristic.On)
    	.on('get', this.getStatus.bind(this))
    	.on('set', this.setStatus.bind(this));
                
    this.bkService.addCharacteristic(BeregnungsanlageAccessory.BKLetzteBeregnungDatum);
  	this.bkService.addCharacteristic(BeregnungsanlageAccessory.BKLetzteBeregnungMenge);
  	this.bkService.addCharacteristic(BeregnungsanlageAccessory.BKLetzte24hBeregnungMenge);


	// connect to MQTT broker
	this.client = mqtt.connect(this.url, this.options);
	var that = this;
	
	this.client.on('error', function () {
		that.log('Error event on MQTT');
	});

	this.client.on('message', function (topic, message) {
		that.log(this.name, " -  New Message");
		if (topic == that.topicStatusGet) {
			var ventil = "";
			
			if (message.toString() == that.onValue || message.toString() == that.offValue) {
				ventil = message.toString();
			} else {
				var msgJSON = JSON.parse(message.toString());
			
				var zeitstempel = msgJSON.Zeitstempel;
				var letzteBeregnung = msgJSON.letzteBeregnung;
				var tagBeregnung = msgJSON.TagBeregnung;
			
				if (zeitstempel !== undefined) {
					that.bkService.setCharacteristic(BeregnungsanlageAccessory.BKLetzteBeregnungDatum, msgJSON.Zeitstempel);
				}
				
				if (letzteBeregnung !== undefined) {
					that.bkService.setCharacteristic(BeregnungsanlageAccessory.BKLetzteBeregnungMenge, msgJSON.letzteBeregnung);
				}
			
				if (tagBeregnung !== undefined) {
					that.bkService.setCharacteristic(BeregnungsanlageAccessory.BKLetzte24hBeregnungMenge, msgJSON.TagBeregnung);
				}
					ventil = msgJSON.Ventil;
			}
			
			if (ventil == that.onValue || ventil == that.offValue) {
			    that.switchStatus = (ventil == that.onValue) ? true : false;
		   	    that.bkService.getCharacteristic(Characteristic.On).setValue(that.switchStatus, undefined, 'fromSetValue');
		   	 }
		}
	});
    this.client.subscribe(this.topicStatusGet);
}


BeregnungsanlageAccessory.prototype.getStatus = function(callback) {
    if (this.statusCmd !== undefined) {
    	this.client.publish(this.topicStatusSet, this.statusCmd, this.publish_options);
    }
    callback(null, this.switchStatus);
};
	
BeregnungsanlageAccessory.prototype.setStatus = function(status, callback, context) {
	if(context !== 'fromSetValue') {
		this.switchStatus = status;
	   	this.client.publish(this.topicStatusSet, status ? this.onValue : this.offValue, this.publish_options);
	}
	callback();
};
	
BeregnungsanlageAccessory.prototype.getServices = function () {
	return [this.informationService, this.bkService];
};