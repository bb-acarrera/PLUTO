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

                        let index = 0;

                        log.forEach( function ( value ) {

                            if ( !value.ruleID ) {
                                rowRuleId = "global";
                            } else {
                                rowRuleId = value.ruleID;
                            }

                            if ( !resultMap[ rowRuleId ] ) {
                                resultMap[ rowRuleId ] = {
                                    err: 0,
                                    warn: 0,
                                    dropped: 0
                                };
                            }
                            if ( value.type == 'Error' ) {
                                resultMap[ rowRuleId ].err += 1;
                            }
                            else if ( value.type == 'Warning' ) {
                                resultMap[ rowRuleId ].warn += 1;
                            } else if (value.type == 'Dropped') {
                                resultMap[ rowRuleId ].dropped += 1;
                            }
                            value.index = index;

                            if ( filter ) {
                                if ( (!type || type == value.type) && (!ruleid || rowRuleId == ruleid ) ) {
                                    filteredLog.push( value );
                                }
                            }

                            index++;

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

            let where = "", countWhere = "", subWhere = "", filenameWhere = "";
            let allJoin = "", joinedSource = false;
            let join = '', countJoin = '';

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

            if(!filters.showErrors || !filters.showWarnings || !filters.showNone || !filters.showDropped) {

                let errorsWhere = '';

                if(filters.showErrors) {
                    errorsWhere += "{{runs}}.num_errors > 0";
                }

                if(filters.showDropped) {
                    if(errorsWhere.length > 0) {
                        errorsWhere += " OR "
                    }

                    errorsWhere += "{{runs}}.num_dropped > 0";
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
                    errorsWhere += "({{runs}}.num_errors = 0 AND {{runs}}.num_warnings = 0 AND {{runs}}.num_dropped = 0)"

                }

                extendWhere();

                if(errorsWhere.length == 0) {
                    errorsWhere += 'FALSE';
                }

                where += '(' + errorsWhere + ')';
                countWhere = where;

            }

            if(!filters.showPassed || !filters.showFailed) {

                let errorsWhere = '';

                if(filters.showPassed) {
                    if(errorsWhere.length > 0) {
                        errorsWhere += " OR "
                    }

                    errorsWhere += "{{runs}}.passed = TRUE";
                }

                if(filters.showFailed) {
                    if(errorsWhere.length > 0) {
                        errorsWhere += " OR "
                    }

                    errorsWhere += "{{runs}}.passed = FALSE";
                }

                extendWhere();

                if(errorsWhere.length == 0) {
                    errorsWhere += 'FALSE';
                }

                errorsWhere = '(' + errorsWhere + ')';

                where += errorsWhere;
                countWhere += errorsWhere;
            }

            if( filters.showValidOnly ) {
                extendWhere();

                subWhere = "({{runs}}.summary->>'wasTest' IS NULL OR ({{runs}}.summary->>'wasTest')::boolean = FALSE) AND " +
                    "({{runs}}.summary->>'wasSkipped' IS NULL OR ({{runs}}.summary->>'wasSkipped')::boolean = FALSE)";

                where += subWhere;
                countWhere += subWhere;
            }

            if ( filters.rulesetFilter && filters.rulesetFilter.length ) {
                subWhere = safeStringLike( filters.rulesetFilter );

                extendWhere();

                values.push( subWhere );
                where += "{{rulesets}}.ruleset_id ILIKE $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{rulesets}}.ruleset_id ILIKE $" + countValues.length;

            }

            if ( filters.rulesetExactFilter && filters.rulesetExactFilter.length ) {
                subWhere = filters.rulesetExactFilter;

                extendWhere();

                values.push( subWhere );
                where += "{{rulesets}}.ruleset_id = $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{rulesets}}.ruleset_id = $" + countValues.length;

            }

            if ( filters.rulesetVersionIdFilter != null ) {
                subWhere = filters.rulesetVersionIdFilter;

                extendWhere();

                values.push( subWhere );
                where += "{{runs}}.ruleset_id = $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{runs}}.ruleset_id = $" + countValues.length;

            }

            if ( filters.inputMd5Filter && filters.inputMd5Filter.length ) {
                subWhere = filters.inputMd5Filter;

                extendWhere();

                values.push( subWhere );
                where += "{{runs}}.input_md5 = $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{runs}}.input_md5 = $" + countValues.length;

            }

            //
            if ( filters.targetId != null ) {
                subWhere = filters.targetId;

                extendWhere();

                values.push( subWhere );
                where += "{{runs}}.target_id = $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{runs}}.target_id = $" + countValues.length;

            }


            if ( filters.filenameFilter && filters.filenameFilter.length > 0 ) {
                filenameWhere = safeStringLike( filters.filenameFilter );

                extendWhere();

                values.push( filenameWhere );
                where += "{{runs}}.inputfile ILIKE $" + values.length;

                countValues.push( filenameWhere );
                countWhere += "{{runs}}.inputfile ILIKE $" + countValues.length;

            }

            if(filters.dateFilter) {
                extendWhere();

                values.push( moment.utc(filters.dateFilter) );
                where += "CAST({{runs}}.finishtime AS DATE) = CAST($" + values.length + " AS DATE)";

                countValues.push( filters.dateFilter );
                countWhere += "CAST({{runs}}.finishtime AS DATE) = CAST($" + countValues.length + "AS DATE)";
            }

            if(filters.idFilter) {

                extendWhere();

                let idWhere = parseInt(filters.idFilter);

                if(isNaN(idWhere)) {
                    idWhere = -1;
                }

                values.push( idWhere );
                where += "{{runs}}.id = $" + values.length;

                countValues.push( idWhere );
                countWhere += "{{runs}}.id = $" + countValues.length;

            }

            if(filters.groupFilter && filters.groupFilter.length) {
                let groupWhere = safeStringLike( filters.groupFilter );

                extendWhere();

                values.push( groupWhere );
                where += "{{rulesets}}.owner_group ILIKE $" + values.length;

                countValues.push( groupWhere );
                countWhere += "{{rulesets}}.owner_group ILIKE $" + countValues.length;
            }

            if(filters.sourceFileFilter && filters.sourceFileFilter.length) {
                let subWhere = safeStringLike( filters.sourceFileFilter );

                extendWhere();

                values.push( subWhere );
                where += "{{rulesets}}.rules->'source'->'config'->>'file' ILIKE $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{rulesets}}.rules->'source'->'config'->>'file' ILIKE $" + countValues.length;
            }

            if(filters.rulesetIdListFilter && filters.rulesetIdListFilter.length) {

                let valuesList = '';
                let countValuesList = '';

                filters.rulesetIdListFilter.forEach((ruelset_id) => {
                    values.push( ruelset_id );
                    countValues.push( ruelset_id );

                    if(valuesList.length) {
                        valuesList += ',';
                        countValuesList += ','
                    }

                    valuesList += '$' + values.length;
                    countValuesList += '$' + countValues.length;

                });

                extendWhere();


                where += "{{runs}}.id IN (" +
                "SELECT MAX({{runs}}.id) FROM {{runs}} " +
                "INNER JOIN {{rulesets}} ON {{runs}}.ruleset_id = {{rulesets}}.id " +
                "WHERE {{rulesets}}.ruleset_id IN (" + valuesList + ") AND " +
                "({{runs}}.summary->>'wasTest' IS NULL OR ({{runs}}.summary->>'wasTest')::boolean = FALSE) AND " +
                "({{runs}}.summary->>'wasSkipped' IS NULL OR ({{runs}}.summary->>'wasSkipped')::boolean = FALSE) " +
                "GROUP BY {{rulesets}}.ruleset_id)";


                countWhere += "{{runs}}.id IN (" +
                    "SELECT MAX({{runs}}.id) FROM {{runs}} " +
                    "INNER JOIN {{rulesets}} ON {{runs}}.ruleset_id = {{rulesets}}.id " +
                    "WHERE {{rulesets}}.ruleset_id IN (" + countValuesList + ") AND " +
                    "({{runs}}.summary->>'wasTest' IS NULL OR ({{runs}}.summary->>'wasTest')::boolean = FALSE) AND " +
                    "({{runs}}.summary->>'wasSkipped' IS NULL OR ({{runs}}.summary->>'wasSkipped')::boolean = FALSE) " +
                    "GROUP BY {{rulesets}}.ruleset_id)";
            }

            if(filters.sourceFilter && filters.sourceFilter.length) {
                let subWhere = safeStringLike( filters.sourceFilter );

                extendWhere();

                if(!joinedSource) {
                    joinedSource = true;
                    allJoin += " LEFT OUTER JOIN {{currentRule}} ON {{rulesets}}.rules->'source'->>'filename' = {{currentRule}}.rule_id";
                }

                values.push( subWhere );
                where += '({{currentRule}}."group" ILIKE $' + values.length + ' OR {{currentRule}}.description ILIKE $' + values.length + ')';

                countValues.push( subWhere );
                countWhere += '({{currentRule}}."group" ILIKE $' + countValues.length + ' OR {{currentRule}}.description ILIKE $' + countValues.length + ')';
            }

            if(filters.latestRulesetVersionWithMd5 === true) {

                function getLatestRulesetVersionWithMd5SQL(where) {
                    return ' JOIN (SELECT {{runs}}.ruleset_id, ' +
                        'max({{runs}}.finishtime) AS finishtime ' +
                        'FROM {{runs}} ' +
                        'WHERE {{runs}}.input_md5 IS NOT NULL ' + where +
                        'GROUP BY {{runs}}.ruleset_id) c ON c.ruleset_id = {{runs}}.ruleset_id AND c.finishtime = {{runs}}.finishtime';
                }

                if(filters.latestRulesetVersionExcludeRunId != null) {
                    values.push( filters.latestRulesetVersionExcludeRunId );
                    join += getLatestRulesetVersionWithMd5SQL('AND {{runs}}.id <> $'+ values.length);

                    countValues.push( filters.latestRulesetVersionExcludeRunId );
                    countJoin += getLatestRulesetVersionWithMd5SQL('AND {{runs}}.id <> $'+ countValues.length);

                } else {
                    allJoin += getLatestRulesetVersionWithMd5SQL('');
                }
            }


            if(allJoin.length > 0 || join.length > 0) {
                where = allJoin + ' ' + join + ' ' + where;
                countWhere = allJoin + ' ' + countJoin +  ' ' + countWhere;
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
     * @param ruleset the ruleset used for this run
     * @param inputFile the name of the input file
     * @param outputFile the name of the output file
     */
     saveRunRecord(runId, log, ruleset, inputFile, outputFile, logCounts, passed, summary, inputMd5, finished) {

        return new Promise((resolve, reject) => {

            let values = [];
            let valueStr = '';

            function extend() {
                if ( valueStr.length !== 0 ) {
                    valueStr += ', ';
                }
            }

            values.push(runId);

            if(logCounts) {
                extend();

                values.push(logCounts[ErrorHandlerAPI.ERROR] || 0);
                valueStr += `num_errors = $${values.length},`;

                values.push(logCounts[ErrorHandlerAPI.WARNING] || 0);
                valueStr += `num_warnings = $${values.length},`;

                values.push(logCounts[ErrorHandlerAPI.DROPPED] || 0);
                valueStr += `num_dropped = $${values.length}`;
            }

            if(inputFile) {
                extend();
                values.push(inputFile);
                valueStr += `inputfile = $${values.length}`;
            }

            if(outputFile) {
                extend();
                values.push(outputFile);
                valueStr += `outputfile = $${values.length}`;
            }

            if(passed != null) {
                extend();
                values.push(passed);
                valueStr += `passed = $${values.length}`;
            }

            if(log) {
                extend();
                values.push(JSON.stringify(log));
                valueStr += `log = $${values.length}`;
            }

            if(summary) {
                extend();
                values.push(JSON.stringify(summary));
                valueStr += `summary = $${values.length}`;
            }

            if(ruleset) {

                if(ruleset.sourceDetails && ruleset.sourceDetails.id != null) {
                    extend();
                    values.push(ruleset.sourceDetails.id);
                    valueStr += `source_id = $${values.length}`;
                }

                if(ruleset.targetDetails && ruleset.targetDetails.id != null) {
                    extend();
                    values.push(ruleset.targetDetails.id);
                    valueStr += `target_id = $${values.length}`;
                }
            }



            if(inputMd5) {
                extend();
                values.push(inputMd5);
                valueStr += `input_md5 = $${values.length}`;
            }

            if(finished || passed != null) {
                extend();
                values.push(new Date());
                valueStr += `finishtime = $${values.length}`;
            }

            this.db.query(updateTableNames("UPDATE {{runs}} SET " +
                    valueStr +
                    " WHERE id = $1", this.tables), values)
                .then(() => {
                    resolve();
                }, (error) => {
                    console.log(error);
                    reject(error);
                });

        });

    }

    deleteRunRecord(runId) {
        return new Promise((resolve, reject) => {

            this.db.query(updateTableNames("DELETE FROM {{runs}} WHERE id = $1", this.tables), [runId])
                .then((result) => {
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

        return new Promise((resolve, reject) => {
           getRuleset( this.db, ruleset_id, version, dbId, this.tables).then( (result) => {
                if ( result.rows.length > 0 ) {

                    let row = result.rows[0];

                    var ruleset = getRulesetFromRow(row, ruleset_id, isAdmin, group, ruleLoader);

                    if ( rulesetOverrideFile && typeof rulesetOverrideFile === 'string' ) {
                        ruleset.applyOverride( rulesetOverrideFile );
                    }

                    resolve( ruleset );

                } else {
                    resolve( null );
                }
            }, (e) => {
               reject(e)
           } );
        });
    }

    rulesetExists(ruleset_id) {
        return new Promise((resolve, reject) => {
            getRuleset( this.db, ruleset_id, null, null, this.tables).then( (result) => {
                if ( result.rows.length > 0 ) {

                    resolve( true );

                } else {
                    resolve( false );
                }
            }, (e) => {
                reject(e)
            } );
        });
    }

    rulesetValid(ruleset, checkIdUnique, checkTargetFile) {

        const promises = [];



        if(checkIdUnique && ruleset.ruleset_id) {
            promises.push(new Promise((resolve, reject) => {
                getRuleset(this.db, ruleset.ruleset_id, null, null, this.tables).then( (result) => {
                    if(result.rows.length > 0) {
                        reject( `'${ruleset.ruleset_id}' already exsists.` );
                    } else {
                        resolve();
                    }
                }, (e) => {
                    reject(e);
                })
            } ));
        }

        if(checkTargetFile && ruleset.target_file) {
            promises.push(new Promise((resolve, reject) => {
                this.getRulesets(1, 5, {
                    targetFileExactFilter: ruleset.target_file,
                    notIdFilter: ruleset.ruleset_id
                }).then((result) => {
                    if(result.rulesets.length > 0) {
                        reject( `The file '${ruleset.target_file}' is already used as the target for another validation.` );
                    } else {
                        resolve();
                    }
                }, (error) => {
                    reject(error);
                });

            }));
        }

        return Promise.all(promises);

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

            function save(){
                checkCanChangeRuleset(this.db, this.tables, ruleset, group, isAdmin).then((result) => {
                    let version = result.nextVersion;
                    let rowGroup = group;
                    let targetFile = null;

                    if(result && result.rows.length > 0) {
                        rowGroup = result.rows[0].owner_group;
                    }

                    ruleset.version = version;

                    if(this.config.forceUniqueTargetFile) {
                        targetFile = ruleset.target_file;
                    }

                    this.db.query(updateTableNames('INSERT INTO {{rulesets}} (ruleset_id, name, version, rules, update_time, update_user, owner_group, target_file) ' +
                            "VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id", this.tables),
                        [ruleset.filename, ruleset.name, version, JSON.stringify(ruleset), new Date(), user, rowGroup, targetFile])
                        .then(() => {
                            resolve(ruleset);
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
            }

            if(!ruleset.filename) {
                generateId.call(this, "rulesets", "ruleset_id").then((ruleset_id) => {
                    ruleset.ruleset_id = ruleset_id;
                    ruleset.filename = ruleset_id;
                    save.call(this);
                }, (error) => {
                    console.log(error);
                    reject(error);
                }).catch((error) => {
                    console.log(error);
                    reject(error);
                });
            } else {
                save.call(this);
            }




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

                    let targetFile = null;
                    if(this.config.forceUniqueTargetFile) {
                        targetFile = ruleset.target_file;
                    }

                    this.db.query(updateTableNames('INSERT INTO {{rulesets}} (ruleset_id, name, version, rules, update_time, update_user, owner_group, target_file, deleted) ' +
                            "VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id", this.tables),
                        [ruleset.filename, row.name, ruleset.version, row.rules, new Date(), user, row.owner_group, targetFile, true])
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
                    reject('No validation found to delete')
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
    getRulesets ( page, size, filters, ruleLoader, group, admin ) {

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

            let join = '';
            let joinedSource = false;

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

            if(filters.nameFilter && filters.nameFilter.length) {
                let groupWhere = safeStringLike( filters.nameFilter );

                extendWhere();

                values.push( groupWhere );
                where += "{{currentRuleset}}.name ILIKE $" + values.length;

                countValues.push( groupWhere );
                countWhere += "{{currentRuleset}}.name ILIKE $" + countValues.length;
            }

            if(filters.targetFileExactFilter && filters.targetFileExactFilter.length) {
                let subWhere = filters.targetFileExactFilter;

                extendWhere();

                values.push( subWhere );
                where += "{{currentRuleset}}.target_file = $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{currentRuleset}}.target_file = $" + countValues.length;

            }

            if(filters.notIdFilter && filters.notIdFilter.length) {
                let subWhere = filters.notIdFilter;

                extendWhere();

                values.push( subWhere );
                where += "{{currentRuleset}}.ruleset_id != $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{currentRuleset}}.ruleset_id != $" + countValues.length;

            }

            if(filters.fileFilter && filters.fileFilter.length) {
                let subWhere = safeStringLike( filters.fileFilter );

                extendWhere();

                values.push( subWhere );
                where += "{{currentRuleset}}.rules->'source'->'config'->>'file' ILIKE $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{currentRuleset}}.rules->'source'->'config'->>'file' ILIKE $" + countValues.length;
            }

            if(filters.fileExactFilter && filters.fileExactFilter.length) {
                let subWhere = filters.fileExactFilter;

                extendWhere();

                values.push( subWhere );
                where += "{{currentRuleset}}.rules->'source'->'config'->>'file' = $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{currentRuleset}}.rules->'source'->'config'->>'file' = $" + countValues.length;

            }

            if(filters.configuredRuleIdFilter && filters.configuredRuleIdFilter.length) {
                extendWhere();

                function getConfiguredRuleIdFilterSQL(attrIndex) {
                    return "( ({{currentRuleset}}.rules->'source'->>'filename') = $" + attrIndex + " OR " +
                        "({{currentRuleset}}.rules->'target'->>'filename') = $" + attrIndex + " )"
                }

                values.push( filters.configuredRuleIdFilter.toString() );
                where += getConfiguredRuleIdFilterSQL(values.length);

                countValues.push( filters.configuredRuleIdFilter.toString() );
                countWhere += getConfiguredRuleIdFilterSQL(countValues.length);
            }

            if(filters.sourceDescriptionFilter && filters.sourceDescriptionFilter.length) {
                let subWhere = safeStringLike( filters.sourceDescriptionFilter );

                extendWhere();

                if(!joinedSource) {
                    joinedSource = true;
                    join += " LEFT OUTER JOIN {{currentRule}} ON {{currentRuleset}}.rules->'source'->>'filename' = {{currentRule}}.rule_id";
                }

                values.push( subWhere );
                where += '{{currentRule}}.description ILIKE $' + values.length;

                countValues.push( subWhere );
                countWhere += '{{currentRule}}.description ILIKE $' + countValues.length;
            }

            if(filters.sourceDescriptionExactFilter && filters.sourceDescriptionExactFilter.length) {
                let subWhere = filters.sourceDescriptionExactFilter;

                extendWhere();

                if(!joinedSource) {
                    joinedSource = true;
                    join += " LEFT OUTER JOIN {{currentRule}} ON {{currentRuleset}}.rules->'source'->>'filename' = {{currentRule}}.rule_id";
                }

                values.push( subWhere );
                where += '{{currentRule}}.description = $' + values.length;

                countValues.push( subWhere );
                countWhere += '{{currentRule}}.description = $' + countValues.length;
            }


            if(join && join.length > 0) {
                where = join + ' ' + where;
                countWhere = join + ' ' + countWhere;
            }

            let rulesetsQuery = this.db.query(updateTableNames( "SELECT {{currentRuleset}}.* FROM {{currentRuleset}} " + where + " " +
                "ORDER BY {{currentRuleset}}.id DESC LIMIT $1 OFFSET $2", this.tables ), values );

            let countQuery = this.db.query( updateTableNames( "SELECT count(*) FROM {{currentRuleset}} " + countWhere, this.tables ), countValues );

            Promise.all( [ rulesetsQuery, countQuery ] ).then( ( values ) => {

                let result = values[ 0 ];
                let countResult = values[ 1 ];

                let rowCount = countResult.rows[ 0 ].count;
                let pageCount = Math.ceil( rowCount / size );

                var rulesets = [];

                result.rows.forEach( ( row ) => {
                    rulesets.push( getRulesetFromRow(row, row.ruleset_id, isAdmin, group, ruleLoader) );
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

    ruleInUse(rule_id) {

        return new Promise((resolve) => {
            const rulesetQuery = this.getRulesets(1, 10, { configuredRuleIdFilter: rule_id });
            const linkQuery = this.getRules(1, 10, {linkFilter: rule_id});

            Promise.all([rulesetQuery, linkQuery]).then((queries) => {

                if(queries[0].rulesets.length > 0) {
                    resolve(true);
                    return;
                }

                if(queries[1].rules.length > 0) {
                    resolve(true);
                    return;
                }

                resolve(false);

            }, (err) => {
                console.log(err);
                resolve(true);
            })
        });



    }

    /**
     * Retrieve a rule description.
     * @param rule_id the name of the rule.
     * @return a promise to an object describing a rule.
     */
    retrieveRule ( rule_id, version, dbId, group, admin, rulesLoader ) {

        let isAdmin = admin === true;

        return new Promise((resolve, reject) => {
            getRule( this.db, rule_id, version, dbId, this.tables).then((result) => {
                if ( result.rows.length > 0 ) {

                    var rule = getRuleResult(result.rows[0], isAdmin, group, rulesLoader);

                    resolve( rule );

                } else {
                    resolve( null );
                }
            }, (e) => {
                reject(e);
            });
        });

    }

    getRules ( page, size, filters, group, admin, rulesLoader ) {

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

            //descriptionFilter
            if(filters.descriptionFilter && filters.descriptionFilter.length) {
                let subWhere = safeStringLike( filters.descriptionFilter );

                extendWhere();

                values.push( subWhere );
                where += '{{currentRule}}.description ILIKE $' + values.length;

                countValues.push( subWhere );
                countWhere += '{{currentRule}}.description ILIKE $' + countValues.length;
            }

            if(filters.descriptionExactFilter && filters.descriptionExactFilter.length) {
                let subWhere = filters.descriptionExactFilter;

                extendWhere();

                values.push( subWhere );
                where += '{{currentRule}}.description = $' + values.length;

                countValues.push( subWhere );
                countWhere += '{{currentRule}}.description = $' + countValues.length;
            }

            if(filters.idListFilter && filters.idListFilter.length) {
                extendWhere();

                values.push( filters.idListFilter );
                where += '{{currentRule}}.rule_id IN ($' + values.length + ')';

                countValues.push( filters.idListFilter );
                countWhere += '{{currentRule}}.rule_id IN ($' + countValues.length + ')';
            }

            if(filters.linkFilter && filters.linkFilter.length) {
                extendWhere();

                values.push( filters.linkFilter.toString() );
                where += `{{currentRule}}.type = 'source' AND {{currentRule}}.config->>'linkedtargetid' = $` + values.length;

                countValues.push( filters.linkFilter.toString() );
                countWhere += `{{currentRule}}.type = 'source' AND {{currentRule}}.config->>'linkedtargetid' = $` + countValues.length;
            }

            if(filters.notIdFilter && filters.notIdFilter.length) {
                let subWhere = filters.notIdFilter.toString();

                extendWhere();

                values.push( subWhere );
                where += "{{currentRule}}.rule_id != $" + values.length;

                countValues.push( subWhere );
                countWhere += "{{currentRule}}.rule_id != $" + countValues.length;

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
                    rules.push( getRuleResult(row, isAdmin, group, rulesLoader) );
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

            function update() {

                const canChangeQuery = checkCanChangeRule(this.db, this.tables, rule, group, isAdmin);
                const sameDescriptionQuery = this.getRules(1, 10, {descriptionExactFilter: rule.description, typeFilter: rule.type, notIdFilter: rule.rule_id});

                Promise.all([canChangeQuery, sameDescriptionQuery]).then((queries) => {

                    if(queries[1].rules.length > 0) {
                        reject(`${rule.description} is already in use.  Choose another name.`);
                        return;
                    }

                    const result = queries[0];

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
            }

            if(!rule.rule_id) {
                generateId.call(this, "rules", "rule_id").then((ruleId) => {
                    rule.rule_id = ruleId;
                    update.call(this);
                }, (error) => {
                    console.log(error);
                    reject(error);
                }).catch((error) => {
                    console.log(error);
                    reject(error);
                });
            } else {
                update.call(this);
            }

        });

    }

    deleteRule ( rule, user, group, admin ) {

        let isAdmin = admin === true;

        return new Promise( ( resolve, reject ) => {

            let rule_id = rule.rule_id;

            const canChange = checkCanChangeRule(this.db, this.tables, rule, group, isAdmin);
            const inUse = this.ruleInUse(rule_id);


            Promise.all([canChange, inUse]).then((queries) => {

                if(queries[1] === true) {
                    reject('Cannot delete. This is in use.');
                    return;
                }

                const result = queries[0];

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

function generateId(tableName, idName) {
    return new Promise((resolve, reject) => {
        this.db.query(updateTableNames(`INSERT INTO {{${tableName}}} (${idName}, version) VALUES($1, $2) RETURNING id`, this.tables),
            [null, null])
            .then((result) => {
                const id = result.rows[0].id;

                this.db.query(updateTableNames(`DELETE FROM {{${tableName}}} WHERE id = $1`, this.tables), [id]).then(
                    () => {
                        resolve(id.toString());
                    }, (error) => {
                        console.log(error);
                        resolve(id.toString());
                    });

            }, (error) => {
                reject(error)
            });
    });
}

function getRunQuery(tableNames) {
    return updateTableNames("SELECT {{runs}}.id, {{rulesets}}.ruleset_id, {{runs}}.run_id, {{runs}}.inputfile, {{runs}}.outputfile, {{runs}}.finishtime, " +
        "{{runs}}.num_errors, {{runs}}.num_warnings, {{runs}}.starttime, {{rulesets}}.version, {{rulesets}}.deleted, {{rulesets}}.owner_group, " +
        "{{runs}}.num_dropped, {{runs}}.summary, {{runs}}.passed, {{runs}}.input_md5, " +
        "{{rulesets}}.rules->'source'->>'filename' as sourceid, {{rulesets}}.rules->'source'->'config'->>'file' as sourcefile " +
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
        droppedcount: row.num_dropped,
        isrunning: isRunning,
        passed: row.passed,
        summary: row.summary,
        version: row.version,
        deleted: row.deleted,
        group: row.owner_group,
        sourceid: row.sourceid,
        sourcefile: row.sourcefile,
        inputmd5: row.input_md5
    };
}

function getRuleset(db, ruleset_id, version, dbId, tables, getDeleted) {

    if ( !ruleset_id && !dbId ) {
        return new Promise( ( resolve, reject ) => {
            reject( "You must specify a name or id" );
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

                resolve( result );

            }, ( error ) => {
                reject( error );
            } );

    } );
}

function checkCanChangeRuleset(db, tables, ruleset, group, admin) {

    return new Promise((resolve, reject) => {
        getRuleset(db, ruleset.filename, null, null, tables, true).then((result) => {

            if (result.rows.length > 0) {

                if(!result.rows[0].deleted) {
                    if (result.rows[0].version != ruleset.version) {
                        reject(`${ruleset.filename} has been changed by another user. Cannot update old version`);
                        return;
                    }

                    if (result.rows[0].owner_group != null && !admin && result.rows[0].owner_group != group) {
                        reject('This has been created by another group and cannot be changed by you. Owner is ' + result.rows[0].owner_group);
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

function getRulesetFromRow(row, ruleset_id, isAdmin, group, ruleLoader) {
    let dbRuleset = row.rules;

    dbRuleset.id = row.id;

    dbRuleset.ruleset_id = ruleset_id;
    dbRuleset.filename = ruleset_id;
    dbRuleset.name = dbRuleset.name || ruleset_id;
    dbRuleset.version = row.version;

    dbRuleset.group = row.group;

    dbRuleset.owner_group = row.owner_group;
    dbRuleset.update_user = row.update_user;
    dbRuleset.update_time = row.update_time;

    if (dbRuleset.owner_group && !isAdmin && dbRuleset.owner_group !== group) {
        dbRuleset.canedit = false;
    } else {
        dbRuleset.canedit = true;
    }

    dbRuleset.deleted = row.deleted;

    return new RuleSet(dbRuleset, ruleLoader);
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

function getRuleResult(row, isAdmin, group, rulesLoader) {
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

    //hide/remove protected items if the user is not authorized
    if(!rule.canedit && rulesLoader && rule.base && rule.config) {

        let baseRule = rulesLoader.rulePropertiesMap[rule.base];

        if(baseRule && baseRule.attributes && baseRule.attributes.ui && baseRule.attributes.ui.properties) {
            baseRule.attributes.ui.properties.forEach((prop) => {

                if(prop.private)
                {
                    if(prop.type === 'string') {
                        rule.config[prop.name] = '********';
                    } else {
                        delete rule.config[prop.name];
                    }
                }

            });
        }
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
