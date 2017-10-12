const fs = require( 'fs-extra' );
const path = require( "path" );

const Util = require( "./Util" );
const RuleSet = require( "../validator/RuleSet" );
const DB = require( "./db" );
const ErrorHandlerAPI = require( '../api/errorHandlerAPI' );
const moment = require('moment');


class data {
    constructor ( config ) {
        this.config = config || {};

        this.db = DB( this.config );


        this.runsLimit = 50;
        this.rulesetLimit = 50;
        this.logLimit = 50;

        let schemaName = config.dbSchema || 'pluto';
        if ( schemaName.length > 0 ) {
            schemaName = schemaName + '.';
        }

        this.tables = {
            runs: schemaName + 'runs',
            rulesets: schemaName + 'rulesets',
            currentRuleset: schemaName + '"currentRuleset"'
        }
    }

    end() {
        this.db.end();
    }

    /**
     * This method is used by the application to get an in-memory copy of a log file managed by
     * the plugin.
     * @param id {string} the id of the log file to retrieve.
     * @returns {Promise} resolves {object} the contents of the log file.
     * @throws Throws an error if the copy cannot be completed successfully.
     */
    getLog ( id, page, size, ruleid, type ) {

        if ( !size ) {
            size = this.logLimit;
        }

        let offset;
        if ( !page ) {
            offset = 0;
        } else {
            offset = (page - 1) * size;
        }

        if ( type && type.length === 0 ) {
            type = null;
        }
        if ( ruleid && ruleid.length === 0 ) {
            ruleid = null;
        }

        return new Promise( ( resolve, reject ) => {
            this.db.query( updateTableNames( "SELECT log FROM {{runs}} where id = $1", this.tables ), [ id ] )
                .then( ( result ) => {

                    if ( result.rows.length > 0 ) {

                        let log = result.rows[0].log;

                        if(!log) {
                            log = [];
                        }

                        let logResp = [];
                        let resultMap = {};
                        let filteredLog;
                        let filter, rowRuleId;

                        if ( type || ruleid ) {
                            filteredLog = [];
                            filter = true;
                        } else {
                            filteredLog = log;
                            filter = false;
                        }

                        log.forEach( function ( value ) {

                            if ( !value.ruleID ) {
                                rowRuleId = "global";
                            } else {
                                rowRuleId = value.ruleID;
                            }

                            if ( !resultMap[ rowRuleId ] ) {
                                resultMap[ rowRuleId ] = {
                                    err: false,
                                    warn: false
                                };
                            }
                            if ( value.type == 'Error' ) {
                                resultMap[ rowRuleId ].err = true;
                            }
                            if ( value.type == 'Warning' ) {
                                resultMap[ rowRuleId ].warn = true;
                            }

                            if ( filter ) {
                                if ( (!type || type == value.type) && (!ruleid || rowRuleId == ruleid ) ) {
                                    filteredLog.push( value );
                                }
                            }
                        } );


                        if ( filteredLog.length < size ) {
                            if ( offset != 0 ) {
                                logResp = [];
                            } else {
                                logResp = filteredLog;
                            }
                        } else {
                            logResp = filteredLog.splice( offset, size );
                        }

                        resolve( {
                            logs: logResp,
                            rowCount: filteredLog.length,
                            pageCount: Math.ceil( filteredLog.length / size ),
                            ruleStates: resultMap
                        } );
                    } else {
                        resolve( null );
                    }

                }, ( error ) => {
                    reject( error );
                } );
        } );
    }

    /**
     * This method is used by the application to get an in-memory copy of a run managed by
     * the plugin.
     * @param id {string} the name of the run file to retrieve.
     * @returns {Promise} resolves {object} the contents of the run file.
     */
    getRun ( id ) {
        return new Promise( ( resolve, reject ) => {

            let query = getRunQuery(this.tables) + updateTableNames(" WHERE {{runs}}.id = $1", this.tables);

            this.db.query( query, [ id ] )
                .then( ( result ) => {

                    if ( result.rows.length > 0 ) {
                        resolve( getRunResult( result.rows[ 0 ] ) );
                    } else {
                        resolve( null );
                    }

                }, ( error ) => {
                    reject( error );
                } );

        } );
    }

