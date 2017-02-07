var Service, Characteristic, communicationError;

module.exports = function (oService, oCharacteristic, oCommunicationError) {
    Service = oService;
    Characteristic = oCharacteristic;
    communicationError = oCommunicationError;

    return HomeAssistantOccupancySensor;
};
module.exports.HomeAssistantOccupancySensor = HomeAssistantOccupancySensor;

function HomeAssistantOccupancySensor(log, data, client, service) {
	// device info
	this.data = data;
	this.entity_id = data.entity_id;
	this.uuid_base = data.entity_id;
	if (data.attributes && data.attributes.friendly_name) {
		this.name = data.attributes.friendly_name;
	} else {
		this.name = data.entity_id.split('.').pop().replace(/_/g, ' ');
	}

	this.client = client;
	this.log = log;

	this.characteristic = Characteristic.OccupancyDetected;
	this.onValue = Characteristic.OccupancyDetected.OCCUPANCY_DETECTED;
	this.offValue = Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;
}

HomeAssistantOccupancySensor.prototype = {
    onEvent(old_state, new_state) {
        this.sensorService.getCharacteristic(this.characteristic)
          .setValue(new_state.state == 'home' ? this.onValue : this.offValue, null, 'internal');
    },
    identify(callback) {
        this.log('identifying: ' + this.name);
        callback();
    },
    getState(callback) {
        this.log('fetching state for: ' + this.name);
        this.client.fetchState(this.entity_id, function(data){
            if (data) {
                callback(null, data.state == 'home' ? this.onValue : this.offValue);
            } else {
                callback(communicationError);
            }
        }.bind(this));
    },
    getServices() {
        this.sensorService = new Service.OccupancySensor();
        this.sensorService
          .getCharacteristic(this.characteristic)
          .on('get', this.getState.bind(this));

        var informationService = new Service.AccessoryInformation();

        informationService
          .setCharacteristic(Characteristic.Manufacturer, 'Home Assistant')
          .setCharacteristic(Characteristic.Model, 'Device Tracker Occupancy Sensor')
          .setCharacteristic(Characteristic.SerialNumber, this.entity_id);

        return [informationService, this.sensorService];
    }
}
