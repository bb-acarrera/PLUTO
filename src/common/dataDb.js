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
            currentRuleset: schemaName + '"currentRuleset"',
            rules: schemaName + 'rules',
            currentRule: schemaName + '"currentRule"',
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

            if(filters.groupFilter && filters.groupFilter.length) {
                let groupWhere = safeStringLike( filters.groupFilter );

                extendWhere();

                values.push( groupWhere );
                where += "{{rulesets}}.owner_group ILIKE $" + values.length;

                countValues.push( groupWhere );
                countWhere += "{{rulesets}}.owner_group ILIKE $" + countValues.length;
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
    retrieveRuleset ( ruleset_id, rulesetOverrideFile, ruleLoader, version, dbId, group, admin ) {

        let isAdmin = admin === true;

        return getRuleset( this.db, ruleset_id, version, dbId, this.tables, ( result, resolve, reject ) => {
            if ( result.rows.length > 0 ) {
                let dbRuleset = result.rows[ 0 ].rules;

                dbRuleset.id = result.rows[ 0 ].id;

                dbRuleset.filename = ruleset_id;
                dbRuleset.name = dbRuleset.name || ruleset_id;
                dbRuleset.version = result.rows[0].version;

                dbRuleset.group = result.rows[0].owner_group;
                dbRuleset.update_user = result.rows[0].update_user;
                dbRuleset.update_time = result.rows[0].update_time;

                if(dbRuleset.group && !isAdmin && dbRuleset.group !== group) {
                    dbRuleset.canedit = false;
                } else {
                    dbRuleset.canedit = true;
                }

                dbRuleset.deleted = result.rows[0].deleted;

                let ruleset = new RuleSet( dbRuleset, ruleLoader );

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
    saveRuleSet ( ruleset, user, group, admin ) {

        let isAdmin = admin === true;

        return new Promise( ( resolve, reject ) => {

            if(!user) {
                user = null;
            }

            if(!group) {
                group = null;
            }

            checkCanChangeRuleset(this.db, this.tables, ruleset, group, isAdmin).then((result) => {
                let version = result.nextVersion;
                let rowGroup = group;

                if(result && result.rows.length > 0) {
                    rowGroup = result.rows[0].owner_group;
                }

                ruleset.version = version;

                this.db.query(updateTableNames("INSERT INTO {{rulesets}} (ruleset_id, name, version, rules, update_time, update_user, owner_group) " +
                        "VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id", this.tables),
                    [ruleset.filename, ruleset.name, version, JSON.stringify(ruleset), new Date(), user, rowGroup])
                .then((result) => {
                    resolve(ruleset.filename);
                }, (error) => {
                    reject(error)
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
     * This deletes the given ruleset from the database
     * @param ruleset the ruleset to delete.
     * @private
     */
    deleteRuleSet ( ruleset, user, group, admin ) {

        let isAdmin = admin === true;

        return new Promise( ( resolve, reject ) => {

            let ruleset_id = ruleset.filename;

            checkCanChangeRuleset(this.db, this.tables, ruleset, group, isAdmin).then((result) => {

                if(result && result.rows.length > 0) {

                    const row = result.rows[0];
                    ruleset.version = result.nextVersion;

                    this.db.query(updateTableNames("INSERT INTO {{rulesets}} (ruleset_id, name, version, rules, update_time, update_user, owner_group, deleted) " +
                            "VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id", this.tables),
                        [ruleset.filename, row.name, ruleset.version, row.rules, new Date(), user, row.owner_group, true])
                        .then((result) => {

                            this.db.query(
                                updateTableNames("UPDATE {{rulesets}} SET deleted = TRUE WHERE ruleset_id = $1", this.tables),
                                [ruleset_id])
                                .then(() => {
                                    resolve(ruleset_id);
                                }, (error) => {
                                    console.log(error);
                                    reject(error);
                                });

                        }, (error) => {
                            reject(error)
                        });


                } else {
                    reject('No ruleset found to delete')
                }


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

            function extendWhere() {
                if ( where.length === 0 ) {
                    where = "WHERE ";
                    countWhere = "WHERE ";
                } else {
                    where += " AND ";
                    countWhere += " AND ";
                }
            }

            if ( filters.rulesetFilter && filters.rulesetFilter.length ) {
                let rulesetWhere = safeStringLike( filters.rulesetFilter );

                extendWhere();

                values.push( rulesetWhere );
                where += "{{currentRuleset}}.ruleset_id ILIKE $" + values.length;

                countValues.push( rulesetWhere );
                countWhere += "{{currentRuleset}}.ruleset_id ILIKE $" + countValues.length;

            }

            if(filters.groupFilter && filters.groupFilter.length) {
                let groupWhere = safeStringLike( filters.groupFilter );

                extendWhere();

                values.push( groupWhere );
                where += "{{currentRuleset}}.owner_group ILIKE $" + values.length;

                countValues.push( groupWhere );
                countWhere += "{{currentRuleset}}.owner_group ILIKE $" + countValues.length;
            }

            let rulesetsQuery = this.db.query( updateTableNames( "SELECT * FROM {{currentRuleset}} " + where + " " +
                "ORDER BY id DESC LIMIT $1 OFFSET $2", this.tables ), values );

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






    ruleExists(rule_id) {

        return new Promise((resolve) => {
            getRule( this.db, rule_id, null, null, this.tables).then((result) => {
                if ( result.rows.length > 0 ) {
                    resolve( true );

                } else {
                    resolve( false );
                }
            }, () => {
                resolve( false );
            });
        });
    }

    /**
     * Retrieve a rule description.
     * @param rule_id the name of the rule.
     * @return a promise to an object describing a rule.
     */
    retrieveRule ( rule_id, version, dbId, group, admin ) {

        let isAdmin = admin === true;

        return new Promise((resolve, reject) => {
            getRule( this.db, rule_id, version, dbId, this.tables).then((result) => {
                if ( result.rows.length > 0 ) {

                    var rule = getRuleResult(result.rows[0], isAdmin, group);

                    resolve( rule );

                } else {
                    resolve( null );
                }
            }, (e) => {
                reject(e);
            });
        });

    }

    getRules ( page, size, filters, group, admin ) {

        let isAdmin = admin === true;

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

            function extendWhere() {
                if ( where.length === 0 ) {
                    where = "WHERE ";
                    countWhere = "WHERE ";
                } else {
                    where += " AND ";
                    countWhere += " AND ";
                }
            }

            if ( filters.typeFilter && filters.typeFilter.length ) {
                let typeWhere = filters.typeFilter;

                extendWhere();

                values.push( typeWhere );
                where += "{{currentRule}}.type = $" + values.length;

                countValues.push( typeWhere );
                countWhere += "{{currentRule}}.type = $" + countValues.length;

            }

            if(filters.ruleFilter && filters.ruleFilter.length) {
                let ruleWhere = safeStringLike( filters.ruleFilter );

                extendWhere();

                values.push( ruleWhere );
                where += "{{currentRule}}.rule_id ILIKE $" + values.length;

                countValues.push( ruleWhere );
                countWhere += "{{currentRule}}.rule_id ILIKE $" + countValues.length;
            }

            if(filters.ownerFilter && filters.ownerFilter.length) {
                let ownerWhere = safeStringLike( filters.ownerFilter );

                extendWhere();

                values.push( ownerWhere );
                where += "{{currentRule}}.owner_group ILIKE $" + values.length;

                countValues.push( ownerWhere );
                countWhere += "{{currentRule}}.owner_group ILIKE $" + countValues.length;
            }

            if(filters.groupFilter && filters.groupFilter.length) {
                let groupWhere = safeStringLike( filters.groupFilter );

                extendWhere();

                values.push( groupWhere );
                where += '{{currentRule}}."group" ILIKE $' + values.length;

                countValues.push( groupWhere );
                countWhere += '{{currentRule}}."group" ILIKE $' + countValues.length;
            }

            let ruleQuery = this.db.query( updateTableNames( "SELECT * FROM {{currentRule}} " + where + " " +
                "ORDER BY id DESC LIMIT $1 OFFSET $2", this.tables ), values );

            let countQuery = this.db.query( updateTableNames( "SELECT count(*) FROM {{currentRule}} " + countWhere, this.tables ), countValues );

            Promise.all( [ ruleQuery, countQuery ] ).then( ( values ) => {

                let result = values[ 0 ];
                let countResult = values[ 1 ];

                let rowCount = countResult.rows[ 0 ].count;
                let pageCount = Math.ceil( rowCount / size );

                var rules = [];

                result.rows.forEach( ( row ) => {
                    rules.push( getRuleResult(row, isAdmin, group) );
                } );

                resolve( {
                    rules: rules,
                    rowCount: rowCount,
                    pageCount: pageCount
                } );


            }, ( error ) => {
                reject( error );
            } );

        } );

    }

    saveRule ( rule, user, group, admin ) {

        let isAdmin = admin === true;

        return new Promise( ( resolve, reject ) => {

            if(!user) {
                user = null;
            }

            if(!group) {
                group = null;
            }

            checkCanChangeRule(this.db, this.tables, rule, group, isAdmin).then((result) => {
                let version = result.nextVersion;
                let rowGroup = group;

                if(result && result.rows.length > 0) {
                    rowGroup = result.rows[0].owner_group;
                }

                rule.version = version;

                this.db.query(updateTableNames('INSERT INTO {{rules}} (rule_id, description, version, config, type, base, update_time, update_user, owner_group, "group") ' +
                        "VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id", this.tables),
                    [rule.rule_id, rule.description, version, JSON.stringify(rule.config), rule.type, rule.base, new Date(), user, rowGroup, rule.group])
                    .then((result) => {
                        resolve(rule.rule_id);
                    }, (error) => {
                        reject(error)
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

    deleteRule ( rule, user, group, admin ) {

        let isAdmin = admin === true;

        return new Promise( ( resolve, reject ) => {

            let rule_id = rule.rule_id;

            checkCanChangeRule(this.db, this.tables, rule, group, isAdmin).then((result) => {

                if(result && result.rows.length > 0) {
                    const row = result.rows[0];
                    rule.version = result.nextVersion;

                    this.db.query(updateTableNames('INSERT INTO {{rules}} (rule_id, description, version, config, type, base, update_time, update_user, owner_group, "group", deleted) ' +
                            "VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id", this.tables),
                        [rule.rule_id, rule.description, rule.version, JSON.stringify(rule.config), rule.type, rule.base, new Date(), user, row.owner_group, rule.group, true])
                        .then((result) => {

                            this.db.query(
                                updateTableNames("UPDATE {{rules}} SET deleted = TRUE WHERE rule_id = $1", this.tables),
                                [rule_id])
                                .then(() => {
                                    resolve(rule_id);
                                }, (error) => {
                                    console.log(error);
                                    reject(error);
                                });

                        }, (error) => {
                            reject(error)
                        });


                } else {
                    reject('No rule found to delete')
                }


            }, (error) => {
                console.log(error);
                reject(error);
            }).catch((error) => {
                console.log(error);
                reject(error);
            });

        });


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
        "num_errors, num_warnings, starttime, {{rulesets}}.version, {{rulesets}}.deleted, {{rulesets}}.owner_group " +
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
        version: row.version,
        deleted: row.deleted,
        group: row.owner_group
    };
}

function getRuleset(db, ruleset_id, version, dbId, tables, callback, getDeleted) {

    if ( !ruleset_id && !dbId ) {
        return new Promise( ( resolve, reject ) => {
            reject( "You must specify a Ruleset name or id" );
        } );
    }

    if ( ruleset_id && ruleset_id.endsWith( ".json" ) )
        ruleset_id = ruleset_id.substr( 0, ruleset_id.length - 5 );

    return new Promise( ( resolve, reject ) => {

        let query = 'SELECT rules, id, ruleset_id, version, owner_group, update_user, update_time, deleted FROM ';
        let values = [];

        if(dbId != null || version != null || getDeleted) {
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

        query += " ORDER BY version DESC";

        db.query(updateTableNames(query, tables), values)
            .then((result) => {

                callback( result, resolve, reject );

            }, ( error ) => {
                reject( error );
            } );

    } );
}

function checkCanChangeRuleset(db, tables, ruleset, group, admin) {

    return new Promise((resolve, reject) => {
        getRuleset(db, ruleset.filename, null, null, tables, (result, resolve, reject) => {
            resolve(result);
        }, true).then((result) => {

            if (result.rows.length > 0) {

                if(!result.rows[0].deleted) {
                    if (result.rows[0].version != ruleset.version) {
                        reject(`${ruleset.filename} has been changed by another user. Cannot update old version`);
                        return;
                    }

                    if (result.rows[0].owner_group != null && !admin && result.rows[0].owner_group != group) {
                        reject('Cannot change a ruleset that has been created by another group. Owner is ' + result.rows[0].owner_group);
                        return;
                    }
                }
                result.nextVersion = result.rows[0].version + 1;

            } else {
                result.nextVersion = 0;
            }

            resolve(result);

        });

    });

}



function getRule(db, rule_id, version, dbId, tables, getDeleted) {

    if ( !rule_id && !dbId ) {
        return new Promise( ( resolve, reject ) => {
            reject( "You must specify a rule name or id" );
        } );
    }

    return new Promise( ( resolve, reject ) => {

        let query = 'SELECT * FROM ';
        let values = [];

        if(dbId != null || version != null || getDeleted) {
            query += '{{rules}} ';
        } else {
            query += '{{currentRule}}';
        }

        if(dbId) {
            query += "where id = $1";

            values.push(dbId);
        } else {
            query += "where rule_id = $1";
            values.push(rule_id);

            if(version != null) {
                query += " AND version = $2";
                values.push(version);
            }

        }

        query += " ORDER BY version DESC";

        db.query(updateTableNames(query, tables), values)
            .then((result) => {

                resolve(result);

            }, ( error ) => {
                reject( error );
            } );

    } );
}

function checkCanChangeRule(db, tables, rule, group, admin) {

    return new Promise((resolve, reject) => {

        const rule_id = rule.rule_id;

        getRule(db, rule_id, null, null, tables, true).then((result) => {
            if (result.rows.length > 0) {

                if(!result.rows[0].deleted) {
                    if (result.rows[0].version != rule.version) {
                        reject(`${rule_id} has been changed by another user. Cannot update old version`);
                        return;
                    }

                    if (result.rows[0].owner_group != null && !admin && result.rows[0].owner_group != group) {
                        reject('Cannot change a rule that has been created by another group. Owner is ' + result.rows[0].owner_group);
                        return;
                    }
                }
                result.nextVersion = result.rows[0].version + 1;

            } else {
                result.nextVersion = 0;
            }

            resolve(result);
        });


    });

}

function getRuleResult(row, isAdmin, group) {
    let rule = {
        id: row.id,
        version: row.version,
        rule_id: row.rule_id,
        description: row.description,
        type: row.type,
        base: row.base,
        config: row.config,
        owner_group: row.owner_group,
        update_user: row.update_user,
        update_time: row.update_time,
        deleted: row.deleted,
        group: row.group
    };

    if (rule.owner_group && !isAdmin && rule.owner_group !== group) {
        rule.canedit = false;
    } else {
        rule.canedit = true;
    }
    return rule;
}

let dataInstance = null;

module.exports = ( config, newInstance ) => {
    if ( dataInstance && !newInstance ) {
        return dataInstance;
    }

    if ( config ) {
        dataInstance = new data( config );
    }

    return dataInstance;
};