    /**
     * This method is used by the application to get an in-memory copy of all runs managed by
     * the plugin.
     * @returns {Promise} resolves {array} list of the runs.
     */
    getRuns ( page, size, filters = {} ) {

        let offset;

        if ( !size ) {
            size = this.runsLimit;
        }

        if ( !page ) {
            offset = 0;
        } else {
            offset = (page - 1) * size;
        }


        return new Promise( ( resolve, reject ) => {

            let where = "", countWhere = "", rulesetWhere = "", filenameWhere = "";

            let values = [ size, offset ];
            let countValues = [];

            function extendWhere() {
                if ( where.length === 0 ) {
                    where = "WHERE ";
                    countWhere = "WHERE ";
                } else {
                    where += " AND ";
                    countWhere += " AND ";
                }
            }

            if(!filters.showErrors || !filters.showWarnings || !filters.showNone) {

                let errorsWhere = '';

                if(filters.showErrors) {
                    errorsWhere += "{{runs}}.num_errors > 0";
                }

                if(filters.showWarnings) {
                    if(errorsWhere.length > 0) {
                        errorsWhere += " OR "
                    }

                    errorsWhere += "{{runs}}.num_warnings > 0";
                }

                if ( filters.showNone ) {
                    if(errorsWhere.length > 0) {
                        errorsWhere += " OR "
                    }
                    errorsWhere += "({{runs}}.num_errors = 0 AND {{runs}}.num_warnings = 0)"

                }

                extendWhere();

                if(errorsWhere.length == 0) {
                    errorsWhere += 'FALSE';
                }

                where += '(' + errorsWhere + ')';
                countWhere = where;

            }

            if ( filters.rulesetFilter && filters.rulesetFilter.length ) {
                rulesetWhere = safeStringLike( filters.rulesetFilter );

                extendWhere();

                values.push( rulesetWhere );
                where += "{{rulesets}}.ruleset_id ILIKE $" + values.length;

                countValues.push( rulesetWhere );
                countWhere += "{{rulesets}}.ruleset_id ILIKE $" + countValues.length;

            }

            if ( filters.filenameFilter && filters.filenameFilter.length > 0 ) {
                filenameWhere = safeStringLike( filters.filenameFilter );

                extendWhere();

                values.push( filenameWhere );
                where += "inputfile ILIKE $" + values.length;

                countValues.push( filenameWhere );
                countWhere += "inputfile ILIKE $" + countValues.length;

            }

            if(filters.dateFilter) {
                extendWhere();

                values.push( moment.utc(filters.dateFilter) );
                where += "CAST(finishtime AS DATE) = CAST($" + values.length + " AS DATE)";

                countValues.push( filters.dateFilter );
                countWhere += "CAST(finishtime AS DATE) = CAST($" + countValues.length + "AS DATE)";
            }

            let runSQL = getRunQuery( this.tables ) + " " + updateTableNames( where, this.tables ) +
                " ORDER BY finishtime DESC NULLS LAST LIMIT $1 OFFSET $2";

            let runsQuery = this.db.query( runSQL, values );

            let countSQL = updateTableNames( "SELECT count(*) FROM {{runs}} " +
                "LEFT OUTER JOIN {{rulesets}} ON {{runs}}.ruleset_id = {{rulesets}}.id " + countWhere, this.tables );

            let countQuery = this.db.query( countSQL, countValues );

            Promise.all( [ runsQuery, countQuery ] ).then( ( values ) => {

                let result = values[ 0 ];
                let countResult = values[ 1 ];

                let rowCount = countResult.rows[ 0 ].count;
                let pageCount = Math.ceil( rowCount / size );

                let runs = [];
                result.rows.forEach( ( row ) => {

                    let run = getRunResult( row );

                    if(run.id) {
                        runs.push( run );
                    }

                } );

                resolve( {
                    runs: runs,
                    rowCount: rowCount,
                    pageCount: pageCount
                } );

            }, ( error ) => {
                console.log('Error with query: ' + runSQL);
                reject( error );
            } );

        } );
    }

