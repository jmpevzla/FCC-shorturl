/*

Click on Add Trigger and set the following values to the corresponding fields.

Trigger Type: Database
Name : Auto_Increment_Trigger
Enabled : ON
Event Overriding : ON
Link Data Sources(s) : <the clusters and data lakes you like to access>
Cluster Name : <your cluster name>
Database Name : <your database name>
Collection Name : students
Operation Type : Insert
Full Document : ON
Select An Event Type : Function

*/

exports = async function(changeEvent) {
  var docId = changeEvent.fullDocument._id;
    
  const countercollection = context.services.get("<YOUR CLUSTER>").db(changeEvent.ns.db).collection("counters");
  const urlcollection = context.services.get("<YOUR CLUSTER>").db(changeEvent.ns.db).collection(changeEvent.ns.coll);
  
  var counter = await countercollection.findOneAndUpdate({_id: changeEvent.ns },{ $inc: { seq_value: 1 }}, { returnNewDocument: true, upsert : true});
  var updateRes = await urlcollection.updateOne({_id : docId},{ $set : {short_url : counter.seq_value}});
  
  console.log(`Updated ${JSON.stringify(changeEvent.ns)} with counter ${counter.seq_value} result : ${JSON.stringify(updateRes)}`);
    
};
