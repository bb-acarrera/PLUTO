const CSVRuleAPI = require("../api/CSVRuleAPI");

class CheckLatLong extends CSVRuleAPI {
	constructor(config) {
		super(config);

		this.numHeaderRows = this.config.NumberOfHeaderRows || 0;
		if (isNaN(this.numHeaderRows)) {
			this.error(`${constructor.name} configured with a non-number NumberOfHeaderRows. Got '${config.NumberOfHeaderRows}', using 0.`);
			this.numHeaderRows = 0;
		}
		else if (this.numHeaderRows < 0) {
			this.error(`${constructor.name} configured with a negative NumberOfHeaderRows. Got '${config.NumberOfHeaderRows}', using 0.`);
			this.numHeaderRows = 0;
		}

		this.latitudeColumn = undefined;
		if (!this.config.LatitudeColumn)
			this.error(`${constructor.name} configured without a LatitudeColumn property.`);
		else if (isNaN(this.config.LongitudeCLatitudeColumnolumn))
			this.error(`${constructor.name} configured with a non-number LatitudeColumn. Got '${config.LatitudeColumn}'.`);
		else
			this.latitudeColumn = this.config.LatitudeColumn;

		this.longitudeColumn = undefined;
		if (!this.config.LongitudeColumn)
			this.error(`${constructor.name} configured without a LongitudeColumn property.`);
		else if (isNaN(this.config.LongitudeColumn))
			this.error(`${constructor.name} configured with a non-number LongitudeColumn. Got '${config.LongitudeColumn}'.`);
		else
			this.longitudeColumn = this.config.LongitudeColumn;

		this.nullEpsilon = 0;
		if (!this.config.NullIslandEpsilon) {
			this.warning(`${constructor.name} configured without a NullIslandEpsilon property. Using ${this.nullEpsilon}.`);
			this.nullEpsilon = 0;
		}
		else if (isNaN(this.config.NullIslandEpsilon))
			this.error(`${constructor.name} configured with a non-number NullIslandEpsilon. Got '${config.NullIslandEpsilon}'.`);
		else if (this.config.NullIslandEpsilon < 0) {
			this.nullEpsilon = -this.config.NullIslandEpsilon;
			this.warning(`${constructor.name} configured with a negative NullIslandEpsilon. Got '${config.NullIslandEpsilon}'. Using ${this.nullEpsilon}.`);
		}
		else
			this.nullEpsilon = this.config.NullIslandEpsilon;

		this.rowNumber = 0;
		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.ReportAlways || true;	// Should every occurrence be reported?
	}

	processRecord(record) {
		if (this.latitudeColumn && this.longitudeColumn && this.rowNumber >= this.numHeaderRows) {
			if (this.column >= record.length) {
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`${constructor.name} row ${this.rowNumber} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			}
			else {
				const lat = record[this.latitudeColumn];
				const long = record[this.longitudeColumn];
				if (isNan(lat))
					this.error(`${constructor.name} latitude is not a number in row ${this.rowNumber}. Got '${lat}'.`);
				else if (lat < 0 || lat > 90)
					this.error(`${constructor.name} latitude is out of range in row ${this.rowNumber}. Got '${lat}'.`);

				if (isNan(long))
					this.error(`${constructor.name} longitude is not a number in row ${this.rowNumber}. Got '${long}'.`);
				else if (long < -180 || long > 180)
					this.error(`${constructor.name} longitude is out of range in row ${this.rowNumber}. Got '${long}'.`);

				if (Math.abs(lat) <= this.nullEpsilon && Math.abs(long) <= this.nullEpsilon)
					this.warning(`${constructor.name} found null island in row ${this.rowNumber}.`);	// Should this be enabled conditionally?

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
