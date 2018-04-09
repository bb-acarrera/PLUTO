const TableParserAPI = require("../api/TableParserAPI");

const fs = require("fs");
const parse = require('csv-parse');
const stringify = require('csv-stringify');
const transform = require('stream-transform');
const fse = require('fs-extra');

const DeleteColumn = require('./internal/DeleteInternalColumn');
const AddRowIdColumn = require('./internal/AddRowIdColumn');

const gdal = require('gdal');

//using node-gdal:
// https://www.npmjs.com/package/gdal
// api: http://naturalatlas.github.io/node-gdal/classes/gdal.html

const trackingColumnName = '____trackingRowId___internal___';

/**

 */
class shpParser extends TableParserAPI {
    /**
     * Derived classes must call this from their constructor.
     * @constructor
     * @param config {object} the config object passed into the derived class's constructor.
     * @param tableRuleClass {TableRuleAPI class} the rule class for the parser to execute
     * @param tableRuleConfig {object} the configuration to instantiate an instance of tableRuleClass
     */
    constructor(config, tableRuleClass, tableRuleConfig) {
        super(config, tableRuleClass, tableRuleConfig);

        if(!this.parserSharedData._internalColumns) {
            this.parserSharedData._internalColumns = [];
        }

        this.summary = {
            processed: 0,
            output: 0
        }

    }

    _runShape(inputName, outputName, resolve) {

        if(!fs.existsSync(inputName)) {
            this.error(`${inputName} does not exist.`);
        }

        var ds = gdal.open(inputName);

        var driver = ds.driver;
        var driver_metadata = driver.getMetadata();
        if (driver_metadata['DCAP_VECTOR'] !== 'YES') {
            console.error('Source file is not a vector');
            process.exit(1);
        }

        console.log('Driver = ' + driver.description);
        console.log('');

        // layers
        var i = 0;
        console.log('Layers: ');
        ds.layers.forEach(function(layer) {
            console.log((i++) + ': ' + layer.name);

            console.log('  Geometry Type = ' + gdal.Geometry.getName(layer.geomType));
            console.log('  Spatial Reference = ' + (layer.srs ? layer.srs.toWKT() : 'null'));

            var extent = layer.getExtent();
            console.log('  Extent: ');
            console.log('    minX = ' + extent.minX);
            console.log('    minY = ' + extent.minY);
            console.log('    maxX = ' + extent.maxX);
            console.log('    maxY = ' + extent.maxY);

            console.log('  Fields: ');
            layer.fields.forEach(function(field) {
                console.log('    -' + field.name + ' (' + field.type + ')');
            });

            console.log('  Feature Count = ' + layer.features.count());
        });

        fse.copySync(inputName, outputName, { overwrite: true });

        resolve();
    }

    run() {
        return new Promise((resolve, reject) => {

            let outputFile = this.outputFile;

            let finished = () => {
                resolve(this.asFile(outputFile));
            };

            let inputName = this.inputFile;
            if (inputName instanceof Promise) {
                inputName.then((filename) => {
                    this._runShape(filename, outputFile, finished);
                }, (error) => {
                    reject(error);
                });
            }
            else
                this._runShape(inputName, outputFile, finished);

        });
    }

    static getParserSetupRule(parserConfig) {

        /*
        const config = Object.assign({}, parserConfig, {
            newColumn : trackingColumnName
        });

        return new CSVParser(parserConfig, AddRowIdColumn, config);
        */
        return null;

    }

    static getParserCleanupRule(parserConfig) {

        /*
        const config = Object.assign({}, parserConfig, {
            column : trackingColumnName
        });

        return new CSVParser(parserConfig, DeleteColumn, config);
        */
        return null;
    }


    get internalColumns() {
        return this.parserSharedData._internalColumns;
    }

    addInternalColumn(columnName) {

        let newColumnIndex = this.addColumn(columnName);

        if (newColumnIndex != null) {
            this.parserSharedData._internalColumns.push({columnName: columnName, index: newColumnIndex});
        }

        return newColumnIndex;
    }

    removeInternalColumn(columnIndex) {
        this.removeColumn(columnIndex);

        let index = this.parserSharedData._internalColumns.length - 1;
        while (index >= 0) {
            if (this.parserSharedData._internalColumns[index].index === columnIndex) {
                this.parserSharedData._internalColumns.splice(index, 1);
            }
            index -= 1;
        }
    }

    get ParserClassName() {
        return "shpParser";
    }

    static get Type() {
        return ["table_parser", "CSVParser"];
    }

    static get ConfigProperties() {
        return [
            {
                name: 'columnNames',
                label: 'Column names',
                type: 'list',
                tooltip: 'The names of the columns; used for column selection in rules. Expects a comma separated list (e.g. "Company, Address, City, State, Country"), and can be copied directly from the header of the CSV.',
				validations: [
					{
						length: {
							min: 1
						}
					}
				]
            }
        ];
    }


    static get ConfigDefaults() {
        return {};
    }

}

module.exports = shpParser;	// Export this so derived classes can extend it.