    createRunRecord ( ruleSetID ) {

        return new Promise((resolve, reject) => {

            this.db.query(updateTableNames("SELECT id FROM {{currentRuleset}} WHERE ruleset_id = $1", this.tables),
                [ruleSetID]).then((result) => {

                let rulesetId = null;
                if (result.rows.length > 0) {
                    rulesetId = result.rows[0].id
                }

                let date = new Date();

                this.db.query(updateTableNames("INSERT INTO {{runs}} (ruleset_id, starttime, finishtime) " +
                        "VALUES($1, $2, $3) RETURNING id", this.tables),
                    [rulesetId, date, date])
                    .then((result) => {
                        resolve(result.rows[0].id);
                    }, (error) => {
                        console.log(error);
                        reject(error);
                    });

            }, (error) => {
                console.log(error);
                reject(error);
            });
        });
    }

    /**
     * This method saves record which is used by the client code to reference files for any particular run.
     * @param runId the unique ID of the run.
     * @param log the log
     * @param ruleSetId the id of the ruleset
     * @param inputFile the name of the input file
     * @param outputFile the name of the output file
     */
     saveRunRecord(runId, log, ruleSetID, inputFile, outputFile, logCounts) {

        return new Promise((resolve, reject) => {
            let numErrors = logCounts[ErrorHandlerAPI.ERROR] || 0;
        	let numWarnings = logCounts[ErrorHandlerAPI.WARNING] || 0;

        	this.db.query(updateTableNames("UPDATE {{runs}} SET " +
        	    "inputfile = $2, outputfile = $3, finishtime = $4, log = $5, num_errors = $6, num_warnings = $7  " +
            	"WHERE id = $1", this.tables),
            	[runId, inputFile, outputFile, new Date(), JSON.stringify(log), numErrors, numWarnings])
            	.then(() => {
            		resolve();
            	}, (error) => {
                	console.log(error);
                	reject(error);
            	});
        });

    }

    /**
     * Retrieve a ruleset description.
     * @param ruleset the name of the ruleset or a ruleset (which is then just returned).
     * @param rulesetOverrideFile the filename of an override file to apply to the ruleset
     * @return a promise to an object describing a ruleset.
     */
    retrieveRuleset ( ruleset_id, rulesetOverrideFile, version, dbId ) {

        return getRuleset( this.db, ruleset_id, version, dbId, this.tables, ( result, resolve, reject ) => {
            if ( result.rows.length > 0 ) {
                let dbRuleset = result.rows[ 0 ].rules;

                // PJT 17/09/01 - Unfortunately at the moment there are three senses for an ID on a ruleset.
                // They are the database row number, the "filename" (which till now has also been the "id")
                // and the "ruleset_id". We want to simplify this to just two, the database row number (henceforth
                // the "id") which uniquely identifies a ruleset by ruleset_id & version, and the ruleset_id which
                // excludes the version (and will eventually be used to get the most up-to-date version of a ruleset.)
                // Here we get rid of the sense that the id is the same as the filename and instead make it the
                // same as the database row.
                dbRuleset.id = result.rows[ 0 ].id;

                dbRuleset.filename = ruleset_id;
                dbRuleset.name = dbRuleset.name || ruleset_id;
                let ruleset = new RuleSet( dbRuleset );

                if ( rulesetOverrideFile && typeof rulesetOverrideFile === 'string' ) {
                    ruleset.applyOverride( rulesetOverrideFile );
                }

                resolve( ruleset );

            } else {
                resolve( null );
            }
        } );

    }

