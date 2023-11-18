import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

import { jsPDF } from 'jspdf'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultDataPatient = {
    'first-name': 'p', 'last-name': 'p', age: 100,
    weight: 11, height: 12,
    exercise: false,
    cpf: '12312312312', password: '123',
    exams: [
        {'exam-name': '1987128931example.pdf', 'crm': '0000000'}
    ],
    reports: [
        {'report-name': '1987131example.pdf', 'crm': '0000000'}
    ],
    'old-exams': [
        {'exam-name': 'oldexamg.pdf'}
    ]
}
const defaultDataDoctor = {
    'first-name': 'd', 'last-name': 'd', age: 120,
    weight: 30, height: 31,
    crm: '22/12390', password: 123,
    'schedule': {
        monday: {'08:00': [], '14:00': []}
    }
}
export const DEFAULT_DOCTOR_PASSWORD = '123'
const defaultDataLogs = {
    id: [
        { id: 'user id', date: 'dd/mm/yyyy', hours: '12:00', action: 'Example log.' }
    ]
}


const adapterPatient = new JSONFile(join(__dirname, 'patient.json'))
const adapterDoctor = new JSONFile(join(__dirname, 'doctor.json'))

const adapterAdminLog = new JSONFile(join(__dirname, 'logs', 'admin', 'log.json'))
const adapterDoctorLog = new JSONFile(join(__dirname, 'logs', 'doctors', 'log.json'))
const adapterPatientLog = new JSONFile(join(__dirname, 'logs', 'patients', 'log.json'))


const dbPatient = new Low(adapterPatient, [defaultDataPatient])
const dbDoctor = new Low(adapterDoctor, [defaultDataDoctor])

const dbAdminLogs = new Low(adapterAdminLog, defaultDataLogs)
const dbDoctorLogs = new Low(adapterDoctorLog, defaultDataLogs)
const dbPatientLogs = new Low(adapterPatientLog, defaultDataLogs)

await dbPatient.write()
await dbDoctor.write()

await dbAdminLogs.write()
await dbDoctorLogs.write()
await dbPatientLogs.write()



export const USER_TYPE = {
    Admin: 'a',
    Doctor: 'd',
    Patient: 'p'
}

// 
// Logs
export async function saveLog(id, action, userType) {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;


    let hours = today.getHours();
    let minutes = today.getMinutes();
    
    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;

    const formattedDate = dd + '/' + mm + '/' + yyyy;
    const formattedTime = hours + ':' + minutes

    switch (userType) {
        case USER_TYPE.Admin:
            await dbAdminLogs.read();

            var users = await dbAdminLogs.data;
            var user = users['1']??= []
            user.push({ id: '1', date: formattedDate, hours: formattedTime, action: action })

            await dbAdminLogs.write()
            return;

        case USER_TYPE.Doctor:
            await dbDoctorLogs.read();
            await dbDoctor.read();
            
            for (let user of await dbDoctor.data) {
                if (user.crm == id) {
                    var logData = await dbDoctorLogs.data
                    
                    logData[user.crm]??= []
                    logData[user.crm].push({ id: user.crm, date: formattedDate, hours: formattedTime, action: action })
                }
            }

            await dbDoctorLogs.write()
            return;
            
        case USER_TYPE.Patient:
            await dbPatientLogs.read();
            await dbPatient.read();

            for (let user of await dbPatient.data) {
                if (user.cpf == id) {
                    var logData = await dbPatientLogs.data 
                    
                    logData[user.cpf]??= []
                    logData[user.cpf].push({ id: user.cpf, date: formattedDate, hours: formattedTime, action: action })
                }
            }

            await dbPatientLogs.write()
            return;
    }
    
    return {text: 'USER_TYPE nao encontrado'}
}

export async function getUserLogs(id, userType) {

    switch (userType) {
        case USER_TYPE.Admin:
            await dbAdminLogs.read();

            var users = await dbAdminLogs.data;
            var user = users['1']

            return user;

        case USER_TYPE.Doctor:
            await dbDoctorLogs.read();
            await dbDoctor.read();
            
            for (let user of await dbDoctor.data) {
                if (user.crm == id) {
                    var logData = await dbDoctorLogs.data
                    var logs = []
                    for (let log of logData[user.crm]) {
                        if (log.action.includes('Consulta agendada'))
                            logs.push(log)
                    }
                    
                    return logs
                }
            }

            return {text: "Medico nao registrado"}
            
        case USER_TYPE.Patient:
            await dbPatientLogs.read();
            await dbPatient.read();

            for (let user of await dbPatient.data) {
                if (user.cpf == id) {
                    var logData = await dbPatientLogs.data 
                    var logs = []
                    for (let log of logData[user.cpf]) {
                        if (log.action.includes('Consulta agendada'))
                            logs.push(log)
                    }
                    
                    return logs
                }
            }

            return {text: "Paciente nao registrado"};
    }
}

