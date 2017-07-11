const CSVRuleAPI = require("../api/CSVRuleAPI");

class CheckLatLong extends CSVRuleAPI {
	constructor(config) {
		super(config);

		if (!config) {
			this.error('No configuration specified.');	// At the moment this does nothing since a config is required for reporting errors.
			return;	// Might as well give up...
		}

		this.numHeaderRows = 0;
		if (this.config.numberOfHeaderRows === undefined)
			this.warning(`Configured without a 'NumberOfHeaderRows' property. Using ${this.numHeaderRows}.`);
		else if (isNaN(this.config.numberOfHeaderRows))
			this.warning(`Configured with a non-number NumberOfHeaderRows. Got '${this.config.numberOfHeaderRows}', using ${this.numHeaderRows}.`);
		else if (this.config.numberOfHeaderRows < 0)
			this.warning(`Configured with a negative NumberOfHeaderRows. Got '${this.config.numberOfHeaderRows}', using ${this.numHeaderRows}.`);
		else {
			this.numHeaderRows = Math.floor(parseFloat(this.config.numberOfHeaderRows));
			if (!Number.isInteger(parseFloat(this.config.numberOfHeaderRows)))
				this.warning(`Configured with a non-integer NumberOfHeaderRows. Got '${this.config.numberOfHeaderRows}', using ${this.numHeaderRows}.`);
		}

		this.latitudeColumn = undefined;
		if (this.config.latitudeColumn === undefined)
			this.error(`Configured without a 'LatitudeColumn' property.`);
		else if (isNaN(this.config.latitudeColumn))
			this.error(`Configured with a non-number LatitudeColumn. Got '${this.config.latitudeColumn}'.`);
		else if (this.config.latitudeColumn < 0)
			this.error(`Configured with a negative LatitudeColumn. Got '${this.config.latitudeColumn}'.`);
		else {
			this.latitudeColumn = Math.floor(parseFloat(this.config.latitudeColumn));
			if (!Number.isInteger(parseFloat(this.config.latitudeColumn)))
				this.warning(`Configured with a non-integer LatitudeColumn. Got '${this.config.latitudeColumn}', using ${this.latitudeColumn}.`);
		}

		this.longitudeColumn = undefined;
		if (this.config.longitudeColumn === undefined)
			this.error(`Configured without a 'LongitudeColumn' property.`);
		else if (isNaN(this.config.longitudeColumn))
			this.error(`Configured with a non-number LongitudeColumn. Got '${this.config.longitudeColumn}'.`);
		else if (this.config.longitudeColumn < 0)
			this.error(`Configured with a negative LongitudeColumn. Got '${this.config.longitudeColumn}'.`);
		else {
			this.longitudeColumn = Math.floor(parseFloat(this.config.longitudeColumn));
			if (!Number.isInteger(parseFloat(this.config.longitudeColumn)))
				this.warning(`Configured with a non-integer LongitudeColumn. Got '${this.config.longitudeColumn}', using ${this.longitudeColumn}.`);
		}

		if (this.latitudeColumn === this.longitudeColumn)
			this.error(`Configured with identical LatitudeColumn and LongitudeColumn property values.`);

		this.nullEpsilon = 0.01;
		if (this.config.nullIslandEpsilon === undefined) {
			this.warning(`Configured without a NullIslandEpsilon property. Using ${this.nullEpsilon}.`);
			this.nullEpsilon = 0;
		}
		else if (isNaN(this.config.nullIslandEpsilon))
			this.error(`Configured with a non-number NullIslandEpsilon. Got '${this.config.nullIslandEpsilon}'.`);
		else if (this.config.nullIslandEpsilon < 0) {
			this.nullEpsilon = -this.config.nullIslandEpsilon;
			this.warning(`Configured with a negative NullIslandEpsilon. Got '${this.config.nullIslandEpsilon}'. Using ${this.nullEpsilon}.`);
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

module.exports = CheckLatLong;	// Export this so derived classes can extend it.