    rulesetExists(ruleset_id) {
        return getRuleset(this.db, ruleset_id, null, null, this.tables, (result, resolve, reject) => {
            if(result.rows.length > 0) {
               resolve(true);
            } else {
                resolve( false );
            }
        } );
    }

    /**
     * This file saves the given ruleset to the database
     * @param ruleset the ruleset to write.
     * @private
     */
    saveRuleSet ( ruleset ) {

        return new Promise( ( resolve, reject ) => {

            let name = ruleset.filename;

            this.db.query(
                updateTableNames("SELECT max(version) as version FROM {{rulesets}} WHERE ruleset_id = $1", this.tables),
                [name])
                .then((result) => {
                    let qry;
                    let version = 0;
                    if(result.rows.length > 0) {
                        version = result.rows[0].version + 1;
                    }

                    qry = this.db.query(updateTableNames("INSERT INTO {{rulesets}} (ruleset_id, name, version, rules) " +
                            "VALUES($1, $2, $3, $4) RETURNING id", this.tables),
                        [ruleset.filename, ruleset.name, version, JSON.stringify(ruleset)]);

                    qry.then(() => {
                        resolve(name);
                    }, (error) => {
                        reject(error)
                    });

                }, (error) => {
                    console.log(error);
                    reject(error);
                })
                .catch((error) => {
                    console.log(error);
                    reject(error);
                });
        });


    }

    /**
     * This deletes the given ruleset from the database
     * @param ruleset the ruleset to delete.
     * @private
     */
    deleteRuleSet ( ruleset ) {

        return new Promise( ( resolve, reject ) => {

            let ruleset_id = ruleset.ruleset_id || ruleset.filename;

            //first, check and see if this ruleset is used at all
            let countQry = "select count(*) from {{rulesets}} " +
                "INNER JOIN runs on {{rulesets}}.id = {{runs}}.ruleset_id " +
                "WHERE {{rulesets}}.ruleset_id = $1";

            this.db.query(updateTableNames(countQry, this.tables), [ruleset_id]).then((result) => {

                let qry = null;

                if(result.rows[0].count > 0) {

                    //it is used, so mark them all as deleted

                    qry = this.db.query(
                        updateTableNames("UPDATE {{rulesets}} SET deleted = TRUE WHERE ruleset_id = $1", this.tables),
                        [ruleset_id]);
                } else {

                    //it's not used, just deleted it

                    qry = this.db.query(updateTableNames("DELETE FROM {{rulesets}} WHERE ruleset_id = $1", this.tables),
                        [ruleset_id])

                }

                qry.then(() => {
                    resolve(ruleset_id);
                }, (error) => {
                    console.log(error);
                    reject(error);
                });



            }, (error) => {
                console.log(error);
                reject(error);
            }).catch((error) => {
                console.log(error);
                reject(error);
            });



        });


    }

    /**
     * This gets the list of rulesets.
     * @return a promise to an array of ruleset ids.
     */
    getRulesets ( page, size, filters ) {

        return new Promise((resolve, reject) => {

            if ( !size ) {
                size = this.rulesetLimit;
            }

            let offset;
            if ( !page ) {
                offset = 0;
            } else {
                offset = (page - 1) * size;
            }

            let where = "";
            let countWhere = "";

            let values = [ size, offset ];
            let countValues = [];

            if ( filters.rulesetFilter && filters.rulesetFilter.length ) {
                let rulesetWhere = safeStringLike( filters.rulesetFilter );

                where = "WHERE ";
                countWhere = where;

                values.push( rulesetWhere );
                where += "{{currentRuleset}}.ruleset_id ILIKE $" + values.length;

                countValues.push( rulesetWhere );
                countWhere += "{{currentRuleset}}.ruleset_id ILIKE $" + countValues.length;

            }

            let rulesetsQuery = this.db.query( updateTableNames( "SELECT * FROM {{currentRuleset}} " + where + " " +
                "ORDER BY name ASC LIMIT $1 OFFSET $2", this.tables ), values );

            let countQuery = this.db.query( updateTableNames( "SELECT count(*) FROM {{currentRuleset}} " + countWhere, this.tables ), countValues );

            Promise.all( [ rulesetsQuery, countQuery ] ).then( ( values ) => {

                let result = values[ 0 ];
                let countResult = values[ 1 ];

                let rowCount = countResult.rows[ 0 ].count;
                let pageCount = Math.ceil( rowCount / size );

                var rulesets = [];

                result.rows.forEach( ( ruleset ) => {
                    ruleset.filename = ruleset.filename || ruleset.ruleset_id;
                    rulesets.push( ruleset );
                } );

                resolve( {
                    rulesets: rulesets,
                    rowCount: rowCount,
                    pageCount: pageCount
                } );


            }, ( error ) => {
                reject( error );
            } );

        } );


    }
}


