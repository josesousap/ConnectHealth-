const express = require('express')
const session = require('express-session');
const path = require('path')
const app = express()

const dbController = import('./db/dbController.mjs')

// Routers
const patientRouter = require("./src/routes/patient")
const doctorRouter = require("./src/routes/doctor");
const adminRouter = require("./src/routes/admin");
const scheduleRouter = require("./src/routes/schedule");


const port = 3000
const pagesPath = (...args) => path.join(__dirname, 'src', 'pages', ...args)



// var expiryDate = new Date( Date.now() + 60 * 60 * 1000 ); // 1 hour
app.use(session({
    name: 'session',
    keys: ['key1', 'key2'],
    secret : 'whyar3iurunnin2',
    resave: true,
    saveUninitialized: true,
    cookie: { 
      secure: false, 
      httpOnly: true
    }
  })
);
app.use(express.json());                        // to support JSON-encoded bodies
app.use(express.urlencoded({extended: true})); // to support URL-encoded bodies


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

async function checkPatientExists(req, res) {
  if (req.session.userType == 'a') {
    return true
  }

  if (!req.session.cpf) {
    res.redirect('/patient/login')
    return false
  }
  else {
    let db = await dbController
    // Verificar se paciente existe. evitar erro de cookies
    let user = await db.getPatient(req.session.cpf)

    if (user == null) {
      res.redirect('/patient/login')
      return false
    }

    return true
  }
}
async function checkDoctorExists(req, res) {
  if (req.session.userType == 'a') {
    return true
  }
  
  if (!req.session.crm) {
    res.redirect('/doctor/login')
    return false
  }
  else {
    let db = await dbController
    // Verificar se medico existe. evitar erro de cookies
    let user = await db.getDoctor(req.session.crm)

    if (user == null) {
      res.redirect('/doctor/login')
      return false
    }

    return true
  }
}

app.use('/patient/', async(req, res, next) => {
  if (req.url != "/login") {
    if (req.url == "/signup") {
      next()
      return
    }
    if (!await checkPatientExists(req, res))
      return
  }

  next()
})
app.use('/doctor/', async(req, res, next) => {
  if (req.url != "/login") {
    if (req.url == "/signup") {
      next()
      return
    }
    if (req.url.includes("/download/")) {
      next()
      return
    }
    if (!await checkDoctorExists(req, res))
      return
  }
  
  next()
})

// Routers
app.use(patientRouter)
app.use(doctorRouter)
app.use(adminRouter)
app.use(scheduleRouter)



// Arquivos estaticos
app.use(express.static(path.join(__dirname, 'public')))
app.use('/css', express.static(path.join(__dirname , 'node_modules', 'bootstrap', 'dist', 'css')))
app.use('/js', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js')))


app.disable('x-powered-by');
app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})