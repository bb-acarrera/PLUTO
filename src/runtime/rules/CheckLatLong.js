const CSVRuleAPI = require("../api/CSVRuleAPI");

class CheckLatLong extends CSVRuleAPI {
	constructor(config) {
		super(config);

		if (!config) {
			this.error('No configuration specified.');	// At the moment this does nothing since a config is required for reporting errors.
			return;	// Might as well give up...
		}

		this.numHeaderRows = this.getValidatedHeaderRows();

		this.latitudeColumn = this.getValidatedColumnProperty(this.config.latitudeColumn, 'latitudeColumn');
		this.longitudeColumn = this.getValidatedColumnProperty(this.config.longitudeColumn, 'longitudeColumn');

		if (this.latitudeColumn && this.latitudeColumn === this.longitudeColumn)
			this.error(`Configured with identical latitudeColumn and longitudeColumn property values.`);

		this.nullEpsilon = 0.01;
		if (this.config.nullIslandEpsilon === undefined) {
			this.warning(`Configured without a nullIslandEpsilon property. Using ${this.nullEpsilon}.`);
			this.nullEpsilon = 0;
		}
		else if (isNaN(this.config.nullIslandEpsilon))
			this.error(`Configured with a non-number nullIslandEpsilon. Got '${this.config.nullIslandEpsilon}'.`);
		else if (this.config.nullIslandEpsilon < 0) {
			this.nullEpsilon = -this.config.nullIslandEpsilon;
			this.warning(`Configured with a negative nullIslandEpsilon. Got '${this.config.nullIslandEpsilon}'. Using ${this.nullEpsilon}.`);
		}
		else
			this.nullEpsilon = this.config.nullIslandEpsilon;

		this.rowNumber = 0;
		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.reportAlways || true;	// Should every occurrence be reported?
	}

	processRecord(record) {
		if (this.latitudeColumn !== undefined && this.longitudeColumn !== undefined && this.rowNumber >= this.numHeaderRows) {
			if (this.latitudeColumn >= record.length || this.longitudeColumn >= record.length) {
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${this.rowNumber} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			}
			else {
				const lat = record[this.latitudeColumn];
				const long = record[this.longitudeColumn];
				if (isNaN(lat))
					this.error(`Latitude is not a number in row ${this.rowNumber}. Got '${lat}'.`);
				else if (lat < -90 || lat > 90)
					this.error(`Latitude is out of range in row ${this.rowNumber}. Got '${lat}'.`);

				if (isNaN(long))
					this.error(`Longitude is not a number in row ${this.rowNumber}. Got '${long}'.`);
				else if (long < -180 || long > 180)
					this.error(`Longitude is out of range in row ${this.rowNumber}. Got '${long}'.`);

				if (Math.abs(lat) <= this.nullEpsilon && Math.abs(long) <= this.nullEpsilon)
					this.warning(`Found null island in row ${this.rowNumber}.`);	// Should this be enabled conditionally?

				// TODO: Any other tests?
			}
		}

		this.rowNumber++;
		return record;
	}
}
module.exports = CheckLatLong;