function safeStringLike ( value ) {
    let resp = value.trim();
    resp = replaceAll( value, "%", "" );
    resp = replaceAll( value, "_", "" );
    return '%' + resp + '%';
}

function replaceAll ( target, search, replacement ) {
    return target.split( search ).join( replacement );
}

function updateTableNames ( query, tableNames ) {

    let resp = query;

    for ( var key of Object.keys( tableNames ) ) {
        let name = "{{" + key + "}}";
        resp = replaceAll( resp, name, tableNames[ key ] );
    }

    if ( resp.indexOf( '{{' ) >= 0 ) {
        console.log( "Unknown table replace in query: " + resp );
        throw "Unknown table replace in query: " + resp;
    }

    return resp;
}

function getRunQuery(tableNames) {
    return updateTableNames("SELECT {{runs}}.id, {{rulesets}}.ruleset_id, run_id, inputfile, outputfile, finishtime, " +
        "num_errors, num_warnings, starttime, {{rulesets}}.version " +
        "FROM {{runs}} " +
        "LEFT OUTER JOIN {{rulesets}} ON {{runs}}.ruleset_id = {{rulesets}}.id", tableNames );
}

function getRunResult(row) {

    let isRunning = row.num_warnings == null && row.num_errors == null;

    return {
        id: row.id,
        log: row.id,
        ruleset: row.ruleset_id,
        inputfilename: row.inputfile,
        outputfilename: row.outputfile,
        time: row.finishtime,
        starttime: row.starttime,
        errorcount: row.num_errors,
        warningcount: row.num_warnings,
        isrunning: isRunning,
        version: row.version
    };
}

function getRuleset(db, ruleset_id, version, dbId, tables, callback) {

    if ( !ruleset_id && !dbId ) {
        return new Promise( ( resolve, reject ) => {
            reject( "No ruleset_id provided" )
        } );
    }

    if ( ruleset_id && ruleset_id.endsWith( ".json" ) )
        ruleset_id = ruleset_id.substr( 0, ruleset_id.length - 5 );

    return new Promise( ( resolve, reject ) => {

        let query = 'SELECT rules, id, ruleset_id, version  FROM ';
        let values = [];

        if(dbId != null || version != null) {
            query += '{{rulesets}} ';
        } else {
            query += '{{currentRuleset}}';
        }

        if(dbId) {
            query += "where id = $1";

            values.push(dbId);
        } else {
            query += "where ruleset_id = $1";
            values.push(ruleset_id);

            if(version != null) {
                query += " AND version = $2";
                values.push(version);
            }

        }

        db.query(updateTableNames(query, tables), values)
            .then((result) => {

                callback( result, resolve, reject );

            }, ( error ) => {
                reject( error );
            } );

    } );
}

let dataInstance = null;

module.exports = ( config ) => {
    if ( dataInstance ) {
        return dataInstance;
    }

    if ( config ) {
        dataInstance = new data( config );
    }

    return dataInstance;
};
