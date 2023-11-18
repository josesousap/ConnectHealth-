const express = require('express')
const { stat } = require('fs')
const router = express.Router()
const path = require('path')

const dbController = import('../../db/dbController.mjs')

const pagesPath = (...args) => path.join(__dirname, '..', 'pages', ...args)


router.get('/schedule', async(req, res) => {
    if (!req.session.cpf)
        res.send('<h1>Necessário fazer login como paciente<h1>')
    else
        res.sendFile(pagesPath('schedule', 'schedule.html'))
})
router.get('/schedules', async(req, res) => {
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
    
    db.saveLog(id, 'Recuperado horarios de consultas disponiveis', req.session.userType)
    
    
    let schedules = await db.getSchedules(req.query.day);
    
    res.send(schedules?? {err: 'Nenhum médico para este dia!'})
})

router.post('/schedule', async(req, res) => {
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

    let status = await db.postSchedule(req.body.doctor, {cpf: req.session.cpf}, req.body.day, req.body.time)
    
    if (status.code != 204) {
        // db.saveLog(id, 'Agendamento de consulta', req.session.userType)
        db.saveLog(req.body.doctor, `ID: ${req.session.cpf}, Consulta agendada`, db.USER_TYPE.Doctor)
        db.saveLog(req.session.cpf, `Doctor iD: ${req.body.doctor}, Consulta agendada`, db.USER_TYPE.Patient)
    }
    
    res.send(status)
})

router.get('/a', (req, res) => {

    res.sendFile(pagesPath('schedule', 'index.html'))
})

module.exports = router;