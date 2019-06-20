var config = require('../../config.json');
var AWS = require('aws-sdk');
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const TABLE = config.dynamodb.DYNAMODB_FILE_TABLE_NAME;
const AUDITTABLE = config.dynamodb.DYNAMODB_AUDIT_TABLE_NAME;

exports.getDocuments = function(userEmail){
    var params = {
        ExpressionAttributeValues: {
          ':e' : {S: userEmail}
        },
        KeyConditionExpression: 'Email = :e',
        TableName: TABLE
    };
      
    return ddb.query(params);
};

exports.getDocument = function(user, shareId){
    var params = {
        ExpressionAttributeValues: {
            ':s' : {S: shareId},
            ':o' : {S: user['email']}
        },
        FilterExpression: 'ShareID = :s and Owner = :o',
        TableName: TABLE
    };

    return ddb.scan(params);
};

exports.deleteDocument = function(user, shareId){
    var params = {
        ExpressionAttributeValues: {
            ':s' : {S: shareId},
            ':o' : {S: user['email']}
        },
        KeyConditionExpression: 'ShareID = :s and Owner = :o',
        TableName: TABLE
    };

    return ddb.deleteItem(params);        
};

exports.getDocumentsSharedWithUser = function(fullUser){
    var params = {
        ExpressionAttributeValues: {
            ':fullUser' : {S: fullUser}
          },
        FilterExpression: 'contains (people, :fullUser)',
        TableName: TABLE
    };

    return ddb.scan(params);
};

exports.insertDocument = function(user, fileName, fileKey, size){
    var fileObject = {
        "owner": user["email"],
        "owner_name": user["name"],
        "owner_surname": user["surname"],
        "display_name": fileName,
        "s3_key": fileKey,
        "share_id": uuid.uuid4().hex,
        "sub": user["cognito_name"],
        "size": size,
        "uploaded_at": Date.now(),
        "expires_at": Date.now() + 24
    };

    var params = {
        TableName: TABLE,
        item: fileObject
    };

    return ddb.putItem(params);
};

exports.getFileByShareId = function(shareId){
    var params = {
        IndexName: 'shareID-index',
        ExpressionAttributeValues: {
            ':s' : {S: shareId}
        },
        KeyConditionExpression: 'ShareID = :s',
        TableName: TABLE
    };

    return ddb.query(params);
};

exports.shareDocument = function(owner, shareId, users){
    var params = {
        Key: {"owner": owner, "shareID": shareId},
        ExpressionAttributeValues: {
            ':users' : {S: users}
        },
        UpdateExpression: 'SET people=:users',
        TableName: TABLE
    };

    return ddb.updateItem(params);
};

exports.renameDocument = function(owner, shareId, displayName){
    var params = {
        Key: {"owner": owner, "shareID": shareId},
        ExpressionAttributeValues: {
            ':name' : {S: displayName}
        },
        UpdateExpression: 'SET display_name=:name',
        TableName: TABLE
    };

    return ddb.updateItem(params);
};

exports.scanDocuments = function(){
    var params = {
        TableName: TABLE
    };

    return ddb.scan(params);
};

exports.insertAuditLog = function(user, shareId, fileKey, fileDisplayName, action){
    var auditObject = {
        "owner": user["email"],
        "owner_name": user["name"],
        "owner_surname": user["surname"],
        "display_name": fileDisplayName,
        "s3_key": fileKey,
        "shareID": shareId,
        "action_time": Date.time(),
        "display_time": Date.now(),
        "action": action
    };

    var params = {
        Item: auditObject,
        TableName: AUDITTABLE
    };

    var response = ddb.putItem(params);

    return response;
};

exports.getAuditLogs = function(){
    var params = {
        TableName: AUDITTABLE
    };

    return ddb.scan(params);
};
    
