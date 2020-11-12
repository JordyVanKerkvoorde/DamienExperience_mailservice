var fs = require('fs');
var pdf = require('html-pdf');
var express = require("express");
var bodyParser = require("body-parser");

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000, () => {
 console.log("Server running on port 3000");
});

app.post("/certificate", (req, res) =>{
    var id = req.body.id
    var name = req.body.name;
    var distance = req.body.distance;
    var date = req.body.date;

    createCertificate(id, name, distance, date);

    res.sendStatus(200);
});

app.get("/getcertificate/:id", (req, res) => {
    const id = req.params.id;
    res.download(`./certificates/${id}.pdf`);
})


function createCertificate(id, name, distance, date){
    var html = fs.readFileSync('./templates/certificate.html', 'utf8');
    var options = { 
        format: 'Letter'
    };
    
    html = html.replace('<h2 id="naam"></h2>', `<h2 id="naam">${name}</h2>`);
    html = html.replace('<h2 id="distance"></h2>', `<h2 id="distance">${distance}</h2>`);
    html = html.replace('<h2 id="date"></h2>', `<h2 id="date">${date}</h2>`);

    pdf.create(html, options).toFile(`./certificates/${id}.pdf`, function(err, res) {
    if (err) return console.log(err);
    console.log(res);
    });
}

