var fs = require('fs');
var express = require('express');
var resolveEnv = require('resolve-env');
var moment = require('moment');
var app = express();

// -------------------------------------------------------------------------------------------------
// Load models from JSON
//
var leads = ['6-10day', '8-14day'];
var models = {};
// Loop over leads
for (var i = 0 ; i < leads.length ; i++) {
    var lead = leads[i];
    var modelFile = 'models_' + lead + '.json';
    // Read in JSON file
    try {
        models[lead] = JSON.parse(fs.readFileSync(modelFile));
    } catch(err) {
        console.error('Can\'t load models from ' + modelFile);
    }
    // Interpolate all environment variables and date strings (YYYY, etc.) in file_naming_convention
    for (var i = 0 ; i < models[lead].length ; i++) {
        models[lead][i]['file_naming_convention'] = resolveEnv(models[lead][i]['file_naming_convention']);
        models[lead][i]['file_naming_convention'] = models[lead][i]['file_naming_convention'].replace('YYYY', moment().year());
    }
}

// Create a Router object
var router = express.Router();

// Define route for /models - returns JSON of model info
router.get("/models", function(request, response){
    var lead = (typeof request.query.lead === 'undefined') ? '6-10day' : request.query.lead;
    for (var i = 0 ; i < models[lead].length ; i++) {
        models[lead][i]['file_naming_convention'] = resolveEnv(models[lead][i]['file_naming_convention']);
    }
    response.json(models[lead]);
});

// Define route for /models/availability - returns JSON of model info
router.get("/models/availability/:id",function(request, response){
    var lead = (typeof request.query.lead === 'undefined') ? '6-10day' : request.query.lead;
    var id = (typeof request.params.id === 'undefined') ? 0 : request.params.id;
    response.json(isAvailable(models[lead], id));
});

// Set the root URI to start with /api
app.use("/api", router);

// Listen on port 3000
app.listen(3000, function() {
  console.log("Live at Port 3000");
});


function isAvailable(models, id) {
    var file = models[id]['file_naming_convention'];
    console.log(file);
    try {
        fs.accessSync(file);
        return true;
    } catch(err) {
        return false;
    }
}