export async function getAllLogs() {

    switch (userType) {
        case USER_TYPE.Admin:
            await dbAdminLogs.read();

            var users = await dbAdminLogs.data;
            var user = users['1']

            return user;

        case USER_TYPE.Doctor:
            await dbDoctorLogs.read();
            await dbDoctor.read();
            
            for (let user of await dbDoctor.data) {
                if (user.crm == id) {
                    var logData = await dbDoctorLogs.data
                    var logs = []
                    for (let log of logData[user.crm]) {
                        if (log.action.includes('Consulta agendada'))
                            logs.push(log)
                    }
                    
                    return logs
                }
            }

            return {text: "Medico nao registrado"}
            
        case USER_TYPE.Patient:
            await dbPatientLogs.read();
            await dbPatient.read();

            for (let user of await dbPatient.data) {
                if (user.cpf == id) {
                    var logData = await dbPatientLogs.data 
                    var logs = []
                    for (let log of logData[user.cpf]) {
                        if (log.action.includes('Consulta agendada'))
                            logs.push(log)
                    }
                    
                    return logs
                }
            }

            return {text: "Paciente nao registrado"};
    }
}


export async function getPatient(cpf) {
    await dbPatient.read()
    var patient = null

    for (let user of await dbPatient.data) {
        if (user.cpf == cpf)
            patient = user
    }
    
    return patient
}

export async function getAllPatients() {
    await dbPatient.read()
    
    return dbPatient.data
}

export async function createPatient(firstName, lastName, age, weight, height, exercise, cpf, password) {
    await dbPatient.read()

    for (let user of await dbPatient.data)
        if (user.cpf == cpf)
            return {code: 204, text: 'CPF ja cadastrado'}

    let data = {
        'first-name': firstName,
        'last-name': lastName,
        age: age,
        weight: weight,
        height: height,
        exercise: exercise,
        cpf: cpf,
        password: password,
        exams: [],
        reports: [],
        'old-exams': []
    }
    


    dbPatient.data.push(data)
    await dbPatient.write()
    return {code: 200, text: 'Conta criada com sucesso!'}
}

export async function updatePatient(firstName, lastName, age, weight, height, cpf, password) {
    await dbPatient.read()

    for (let user of await dbPatient.data) {
        if (user.cpf == cpf) {
            user['first-name'] = firstName
            user['last-name'] = lastName
            user.age = age
            user.weight = weight
            user.height = height
            user.cpf = cpf
            // user.password = password
        }
    }

    await dbPatient.write()
    return {code: 200, text: 'Conta ATUALIZADA com sucesso!'}
}

export async function getPatientExams(cpf) {
    await dbPatient.read()
    var patient = null

    for (let user of await dbPatient.data) {
        if (user.cpf == cpf)
            patient = user
    }

    return patient.exams
}

export async function getPatientOldExams(cpf) {
    await dbPatient.read()
    var patient = null

    for (let user of await dbPatient.data) {
        if (user.cpf == cpf)
            patient = user
    }

    return patient['old-exams']
}

export async function getPatientReports(cpf) {
    await dbPatient.read()
    var patient = null

    for (let user of await dbPatient.data) {
        if (user.cpf == cpf)
            patient = user
    }
    
    return patient.reports
}

export async function deletePatient(cpf) {
    await dbPatientLogs.read();
    await dbPatient.read()

    var usersData = await dbPatient.data

    for (let user of usersData) {
        if (user.cpf == cpf) {
            var logData = await dbPatientLogs.data
            usersData.splice(usersData.indexOf(user), 1)
            delete logData[user.cpf]

            await dbPatient.write()
            await dbPatientLogs.write()
            return {code: 200, text: "Paciente deletado"}
        }
    }

    return {code: 204, text: "Paciente nao registrado"};
}








export async function getDoctor(crm) {
    await dbDoctor.read()
    
    var doctor = null

    for (let user of await dbDoctor.data) {
        if (user.crm == crm)
            doctor = user
    }
    
    return doctor
}

export async function getAllDoctors() {
    await dbDoctor.read()
    
    return dbDoctor.data
}

export async function createDoctor(firstName, lastName, age, weight, height, crm) {
    await dbDoctor.read()
    // let len = Object.keys(dbDoctor.data).length
    
    // let date = new Date()
    // let crm = Number(""+date.getFullYear() + (date.getMonth()+1) + (date.getDay()+1)) + len
    
    for (let user of await dbDoctor.data)
        if (user.crm == crm)
            return {code: 204, text: 'CRM ja cadastrado'}
    
    let data = {
        'first-name': firstName,
        'last-name': lastName,
        age: age,
        weight: weight,
        height: height,
        crm: crm,
        password: DEFAULT_DOCTOR_PASSWORD,
        schedule: {}
    }


    dbDoctor.data.push(data)
    await dbDoctor.write()
    return {code: 200, text: 'Conta criada com sucesso!'}
}

