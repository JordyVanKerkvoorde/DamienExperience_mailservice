require('dotenv').config();
var fs = require('fs');
var pdf = require('html-pdf');
var express = require("express");
var bodyParser = require("body-parser");
const sgMail = require('@sendgrid/mail');

const checkTime = 1000;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000, () => {
 console.log("Server running on port 3000");
});

//curl -d "id=1&firstname=Jordy&lastname=Van Kerkvoorde&email=jordy.vankerkvoorde@student.hogent.be&distance=100km&date=14 mei 2020" -X POST http://localhost:3000/mailcertificate
app.post("/mailcertificate", (req, res) =>{
    console.log(req.body)
    var id = req.body.id;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var distance = req.body.distance;
    var date = req.body.date;
    
    createCertificate(id, firstname, lastname, email, distance, date);

    res.sendStatus(200);
});

app.get("/certificate/:id", (req, res) => {
    const id = req.params.id;
    res.download(`./certificates/${id}.pdf`);
})

// app.get("/sendcertificate", (req, res) => {
//     sendCertificateMail(0);
// })


function createCertificate(id, firstname, lastname, email, distance, date){
    var html = fs.readFileSync('./templates/certificate.html', 'utf8');
    var options = { 
        format: 'Letter'
    };
    
    html = html.replace('<h2 id="naam"></h2>', `<h2 id="naam">${firstname} ${lastname}</h2>`);
    html = html.replace('<h2 id="distance"></h2>', `<h2 id="distance">${distance}</h2>`);
    html = html.replace('<h2 id="date"></h2>', `<h2 id="date">${date}</h2>`);

    pdf.create(html, options).toFile(`./certificates/${id}.pdf`, function (err, res) {
        if (err)
            return console.log(err);
        console.log(res);
    });

    //sendCertificateMail(id, firstname, lastname, email);
}

function sendCertificateMail(id, firstname, lastname, email){
    setTimeout(() => {
        fs.readFile((`./certificates/${id}.pdf`), (err, data) => {
            if(err){
                console.log(err)
                sendCertificateMail();
            }
            if(data){
                const msg = {
                    to: [
                        {
                            email: `${email}`,
                            name: `${firstname} ${lastname}`
                        }
                    ], 
                    from: {
                        email: 'jordy.vankerkvoorde@student.hogent.be',
                        name: 'Damien Experience'
                    }, 
                    //subject: 'Sending with SendGrid is Fun',
                    template_id: 'd-cb844c22ba3e444fb0be079a8196acff',
                    dynamic_template_data: {
                        "FirstName": "Jordy",
                        "LastName": "Van Kerkvoorde",
                    },
                    attachments: [
                        {
                            content: data.toString('base64'),
                            filename: 'certificate.pdf',
                            type: 'application/pdf',
                            disposition: 'attachment'
                        }
                    ]
                }
                  
                sgMail
                .send(msg)
                .then(() => {
                    console.log('Email sent')
                })
                .catch((error) => {
                    console.error(error)
                })
            }
        });
    }, checkTime); 
}

