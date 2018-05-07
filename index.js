module.exports = (homebridge) => {
    const { SprinklerAccessory } = require('./lib/Accessory')(homebridge);
    homebridge.registerAccessory("homebridge-mqtt-sprinkler", "mqtt-sprinkler", SprinklerAccessory);
};