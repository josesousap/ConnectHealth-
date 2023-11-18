const express = require('express')
const router = express.Router()
const path = require('path')

const dbController = import('../../db/dbController.mjs')

const pagesPath = (...args) => path.join(__dirname, '..', 'pages', ...args)


router.get('/admin', (req, res) => {
  if (req.session.userType == 'a' && !req.session.crm && !req.session.cpf) {
    res.sendFile(pagesPath('admin', 'admin.html'))
  } else
    res.sendFile(pagesPath('admin', 'login.html'))
})

router.get('/getUserLogs', async (req, res) => {
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

  // db.saveLog(id, 'Recuperou logs', req.session.userType)

  let logs = await db.getUserLogs(id, req.session.userType);
  
  res.send(logs)
})

router.post('/admin', (req, res) => {
  if (req.body?.password == "123") {
    delete req.session.cpf
    delete req.session.crm

    req.session.userType = 'a'
    res.redirect('/admin')
  } else {
    res.redirect('admin')
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy()

  res.send('<script>alert("Você deslogou");setInterval(function () {location.href = "/"}, 300);</script>')
})

module.exports = router