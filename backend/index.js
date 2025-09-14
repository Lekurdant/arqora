const express = require('express');
const fs = require("fs")
// const https = require("https");
const multer = require('multer');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
/* const options = {
  key: fs.readFileSync("/etc/ssl/private/nocodebaby.com_key.txt"),
  cert: fs.readFileSync("/etc/ssl/public/nocodebaby.com.crt")
}; */
require('dotenv').config(); // Charger les variables d'environnement

// Import des routes du blog
const blogRoutes = require('./blog');

// Enable CORS for all routes
app.use(cors());

// Use body-parser middleware to parse non-file fields as well
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Ajout du support JSON

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static('uploads'));

// Utiliser les routes du blog
app.use('/api', blogRoutes);

// Set up storage engine using multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/'); // Make sure this uploads directory exists
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.pdf');
    console.log("File saved")
  }
 
});

const upload = multer({ storage: storage }).array('pdfs[]');

app.post('/upload-pdfs', upload, async (req, res) => {
  console.log("Requested");
  console.log(req.files); // Log the uploaded files, if any
  console.log(req.body);  // Log the other form fields

  const files = req.files;
  const answers = req.body;

  // Nettoyage des données reçues qui sont au format JSON string
  const clientData = {};
  for (const key in answers) {
    try {
      clientData[key] = JSON.parse(answers[key]);
    } catch (e) {
      clientData[key] = answers[key]; // Garder la valeur brute si ce n'est pas du JSON
    }
  }

  // Set up nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",  // Serveur SMTP de GoDaddy
    port: 465,                        // Port SSL de GoDaddy
    secure: true,                     // GoDaddy requiert une connexion sécurisée (SSL)
    auth: {
      user: 'team@nocodebaby.com',
      pass: process.env.EMAIL_PASSWORD // Utilisation de la variable d'environnement
    },
    tls: {
      rejectUnauthorized: false
    }
  });


   // Prepare the HTML content for the email
   const htmlContent = `
   <p>You have received a new client request with the following details:</p>
   <ul>
     <li>Lastname: ${clientData.lastname || 'Not provided'}</li>
     <li>Firstname: ${clientData.firstname || 'Not provided'}</li>
     <li>Phone: ${clientData.phone || 'Not provided'}</li>
     <li>CDC: ${clientData.cdc || 'Not provided'}</li>
     <li>Design: ${clientData.design || 'Not provided'}</li>
     <li>Budget: ${clientData.budget || 'Not provided'}</li>
     <li>Email: ${clientData.email || 'Not provided'}</li>
   </ul>
 `;

  // Prepare email options
  const mailOptions = {
    from: 'team@nocodebaby.com',
    to: 'team@nocodebaby.com', // Should be replaced with the recipient's email address
    subject: 'New Client Request',
    text: 'You have received a new client request: ',
    html: htmlContent,
    // Conditionally add attachments if files are present
    ...(files.length > 0 && {
      attachments: files.map(file => ({
        filename: file.filename,
        path: file.path
      }))
    })
  };
    // Prepare the HTML content for the email
    const htmlContentClient = `
    <p>Merci ${clientData.firstname || ''} ${clientData.lastname || ''} !</p>
    <p>Nous avons bien recu les details de votre projet. Vous serez contacté par notre équipe dans les plus bref délai:</p>
    
  `;
  // Prepare email options
  const mailClientOptions = {
    from: 'team@nocodebaby.com',
    to: clientData.email, // Utilisation de l'email nettoyé
    subject: 'Merci de nous avoir contacté',
   html: htmlContentClient,
 
  };

  // Attempt to send the email
  try {
    let emailInfo = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + emailInfo.response);
    let info = await transporter.sendMail(mailClientOptions);
    console.log('Email sent: ' + info.response);
    res.json({ success: 'Files uploaded and email sent!', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email', error);
    res.status(200).json({ error: 'Error sending email', details: error.message });
  }
});

// Utiliser le port 3001 pour éviter les conflits
const port = 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Forcer le processus à rester en vie pour le débogage
setInterval(() => {
  console.log('Server is alive...');
}, 5000);
