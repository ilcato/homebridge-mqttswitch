const { MQTTClient } = require('./MQTTClient');

let Service;
let Characteristic;
let homebridgeAPI;

class SprinklerAccessory {
    constructor(log, config) {
      this.log = log;
      this.config = config;
      this.displayName = config.name;
      this.serialNumber = config.serialNumber;
      this.topicSend = config.topics.topicSend;

      this.firstCall = true;

      this.startTime = 0;
      this.duration = 600;
      this.remainingDuration = -99;
      this.isActive = 0;
      this.isInUse = 0;
      this.isIsConfigured = 0;
  

      this.mqtt = new MQTTClient(this.config);
      this.mqtt.on('setData', (data) => {
        this.log(`[${this.displayName}] setData: ${data}`);

        var splitData = String(data).split(',');

        this.refreshNewData(splitData[2], splitData[1]);
      });

      this.mqtt.on('error', (error) => {
        this.log.error(error);
      });

      this.mqtt.on('connected', () => {
        this.log.debug('Initialized accessory');
      });

      this.informationService = this.getInformationService();
      this.sprinklerService = this.getSprinklerService();
    }

  
    refreshNewData(laufzeit, status) {
      this.log.debug("refreshNewData - Status: " + status + "; Laufzeit: " + laufzeit);
      if (laufzeit !== this.duration) {
        this.sprinklerService.getCharacteristic(Characteristic.SetDuration).setValue(laufzeit, undefined);
      }

      if (status !== this.isActive) {
        this.sprinklerService.getCharacteristic(Characteristic.Active).setValue(status, undefined, "mqtt");
      }

      if (status !== this.isIsConfigured) {
        this.sprinklerService.getCharacteristic(Characteristic.IsConfigured).setValue(status, undefined, "mqtt");
      }

      if (status !== this.isInUse) {
        this.sprinklerService.getCharacteristic(Characteristic.InUse).setValue(status, undefined);
      }
    }

    hasTimedOut() {
      if (this.timeout === 0) {
        return false;
      }
      if (this.lastUpdatedAt == null) {
        return false;
      }
      const timeoutMilliseconds = 1000 * 60 * this.timeout;
      const timedOut = this.lastUpdatedAt <= (Date.now() - timeoutMilliseconds);
      if (timedOut) {
        this.log.warn(`[${this.config.address}] Timed out, last update: ${this.lastUpdatedISO8601}`);
      }
      return timedOut;
    }

    onCharacteristicGetValue(callback, value) {
      if (value == null) {
        callback(new Error('Undefined characteristic value'));
      } else {
        callback(null, value);
      }
    }
  
    getSprinklerService() {
      const sprinklerService = new Service.Valve(this.displayName);
      /*sprinklerService
        .setCharacteristic(Characteristic.ValveType, 1)
        .setCharacteristic(Characteristic.RemainingDuration,-99)
        .setCharacteristic(Characteristic.SetDuration,this.sprinklerDuration);*/

      sprinklerService.setCharacteristic(Characteristic.ValveType, Characteristic.ValveType.IRRIGATION);
      sprinklerService.getCharacteristic(Characteristic.SetDuration).setValue(this.duration, undefined);
      sprinklerService.getCharacteristic(Characteristic.Active).setValue(this.isActive, undefined, "mqtt");
      sprinklerService.getCharacteristic(Characteristic.InUse).setValue(this.isInUse, undefined);


      sprinklerService.getCharacteristic(Characteristic.IsConfigured)
        .on('get', this.getIsConfigured.bind(this))
        .on('set', this.setIsConfigured.bind(this))
        .updateValue(this.isIsConfigured, undefined, undefined);

      sprinklerService.getCharacteristic(Characteristic.ValveType)
        .on('get', this.getValveType.bind(this));
    
      sprinklerService.getCharacteristic(Characteristic.SetDuration)
        .on('get', this.getSetDuration.bind(this))
        .on('set', this.setSetDuration.bind(this))
        .updateValue(this.duration, undefined, undefined);

      sprinklerService.getCharacteristic(Characteristic.RemainingDuration)
        .on('get', this.getRemainingDuration.bind(this));

      sprinklerService.getCharacteristic(Characteristic.Active)
        .on('get', this.getActive.bind(this))
        .on('set', this.setActive.bind(this))
        .updateValue(this.isActive, undefined, undefined);

      sprinklerService.getCharacteristic(Characteristic.InUse)
        .on('get', this.getInUse.bind(this))
        .on('set', this.setInUse.bind(this))
        .updateValue(this.isInUse, undefined, undefined);
          /*function(callback) {
          that.log.debug('get Active')
          that.query("STATE",function(value){
            let hmState = ((value=='true') || (value==true)) ? 1 : 0;
            if (callback) callback(null,hmState);
          });
        }.bind(this))
      
        .on('set', function(value, callback) {
          that.isInUse = value;
          callback();
        }.bind(this))*/

      return sprinklerService;
    }
  
