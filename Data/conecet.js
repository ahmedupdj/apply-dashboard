const { connect, set } = require('mongoose');
const MongoDbUrl = 'mongodb+srv://ofbusiness85:Xz6GzRWYxO4RF43u@inyhdgiahejfu.rnqz2sr.mongodb.net/'

async function connectToDatabase() {
    try {
        await connect(MongoDbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(async (connection) => {
            await console.log(`a7a7 ${connection.connections[0].name}`);
        });
    } catch (error) {
        console.log('a7a4');
        console.error(error);
    }
}



module.exports = connectToDatabase;