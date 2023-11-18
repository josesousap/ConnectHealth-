const express = require('express')
const router = express.Router()
const path = require('path')
const multer  = require('multer')

const dbController = import('../../db/dbController.mjs')

const pagesPath = (...args) => path.join(__dirname, '..', 'pages', ...args)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '..', '..', 'db', 'patient', 'exams'))
  },
  filename: (req, file, cb) => {
    const uniquePreffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null,uniquePreffix + file.originalname)
  }
})

const upload = multer({ storage})


router.get('/doctor', async(req, res) => {
  let db = await dbController

  let doctor = await db.getDoctor(req.session.crm)

  if (doctor.password == db.DEFAULT_DOCTOR_PASSWORD) {
    res.sendFile(pagesPath('doctor', 'changepassword.html'))
    return
  }
  res.sendFile(pagesPath('doctor', 'doctor.html'))
})

router.get('/getDoctors', async(req, res) => {
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
  
  db.saveLog(id, 'Recuperou todos os médicos', req.session.userType)
  
  res.send(await db.getAllDoctors())
})
router.get('/getDoctor/:crm', async(req, res) => {
  let db = await dbController
  let crm = req.params.crm.replaceAll('-', '/')

  let id = ''

  switch (req.session.userType) {
    case db.USER_TYPE.Admin: id = '1'
      break;
    case db.USER_TYPE.Doctor: id = req.session.crm
      break;
    case db.USER_TYPE.Patient: id = req.session.cpf
      break
  }
  
  db.saveLog(id, 'Recuperou todos os dados do médico', req.session.userType)
  
  res.send(await db.getDoctor(crm)?? {err:'Medico não encontrado'})
})

router.get('/doctor/login', (req, res) => {
  res.sendFile(pagesPath('doctor', 'login.html'))
})
router.get('/doctor/signup', (req, res) => {
    res.sendFile(pagesPath('doctor', 'signup.html'))
})

router.get('/doctor/download/*/:filename', async(req, res) => {
  let db = await dbController
  let id = ''
console.log('entrou no download')
  switch (req.session.userType) {
    case db.USER_TYPE.Admin: id = '1'
      break;
    case db.USER_TYPE.Doctor: id = req.session.crm
      break;
    case db.USER_TYPE.Patient: id = req.session.cpf
      break
  }
  
  if (req.url.search('/exam/') > -1) {
    res.download(pagesPath('..', '..', 'db', 'patient', 'exams', req.params.filename))

    db.saveLog(id, 'Fez download do exame do paciente', req.session.userType)
    return
  }

  if (req.url.search('/report/') > -1) {
    res.download(pagesPath('..', '..', 'db', 'patient', 'reports', req.params.filename))

    db.saveLog(id, 'Fez download do laudo do paciente', req.session.userType)
    return
  }

  if (req.url.search('/oldexam/') > -1) {
    res.download(pagesPath('..', '..', 'db', 'patient', 'oldexams', req.params.filename))

    db.saveLog(id, 'Fez download de exame antigo do paciente', req.session.userType)
    return
  }

  return res.end('Nenehum arquivo encontrado.')
})

// 
// POST
// 
router.post('/doctor/login', async(req, res) => {
  let db = await dbController
  let user = await db.getDoctor(req.body.crm)
  
  if (user) {
    if (req.body.password == user.password) {
      req.session.crm = user.crm
      req.session.password = user.password
      req.session.userType = db.USER_TYPE.Doctor

      db.saveLog(user.crm, 'Login efetuado', db.USER_TYPE.Doctor)

      res.redirect('/doctor')
    }else {
      db.saveLog(user.crm, 'Senha inserida inválida', db.USER_TYPE.Doctor)
      res.send({text: 'Senha inválida.'})
    }
  }else
    res.send({text: 'Médico não encontrado.'})
})
router.post('/doctor/changepassword', async(req, res) => {
  let db = await dbController
  let user = await db.getDoctor(req.session.crm)
  
  if (user) {
    await db.updateDoctorPassword(user.crm, req.body.password)
    db.saveLog(user.crm, 'Senha alterada', db.USER_TYPE.Doctor)
    res.redirect('/doctor')
  }else
    res.send('Médico não encontrado.')
})
router.post('/doctor/signup', async (req, res) => {
    let db = await dbController
    let data = Object.values(req.body)
    
    let status = await db.createDoctor(...data)

    db.saveLog(1, 'Criação de médico', db.USER_TYPE.Admin)

    res.send(status)
})
router.post('/doctor/schedule', async(req, res) => {
	let db = await dbController
  
	let status = await db.updateDoctorSchedule(req.session.crm, ...Object.values(req.body))

  db.saveLog(req.session.crm, 'Atualização da agenda', db.USER_TYPE.Doctor)
  
	res.send(status)
})
router.post('/doctor/upload/exam', upload.single('exam-file'), async(req, res) => {
	let db = await dbController

  let status = await db.saveExamName(req.body.cpf, req.session.crm, req.file.filename)

  db.saveLog(req.session.crm, 'Upload de exame do paciente', db.USER_TYPE.Doctor)
  
	res.send(status)
})
router.post('/doctor/upload/report', async(req, res) => {
	let db = await dbController
  
  let status = await db.saveReport(req.body.cpf, req.session.crm, req.body.report)

  db.saveLog(req.session.crm, 'Upload do laudo do paciente', db.USER_TYPE.Doctor)
  
	res.send(status)
})


router.put('/doctor', async(req, res) => {
	let db = await dbController
	let data = Object.values(req.body)
	
	let status = await db.updateDoctor(...data)
	
	setTimeout((async() => {
    db.saveLog(1, 'Atualização de dados do médico', db.USER_TYPE.Doctor)
		res.send({text: 'Medico atualizado.'})
  }), 2000)
})

router.delete('/doctor', async(req, res) => {
  let db = await dbController

  let id = ''

  switch (req.session.userType) {
    case db.USER_TYPE.Admin: id = '1'
      var status = await db.deleteDoctor(req.body.crm)

      if (status.code == 200)
        db.saveLog(id, `Deletou médico ID: ${req.body.crm}`, req.session.userType)
      
      return res.send(status);
    case db.USER_TYPE.Doctor: id = req.session.crm
      var status = await db.deleteDoctor(id)

      req.session.destroy()
      // if (status.code == 200)
        // db.saveLog(id, `se deletou}`, req.session.userType)

      return res.send(status);
    default:
      return res.end('Requisição não permitida');
  }

})

module.exports = router