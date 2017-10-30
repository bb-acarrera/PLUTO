const TableRuleAPI = require("../api/TableRuleAPI");

class CheckLatLong extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

		if (!config) {
			this.error('No configuration specified.');	// At the moment this does nothing since a config is required for reporting errors.
			return;	// Might as well give up...
		}



		this.nullEpsilon = 0.01;
		if (this.config.nullEpsilon === undefined) {
			this.warning(`Configured without a nullEpsilon property. Using ${this.nullEpsilon}.`);
			this.nullEpsilon = 0;
		}
		else if (isNaN(this.config.nullEpsilon))
			this.error(`Configured with a non-number nullEpsilon. Got '${this.config.nullEpsilon}'.`);
		else if (this.config.nullEpsilon < 0) {
			this.nullEpsilon = -this.config.nullEpsilon;
			this.warning(`Configured with a negative nullEpsilon. Got '${this.config.nullEpsilon}'. Using ${this.nullEpsilon}.`);
		}
		else
			this.nullEpsilon = this.config.nullEpsilon;

		this.checkValidColumnProperty(this.config.latitudeColumn, 'latitudeColumn');
		this.checkValidColumnProperty(this.config.longitudeColumn, 'longitudeColumn');

		if (this.config.latitudeColumn && this.config.latitudeColumn === this.config.longitudeColumn)
			this.error(`Configured with identical latitudeColumn and longitudeColumn property values.`);

		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.reportAlways || true;	// Should every occurrence be reported?
	}

	start() {
		this.latitudeColumn = this.getValidatedColumnProperty(this.config.latitudeColumn, 'latitudeColumn');
		this.longitudeColumn = this.getValidatedColumnProperty(this.config.longitudeColumn, 'longitudeColumn');
	}

	processRecord(record, rowId) {
		if (this.latitudeColumn !== undefined && this.longitudeColumn !== undefined) {
			if (this.latitudeColumn >= record.length || this.longitudeColumn >= record.length) {
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${rowId} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			}
			else {
				const lat = record[this.latitudeColumn];
				const long = record[this.longitudeColumn];
				if (isNaN(lat))
					this.error(`Latitude is not a number in row ${rowId}. Got '${lat}'.`);
				else if (lat < -90 || lat > 90)
					this.error(`Latitude is out of range in row ${rowId}. Got '${lat}'.`);

				if (isNaN(long))
					this.error(`Longitude is not a number in row ${rowId}. Got '${long}'.`);
				else if (long < -180 || long > 180)
					this.error(`Longitude is out of range in row ${rowId}. Got '${long}'.`);

				if (Math.abs(lat) <= this.nullEpsilon && Math.abs(long) <= this.nullEpsilon)
					this.warning(`Found null island in row ${rowId}.`);	// Should this be enabled conditionally?

				// TODO: Any other tests?
			}
		}

		return record;
	}

	static get ConfigProperties() {
		return this.appendConfigProperties([
			{
				name: 'latitudeColumn',
				label: 'Latitude Column',
				type: 'column',
				tooltip: 'The column label for the latitude data.'
			},
			{
				name: 'longitudeColumn',
				label: 'Longitude Column',
				type: 'column',
				tooltip: 'The column label for the longitude data.'
			},
			{
				name: 'nullEpsilon',
				label: 'Null Island Epsilon',
				type: 'float',
				minimum: '0',
				tooltip: 'The amount of error permitted around the null island test.'
			}
		]);
	}


	static get ConfigDefaults() {
		return this.appendDefaults({
			nullEpsilon: 0.01
		});
	}
}
module.exports = CheckLatLong;
