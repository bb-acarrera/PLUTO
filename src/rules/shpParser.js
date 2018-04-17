const TableParserAPI = require("../api/TableParserAPI");

const fs = require("fs");
const fse = require('fs-extra');
const path = require('path');


const TableRuleAPI = require('../api/TableRuleAPI');


const gdal = require('gdal');


const UnzipSingle = require('./internal/unzipSingle');
const RezipSingle = require('./internal/rezipSingle');

const lodash = require('lodash');

//using node-gdal:
// https://www.npmjs.com/package/gdal
// api: http://naturalatlas.github.io/node-gdal/classes/gdal.html
// base GDAL api: http://www.gdal.org/annotated.html  (will often need to dig into this, node gdal uses GDAL 2.0.1)

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

        return new Promise((resovle, reject) => {
            if(!this.parserSharedData.columnNames) {
                this.parserSharedData.columnNames = [];

                layer.fields.forEach((field) => {
                    this.parserSharedData.columnNames.push(field.name);
                });
            }

            if(this.wrappedRule) {
                this.wrappedRule.start(this);
            }

            let itemsToProcessCount = 0;
            let responseCount = 0;

            let checkFinished = () => {

                if(itemsToProcessCount === responseCount) {
                    if(this.wrappedRule) {
                        this.wrappedRule.finish();
                    }
                    resovle();
                }

            };

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
                    }).then(() => {
                        responseCount++;
                        checkFinished();
                    })
                } else {

                    updateData(response, feature);
                    if(response && !isHeader) {
                        this.summary.output += 1;
                    }
                    responseCount++;
                    checkFinished();
                }
            }

            itemsToProcessCount = layer.features.count();

            if(this.wrappedRule && this.wrappedRule.processHeaderRows) {

                let headers = [];
                layer.fields.forEach(function(field) {
                    headers.push(field.name);
                });

                itemsToProcessCount += 1;

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
                                });

                                layer.features.set(feature.fid, feature);
                            }
                        }
                    },
                    true
                );
            });

            if(itemsToProcessCount === 0) {
                checkFinished();
            }

        });


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
            ds = gdal.open(outputName, "r+");

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

        this.currentLayer = layer;

        if(this.wrappedRule instanceof TableRuleAPI) {

            this._runTableRule(layer).then(()=>{},()=>{}).catch(()=>{}).then(()=>{
                this.currentLayer = null;
                layer.flush();
                ds.flush();
                ds.close();
                layer = null;
                ds = null;
                resolve();
            })
        } else {
            this.error(`Unsuportted rule type`);
            this.currentLayer = null;
            ds.close();
            resolve();
        }
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

    addColumn(columnName) {

        let newColumnIndex = super.addColumn(columnName);

        if(this.currentLayer) {
            let ret = this.currentLayer.fields.add(new gdal.FieldDefn(columnName, gdal.OFTString));
        }

        return newColumnIndex;
    }

    removeColumn(columnIndex) {
       super.removeColumn(columnIndex);

        if(this.currentLayer) {
            this.currentLayer.fields.remove(columnIndex);
        }

    }

    static getParserSetupRule(parserConfig) {


        return new UnzipSingle({__state: parserConfig.__state});

    }

    static getParserCleanupRule(parserConfig) {

        let config = {__state: parserConfig.__state};
        let importConfigFilename = lodash.get(parserConfig, ['__state','validator','currentRuleset','export','config','file']);

        if(parserConfig.renameZipContentsToUpload && importConfigFilename) {
            config.contentsFilename = path.basename(importConfigFilename, path.extname(importConfigFilename));
        }

        return new RezipSingle(config);

    }

    get ParserClassName() {
        return "shpParser";
    }

    static get Type() {
        return ["table_parser", "shpParser"];
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
            },
            {
                name: 'renameZipContentsToUpload',
                label: 'Rename zip file content filenames to match upload filename',
                type: 'boolean',
                tooltip: 'If checked and if the shapefile is in a zip file, the names of the files inside the zip file will be renamed to match the upload filename.'
            }
        ];
    }


    static get ConfigDefaults() {
        return {};
    }

    static get Descriptions() {
        return {
            title: 'Shapefile Parser'
        }
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
