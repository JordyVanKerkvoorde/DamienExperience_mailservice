require('dotenv').config();
var fs = require('fs');
var pdf = require('html-pdf');
var express = require("express");
var bodyParser = require("body-parser");
const sgMail = require('@sendgrid/mail');
const { ok } = require('assert');

const checkTime = 1000;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

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

app.post("/mailregistration", (req, res) => {
    sendRegistrationConfirmation(req.body);
    res.sendStatus(200);
})

app.get("/certificate/:id", (req, res) => {
    const id = req.params.id;
    res.download(`./certificates/${id}.pdf`);
})

// app.get("/sendcertificate", (req, res) => {
//     sendCertificateMail(0, "Jordy", "Van Kerkvoorde", "jordy.vankerkvoorde@student.hogent.be");
// })


function sendRegistrationConfirmation(body){
    console.log("confirmation")
    const msg = {
        to: [
            {
                email: body.email,
                name: `${body.firstname} ${body.lastname}`
            }
        ], 
        from: {
            email: 'jordy.vankerkvoorde@student.hogent.be',
            name: 'Damien Experience'
        }, 
        template_id: 'd-8f263c458c2b4f6eae85774bc34a8ee9',
        dynamic_template_data: {
            "FirstName": body.firstname,
            "LastName": body.lastname,
            "TourName": body.tourname,
            "Distance": body.distance,
            "Date": body.date
        }
    }
      
    sgMail
    .send(msg)
    .then(() => {
        console.log(`Email registration confirmation to ${body.email} at ${new Date()}`)
    })
    .catch((error) => {
        console.error(error)
    })
}

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

    sendCertificateMail(id, firstname, lastname, email);
}

function sendCertificateMail(id, firstname, lastname, email){
    console.log("certificate")
    setTimeout(() => {
        fs.readFile((`./certificates/${id}.pdf`), (err, data) => {
            if(err){
                console.log(err)
                sendCertificateMail(id, firstname, lastname, email);
            }
            if(data){
                const msg = {
                    to: [
                        {
                            email: email,
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
                        "FirstName": firstname,
                        "LastName": lastname,
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
                    console.log(`Email with certificate sent to ${email} at ${new Date()}`)
                })
                .catch((error) => {
                    console.error(error)
                })
            }
        });
    }, checkTime); 
}

