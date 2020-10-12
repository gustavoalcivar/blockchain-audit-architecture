const driver = require('bigchaindb-driver')
const os = require('os')

const API_PATH = 'http://localhost:9984/api/v1/'

const key = new driver.Ed25519Keypair()

const createTransaction = async (database, table, transaction, user, data) => {
    const tx = driver.Transaction.makeCreateTransaction(
        JSON.parse(data),
        { host: os.hostname(), database, table, transaction, user, datetime: new Date().toString() },
        [ driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(key.publicKey))
        ],
        key.publicKey
    )
    
    return await new driver.Connection(API_PATH).postTransactionCommit(driver.Transaction.signTransaction(tx, key.privateKey))
}

createTransaction(
    process.argv.slice(2)[0],
    process.argv.slice(2)[1],
    process.argv.slice(2)[2],
    process.argv.slice(2)[3],
    process.argv.slice(2)[4]
)
.then(resp => console.log('Transaction', resp.id, 'successfully posted.'))
.catch(err => console.log(err))