    getIsConfigured(callback) {
      this.log.debug("getIsConfigured: " + this.isIsConfigured);
      callback(null,this.isIsConfigured);
    }

    setIsConfigured(value,callback,emitter) {
      this.log.debug("setIsConfigured: " + value);
      if (emitter !== "mqtt") {
        var nodeRed = "set," + value + "," + this.duration;
        this.log.debug("setIsConfigured - Sende Befehl an NodeRed " + nodeRed);
        this.mqtt.mqtt.publish(this.topicSend, nodeRed);
      }
      this.isIsConfigured = value;
      callback();
    }

    getValveType(callback) {
      this.log.debug("getValveType: " + Characteristic.ValveType.IRRIGATION);
      callback(null,Characteristic.ValveType.IRRIGATION);
    }

    getSetDuration(callback) {
      this.log.debug("getSetDuration: " + this.duration);
      callback(null, this.duration);
    }

    setSetDuration(value, callback) {
      this.log.debug("setSetDuration: " + value);
      this.duration = value;
      callback();
    }

    getRemainingDuration(callback) {
      let value = 0;
      
      if(this.isActive === 1) {
        let now = new Date();
        value = (this.startTime.getTime() - now.getTime()) / 1000 + this.duration;
      } else {
        value = this.remainingDuration;
      }

      this.log.debug("getRemainingDuration: " + value);
      callback(null, value);
    }

    getActive(callback) {
      this.log.debug("getActive: " + this.isActive);
      callback(null,this.isActive);
    }

    setActive(on, callback, emitter) {
      this.log.debug("setActive: " + on);
      switch (emitter) {
        case "mqtt":
          this.log.debug("Verarbeite Befehl von NodeRed");
          this.log.debug("Setting switch to " + on);

          let duration = 0;

          if (on === 1) {
            duration = this.sprinklerDuration;
            this.startTime = new Date();
            this.isActive = 1;
          } else {
            this.startTime = 0;
            this.isActive = 0;
          }

          this.log("sprinklerduration " + duration);

          setTimeout(function() {
            this.sprinklerService
              .setCharacteristic(Characteristic.InUse, on)
              .setCharacteristic(Characteristic.RemainingDuration, duration);
              //.setCharacteristic(Characteristic.Active, on);
          }.bind(this), 1000);
          break;

        default:
          setTimeout(function() {  
            this.isInUse = 0;
            this.isActive = 0;
            this.sprinklerService.getCharacteristic(Characteristic.IsConfigured).setValue(on, undefined);
          }.bind(this), 5000);
      }
      callback();
    }

    getInUse(callback) {
      this.log.debug("getInUse: " + this.isInUse);
      callback(null,this.isInUse);
    }

    setInUse(value, callback, emitter) {
      this.log.debug("setInUse: " + value);
      this.isInUse = value;
      callback();
    }
    
    getServices() {
      const services = [
        this.informationService,
        this.sprinklerService
      ];
      return services.filter(Boolean);
    }

    getInformationService() {
      const accessoryInformation = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'moppi4483')
        .setCharacteristic(Characteristic.Model, 'Sprinkler-Valve')
        .setCharacteristic(Characteristic.FirmwareRevision, "0.9.0");
      if (this.serialNumber != null) {
        accessoryInformation.setCharacteristic(Characteristic.SerialNumber, this.serialNumber);
      }
      return accessoryInformation;
    }
  }

  module.exports = (homebridge) => {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridgeAPI = homebridge;
    return { SprinklerAccessory };
  };