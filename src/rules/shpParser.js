const TableParserAPI = require("../api/TableParserAPI");

const fs = require("fs");
const fse = require('fs-extra');


const TableRuleAPI = require('../api/TableRuleAPI');


const gdal = require('gdal');


const UnzipSingle = require('./internal/unzipSingle');
const RezipSingle = require('./internal/rezipSingle');

//using node-gdal:
// https://www.npmjs.com/package/gdal
// api: http://naturalatlas.github.io/node-gdal/classes/gdal.html

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

        this.summary = {
            processed: 0,
            output: 0
        }

    }

    _checkShape(ds) {

        var driver = ds.driver;
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
    }

    _runTableRule(layer) {


        if(!this.parserSharedData.columnNames) {
            this.parserSharedData.columnNames = [];

            layer.fields.forEach((field) => {
                this.parserSharedData.columnNames.push(field.name);
            });
        }

        if(this.wrappedRule) {
            this.wrappedRule.start(this);
        }

        function handleResponse(response, feature, updateData, isHeader) {
            if(response instanceof Promise) {
                response.then((result) => {
                    updateData(result, feature);
                    if(result && !isHeader) {
                        this.summary.output += 1;
                    }

                }, () => {
                    //rejected for some reason that should have logged
                    updateData(response, feature);
                }).catch(() => {
                    updateData(response, feature);
                })
            } else {

                updateData(response, feature);
                if(response && !isHeader) {
                    this.summary.output += 1;
                }
            }
        }

        if(this.wrappedRule && this.wrappedRule.processHeaderRows) {

            let headers = [];
            layer.fields.forEach(function(field) {
                headers.push(field.name);
            });

            handleResponse(
                this.wrappedRule.processRecordWrapper(headers, 'header', true),
                null,
                (response) => {
                    if(!arraysEqual(response, this.parserSharedData.columnNames)) {
                        this.error(`Cannot modify the header row of a shapefile`);
                    }
                },
                true
            );
        }

        layer.features.forEach((feature) => {

            this.summary.processed += 1;

            let response = feature.fields.toArray();

            if(this.wrappedRule) {
                response = this.wrappedRule.processRecordWrapper(response, feature.fid)
            }

            handleResponse(
                response,
                feature,
                (response) => {
                    if(!response) {
                        layer.features.remove(feature.fid);
                    } else {
                        if(response.length !== layer.fields.count()) {
                            this.error(`Number of values does not match fields of the shapefile for ${feature.fid}`, feature.fid);
                        } else {
                            response.forEach((value, index) => {
                                feature.fields.set(index, value);
                            })
                        }
                    }
                },
                true
            );
        });


        if(this.wrappedRule) {
            this.wrappedRule.finish();
        }
    }

    _runFeatureRule(layer) {

    }

    _runShape(inputName, outputName, resolve) {

        if(!fs.existsSync(inputName)) {
            this.error(`${inputName} does not exist.`);
            resolve();
            return;
        }

        fse.copySync(inputName, outputName, { overwrite: true });

        let ds = null;
        let layer = null;

        try {
            ds = gdal.open(outputName);

            if(ds.layers.count() > 1) {
                this.error(`Only one shapefile is supported`);
                resolve();
                return;
            }

            layer = ds.layers.get(0);

        } catch(e) {
            this.error(`Could not open shapefile: ${e}`);
            resolve();
            return;
        }

        //this._checkShape(ds);

        if(this.wrappedRule instanceof TableRuleAPI) {

            this._runTableRule(layer);
        } else {
            this.error(`Unsuportted rule type`);
            resolve();
            return;
        }

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


        return new UnzipSingle({__state: parserConfig.__state});

    }

    static getParserCleanupRule(parserConfig) {

        return new RezipSingle({__state: parserConfig.__state});

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

function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
}

module.exports = shpParser;	// Export this so derived classes can extend it.
