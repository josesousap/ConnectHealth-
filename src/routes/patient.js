const express = require('express')
const router = express.Router()
const path = require('path')
const multer  = require('multer')

const dbController = import('../../db/dbController.mjs')

const pagesPath = (...args) => path.join(__dirname, '..', 'pages', ...args)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '..', '..', 'db', 'patient', 'oldexams'))
  },
  filename: (req, file, cb) => {
    const uniquePreffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null,uniquePreffix + file.originalname)
  }
})

const upload = multer({ storage})


router.get('/patient', async(req, res) => {
  res.sendFile(pagesPath('patient', 'patient.html'))
})

router.get('/getPatients', async(req, res) => {
  let db = await dbController

  let id = ''

  switch (req.session.userType) {
    case db.USER_TYPE.Admin: id = '1'
      break;
    case db.USER_TYPE.Doctor: id = req.session.crm
      break;
    case db.USER_TYPE.Patient: id = req.session.cpf
      break
  }
  
  db.saveLog(id, 'Recuperou todos os pacientes', req.session.userType)
  
  res.send(await db.getAllPatients())
})

router.get('/getPatient', async(req, res) => {
  let db = await dbController

  let id = ''

  switch (req.session.userType) {
    case db.USER_TYPE.Admin: id = '1'
      break;
    case db.USER_TYPE.Doctor: id = req.session.crm
      break;
    case db.USER_TYPE.Patient: id = req.session.cpf
      break
  }

  db.saveLog(id, 'Recuperou dados do paciente', req.session.userType)
  
  res.send(await db.getPatient(req.session.cpf)?? {err:'Usuário não encontrado'})
})

router.get('/getPatient/:cpf', async(req, res) => {
  let db = await dbController

  let id = ''

  switch (req.session.userType) {
    case db.USER_TYPE.Admin: id = '1'
      break;
    case db.USER_TYPE.Doctor: id = req.session.crm
      break;
    case db.USER_TYPE.Patient: id = req.session.cpf
      break
  }
  
  db.saveLog(id, 'Recuperou todos os dados do paciente', req.session.userType)
  
  res.send(await db.getPatient(req.params.cpf)?? {err:'Usuário não encontrado'})
})

router.get('/patient/login', (req, res) => {
  res.sendFile(pagesPath('patient', 'login.html'))
})
router.get('/patient/signup', (req, res) => {
  res.sendFile(pagesPath('patient', 'signup.html'))
})

router.get('/getExams', async(req, res) => {
  let db = await dbController

  let id = ''

  switch (req.session.userType) {
    case db.USER_TYPE.Admin: id = '1'
      break;
    case db.USER_TYPE.Doctor: id = req.session.crm
      break;
    case db.USER_TYPE.Patient: id = req.session.cpf
      break
  }
  
  db.saveLog(id, 'Recuperou exames do paciente', req.session.userType)
  
  res.send(await db.getPatientExams(req.session.cpf)?? {err:'Sem exames.'})
})
router.get('/getOldExams', async(req, res) => {
  let db = await dbController

  let id = ''

  switch (req.session.userType) {
    case db.USER_TYPE.Admin: id = '1'
      break;
    case db.USER_TYPE.Doctor: id = req.session.crm
      break;
    case db.USER_TYPE.Patient: id = req.session.cpf
      break
  }
  
  db.saveLog(id, 'Recuperou exames antigos do paciente', req.session.userType)
  
  res.send(await db.getPatientOldExams(req.session.cpf)?? {err:'Sem exames antigos.'})
})
router.get('/getReports', async(req, res) => {
  let db = await dbController

  let id = ''

  switch (req.session.userType) {
    case db.USER_TYPE.Admin: id = '1'
      break;
    case db.USER_TYPE.Doctor: id = req.session.crm
      break;
    case db.USER_TYPE.Patient: id = req.session.cpf
      break
  }

  db.saveLog(id, 'Recuperou laudos do paciente', req.session.userType)

  res.send(await db.getPatientReports(req.session.cpf)?? {err:'Sem laudos.'})
})
// 
// POST
// 

router.post('/patient/login', async(req, res) => {
  let db = await dbController
  let user = await db.getPatient(req.body.username)
  
  if (user) {
    if (req.body.password == user.password) {
      req.session.cpf = user.cpf
      req.session.password = user.password
      req.session.userType = db.USER_TYPE.Patient
      
      db.saveLog(user.cpf, 'Login efetuado', db.USER_TYPE.Patient)
      
      res.redirect('/patient')
    }else {
      db.saveLog(user.cpf, 'Senha inserida inválida', db.USER_TYPE.Patient)
      res.send({text: 'Senha inválida.'})
    }
  }else
    res.send({text: 'Usuario não encontrado.'})
})

router.post('/patient/signup', async(req, res) => {
  let db = await dbController
  let data = Object.values(req.body)
  
  let status = await db.createPatient(...data)

  if (status.code == 204)
    return res.end(status.text)

  res.redirect('/patient/login')
})

router.post('/patient/upload/oldexam', upload.single('oldexam-file'), async(req, res) => {
	let db = await dbController

  await db.saveOldExamName(req.session.cpf, req.file.filename)

  db.saveLog(req.session.crm, 'Upload de exame do paciente', db.USER_TYPE.Doctor)
  
	res.end('Arquivo recebido')
})


router.put('/patient', async(req, res) => {
  let db = await dbController
  let data = Object.values(req.body)

  let status = await db.updatePatient(...data)

  setTimeout((async() => {
    db.saveLog('1', 'Atualização dos dados do paciente', db.USER_TYPE.Admin)
    res.send({text: 'Paciente atualizado.'})
    }), 2000)
})

router.delete('/patient', async(req, res) => {
  let db = await dbController

  let id = ''

  switch (req.session.userType) {
    case db.USER_TYPE.Admin: id = '1'
      var status = await db.deletePatient(req.body.cpf)

      if (status.code == 200)
        db.saveLog(id, `Deletou paciente ID: ${req.body.cpf}`, req.session.userType)
      
      return res.send(status);
    case db.USER_TYPE.Patient: id = req.session.cpf
      var status = await db.deletePatient(id)

      req.session.destroy()
      // if (status.code == 200)
        // db.saveLog(id, `se deletou}`, req.session.userType)

      return res.send(status);
    default:
      return res.end('Requisição não permitida');
  }

})

module.exports = router