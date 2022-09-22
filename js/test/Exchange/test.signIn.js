'use strict'

// ----------------------------------------------------------------------------

const assert = require ('assert')

// ----------------------------------------------------------------------------


module.exports = async (exchange) => {

    const method = 'signIn'

    if (exchange.has[method]) {

        await exchange[method] (code)

        console.log (method + ' successful')

    } else {

        console.log (method + '() is not supported')
    }
}
