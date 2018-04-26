module.exports = {
    
    /*
    List functions can return an array or Promise that resolves to an array
    The array must be a list of objects, where each object looks like:
        {label:'item label', value:'item value'}

    The label must be a string, and is the string that is displaed in the list.
    The value can be any JSONisable value, and will the the value set on the property when chosen.
    */
    
    regexList: function(config) {        

        return new Promise((resolve) => {
            let list =  [
                {label: `No numbers in ${config.column}: ^\\D*$`, value: '^\\D*$' },
                {label: `No whitespace in ${config.column}: ^\\S*$`, value: '^\\S*$' },
                {label: `No special characters in ${config.column}: ^[a-zA-Z0-9]*$`, value: '^[a-zA-Z0-9]*$' }
            ];

            resolve(list);
        })
    }
}