export async function updateDoctor(firstName, lastName, age, weight, height, crm) {
    await dbDoctor.read()

    for (let user of await dbDoctor.data) {
        if (user.crm == crm) {
            user['first-name'] = firstName
            user['last-name'] = lastName
            user.age = age
            user.weight = weight
            user.height = height
            user.crm = crm
        }
    }

    await dbDoctor.write()
    return {code: 200, text: 'Conta ATUALIZADA com sucesso!'}
}

export async function updateDoctorPassword(crm, newPassword) {
    await dbDoctor.read()

    for (let user of await dbDoctor.data) {
        if (user.crm == crm) {
            user.password = newPassword
        }
    }

    await dbDoctor.write()
    return {code: 200, text: 'Senha atualizada!'}
}

export async function updateDoctorSchedule(crm, day, time) {
    await dbDoctor.read()

    for (let user of await dbDoctor.data) {
        if (user.crm == crm) {
            user.schedule[day]??= {}
            user.schedule[day][time]??= []
        }
    }

    await dbDoctor.write()
    return {code: 200, text: 'Agenda atualizada'}
}

export async function deleteDoctor(crm) {
    await dbDoctorLogs.read();
    await dbDoctor.read()

    var usersData = await dbDoctor.data

    for (let user of usersData) {
        if (user.crm == crm) {
            var logData = await dbDoctorLogs.data
            usersData.splice(usersData.indexOf(user), 1)
            delete logData[user.crm]

            await dbDoctor.write()
            await dbDoctorLogs.write()
            return {code: 200, text: "Médico deletado"}
        }
    }

    return {code: 204, text: "Médico nao registrado"};
}




// Schedules
export async function getSchedules(day) {
    await dbDoctor.read()
    let schedules = []
    
    for (let user of await dbDoctor.data) {
        if (user.schedule[day]) {
            let index = 0

            for (let dayTime in user.schedule[day]) {
                if (index > 0) {
                    schedules[schedules.length-1].time.push(dayTime)
                    continue
                }

                let scheduleTime = user.schedule[day][dayTime]
                if (scheduleTime?.length < 12) {
                    let fullName = user['first-name']+' '+user['last-name'];
                    schedules.push({fullName, crm: user.crm, time: [dayTime]})
                    index++
                }
            }
        }
    }

    return schedules;
}

export async function postSchedule(crm, patient, day, time) {
    await dbDoctor.read()
    
    for (let user of await dbDoctor.data) {
        if (user.crm == crm && user.schedule[day]) {
            if (user.schedule[day][time]?.length < 12) {
                user.schedule[day][time].push(patient)

                await dbDoctor.write()
                
                return {code: 200, text: 'Consulta agendada'}
            } else {
                return {code: 204, text: 'Maximo de agendamentos'}
            }
        }
    }
}



// 
// Exams
export async function saveExamName(cpf, crm, filename) {
    await dbPatient.read()
    
    for (let user of await dbPatient.data) {
        if (user.cpf == cpf)
            user.exams.push({'exam-name': filename, 'crm': crm})
    }

    await dbPatient.write();

    return {code: 200, text: 'Exame enviado'}
}
// Old Exams
export async function saveOldExamName(cpf, filename) {
    await dbPatient.read()

    for (let user of await dbPatient.data) {
        if (user.cpf == cpf)
            user['old-exams'].push({'exam-name': filename})
    }

    await dbPatient.write();

    return {code: 200, text: 'Exame antigo enviado'}
}

// 
// Report
async function generateReport(cpf, crm, report, filename, patientName, doctorName) {
    var doc = new jsPDF()
    doc.text('CONNECTHEALTH', 100, 10, 'center').setFontSize(20);

    doc.setFontSize(12)
    doc.text(`
        Nome do paciente: ${patientName}   cpf: ${cpf} \n
        Nome do médico: ${doctorName}     crm: ${crm} \n
        \n\n
        Laudo: ${report}
    `, 30, 15, 'left')
    doc.save(join(__dirname, 'patient', 'reports', filename))
}

export async function saveReport(cpf, crm, report) {
    await dbPatient.read()
    let filename = '';
    let patientName = '';
    let doctorName = '';

    for (let user of await dbPatient.data) {
        if (user.cpf == cpf) {
            filename = Date.now() + '-' + user['first-name'] + '_' + user['last-name'] + '.pdf';
            patientName = user['first-name'] + ' ' + user['last-name']
            
            user.reports.push({'report-name': filename, 'crm': crm})
        }
    }

    await dbDoctor.read()
    
    for (let user of await dbDoctor.data) {
        if (user.crm == crm)
            doctorName = user['first-name'] + ' ' + user['last-name']
    }

    generateReport(cpf, crm, report, filename, patientName, doctorName)

    await dbPatient.write();

    return {code: 200, text: 'Laudo enviado'}
}





export default this