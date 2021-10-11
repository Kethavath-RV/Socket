const redis = require('redis');
const client = redis.createClient()

function insertValuesIntoRedis(collectionName, key, value){
    client.hmset(collectionName, key, value, (err, res)=>{
        if(!err){
            console.log("Stored Succesfully")
            return true;
        }
    })
}   

function getValuesFromRedis(collectionName, key){
    client.hmget(collectionName, key, (err, res)=>{
        if(!err){
            console.log("data retrieved successfully", res)
            return res
        }
    })
}

module.exports = {insertValuesIntoRedis, getValuesFromRedis}