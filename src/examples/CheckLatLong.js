const CSVRuleAPI = require("../api/CSVRuleAPI");

class CheckLatLong extends CSVRuleAPI {
	constructor(config) {
		super(config);

		if (!config) {
			this.error(`${this.constructor.name} has no configuration.`);	// At the moment this does nothing since a config is required for reporting errors.
			return;	// Might as well give up...
		}

		this.numHeaderRows = 0;
		if (this.config.NumberOfHeaderRows === undefined)
			this.warning(`${this.constructor.name} configured without a 'NumberOfHeaderRows' property. Using ${this.numHeaderRows}.`);
		else if (isNaN(this.config.NumberOfHeaderRows))
			this.warning(`${this.constructor.name} configured with a non-number NumberOfHeaderRows. Got '${this.config.NumberOfHeaderRows}', using ${this.numHeaderRows}.`);
		else if (this.config.NumberOfHeaderRows < 0)
			this.warning(`${this.constructor.name} configured with a negative NumberOfHeaderRows. Got '${this.config.NumberOfHeaderRows}', using ${this.numHeaderRows}.`);
		else {
			this.numHeaderRows = Math.floor(parseFloat(this.config.NumberOfHeaderRows));
			if (!Number.isInteger(parseFloat(this.config.NumberOfHeaderRows)))
				this.warning(`${this.constructor.name} configured with a non-integer NumberOfHeaderRows. Got '${this.config.NumberOfHeaderRows}', using ${this.numHeaderRows}.`);
		}

		this.latitudeColumn = undefined;
		if (this.config.LatitudeColumn === undefined)
			this.error(`${this.constructor.name} configured without a 'LatitudeColumn' property.`);
		else if (isNaN(this.config.LatitudeColumn))
			this.error(`${this.constructor.name} configured with a non-number LatitudeColumn. Got '${this.config.LatitudeColumn}'.`);
		else if (this.config.LatitudeColumn < 0)
			this.error(`${this.constructor.name} configured with a negative LatitudeColumn. Got '${this.config.LatitudeColumn}'.`);
		else {
			this.latitudeColumn = Math.floor(parseFloat(this.config.LatitudeColumn));
			if (!Number.isInteger(parseFloat(this.config.LatitudeColumn)))
				this.warning(`${this.constructor.name} configured with a non-integer LatitudeColumn. Got '${this.config.LatitudeColumn}', using ${this.latitudeColumn}.`);
		}

		this.longitudeColumn = undefined;
		if (this.config.LongitudeColumn === undefined)
			this.error(`${this.constructor.name} configured without a 'LongitudeColumn' property.`);
		else if (isNaN(this.config.LongitudeColumn))
			this.error(`${this.constructor.name} configured with a non-number LongitudeColumn. Got '${this.config.LongitudeColumn}'.`);
		else if (this.config.LongitudeColumn < 0)
			this.error(`${this.constructor.name} configured with a negative LongitudeColumn. Got '${this.config.LongitudeColumn}'.`);
		else {
			this.longitudeColumn = Math.floor(parseFloat(this.config.LongitudeColumn));
			if (!Number.isInteger(parseFloat(this.config.LongitudeColumn)))
				this.warning(`${this.constructor.name} configured with a non-integer LongitudeColumn. Got '${this.config.LongitudeColumn}', using ${this.longitudeColumn}.`);
		}

		if (this.latitudeColumn === this.longitudeColumn)
			this.error(`${this.constructor.name} configured with identical LatitudeColumn and LongitudeColumn property values.`);

		this.nullEpsilon = 0.01;
		if (this.config.NullIslandEpsilon === undefined) {
			this.warning(`${this.constructor.name} configured without a NullIslandEpsilon property. Using ${this.nullEpsilon}.`);
			this.nullEpsilon = 0;
		}
		else if (isNaN(this.config.NullIslandEpsilon))
			this.error(`${this.constructor.name} configured with a non-number NullIslandEpsilon. Got '${this.config.NullIslandEpsilon}'.`);
		else if (this.config.NullIslandEpsilon < 0) {
			this.nullEpsilon = -this.config.NullIslandEpsilon;
			this.warning(`${this.constructor.name} configured with a negative NullIslandEpsilon. Got '${this.config.NullIslandEpsilon}'. Using ${this.nullEpsilon}.`);
		}
		else
			this.nullEpsilon = this.config.NullIslandEpsilon;

		this.rowNumber = 0;
		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.ReportAlways || true;	// Should every occurrence be reported?
	}

	processRecord(record) {
		if (this.latitudeColumn !== undefined && this.longitudeColumn !== undefined && this.rowNumber >= this.numHeaderRows) {
			if (this.latitudeColumn >= record.length || this.longitudeColumn >= record.length) {
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`${this.constructor.name}: Row ${this.rowNumber} has insufficient columns.`);
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

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {CheckLatLong}
 */
module.exports = CheckLatLong;	// Export this so derived classes can extend it.
module.exports.instance = CheckLatLong;	// Export this so the application can instantiate the class without knowing it's name.
