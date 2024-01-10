import mysql from "mysql";
import revisarCookie from "./revisarCookies.js";
import dotenv from "dotenv";
import path from 'path';
import bcryptjs from "bcryptjs";
import revisarCookie2 from "./revisarCookie2.js";


dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'sql5.freemysqlhosting.net',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  database: 'sql5671391'
});

async function getStudents() {
  return new Promise((resolve, reject) => {
    pool.query('SELECT students.*, coaches.username FROM students LEFT JOIN coaches ON students.studentCoach = coaches.id', function (err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
async function getBillById(id) {
  try {
    const bills = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT bills.*, coaches.name AS coachName, coaches.surname AS coachSurname ' +
        'FROM bills ' +
        'LEFT JOIN coaches ON bills.coachId = coaches.id ' +
        'WHERE bills.clientId = ? ' +  
        'ORDER BY bills.billDate DESC',
        [id], 
        function (err, rows, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });

    for (const bill of bills) {
      bill.billDate = formatDate(bill.billDate);
      bill.classDate = formatDate(bill.classDate);
    }

    return bills;
  } catch (error) {
    throw error;
  }
}
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1; // Los meses van de 0 a 11, así que se suma 1
  const year = date.getFullYear();

  // Formatea la fecha como xx/xx/xxxx
  return `${year}-${month}-${day}`;
}

async function deleteUnpaidStudents() {
  try {
    const query = 'DELETE FROM students WHERE paid = 0';
    const result = await pool.query(query);
    console.log(`${result.affectedRows} estudiantes no pagados eliminados.`);
  } catch (error) {
    console.error('Error al eliminar estudiantes no pagados:', error);
  }
}

async function registerStudent(req, res) {
  const students = await getStudents();
   const fullname = req.body.name;
   const guardiansname = req.body.guardiansname;
   const password = req.body.password;;
   const phonenumber = req.body.phone;
   const mail = req.body.email;
   const address = req.body.address;
   const club = req.body.club;
   
   if (!mail || !password ) {
     return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
   }
 
   // Check if the user already exists
   const usuarioAResvisar = students.find(student => student.email === mail);
   if (usuarioAResvisar) {
     return res.status(400).send({ status: "Error", message: "El Email de usuario ya existe" });
   }
 
   const salt = await bcryptjs.genSalt();
   const hashPassword = await bcryptjs.hash(password, salt);
 
   const nuevoUsuario = {
     fullname,
     guardiansname,
     password:hashPassword,
     phonenumber,
     mail,
     address,
     club
   };
 
   // Insert the new user into the "coaches" table
   const insertQuery = `INSERT INTO students ( fullname, guardiansname, password, phone, email, address, club) VALUES ( ?, ?, ?, ?, ?, ?, ?)`;
   pool.query(insertQuery, [ nuevoUsuario.fullname,  nuevoUsuario.guardiansname, nuevoUsuario.password, nuevoUsuario.phonenumber, nuevoUsuario.mail, nuevoUsuario.address, nuevoUsuario.club], function (err, result) {
     if (err) {
     // console.error('Error en la consulta SQL:', err);
       return res.status(500).send({ status: "Error", message: "Error al agregar el nuevo usuario" });
     } else {
       return res.status(201).send({ status: "ok", message: `Usuario ${nuevoUsuario.username} agregado`, redirect: "/" });
     }
    
   });
  
 }

 function updateStudentSession(idUser, sessionId) {
  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE students SET sessionId=? WHERE id = ?',
      [sessionId, idUser],
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

async function getInProgressStudents() {
  try {
    const students = await new Promise((resolve, reject) => {
      pool.query('SELECT * ' +
        'FROM students ' +
        'WHERE students.paid = 0 AND students.sessionId IS NOT NULL '  // Agrega esta línea para filtrar solo facturas no pagadas
        , function (err, rows, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
    });
    // Iterar sobre cada factura y obtener el nombre del entrenador
  

    return students;
  } catch (error) {
    throw error;
  }
}

function updateStudentState(studentId) {

  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE students SET paid=1 WHERE id = ?',
      [studentId],
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

async function getIdbyUsername(email) {
  return new Promise((resolve, reject) => {
    pool.query('SELECT id FROM students WHERE email = ?', [email], function (err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        // Extract the 'id' property from the result and convert it to an integer
        const userId = rows.length > 0 ? parseInt(rows[0].id, 10) : null;
        resolve(userId);
      }
    });
  });
}

async function getStudentById(id) {
  try {
    const rows = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM students WHERE id = ?',
        [id],
        function (err, rows, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });

    if (rows.length === 0) {
      return null;
    }

    // Directly resolve with the first row (assumed to be the student object)
    return rows[0];
  } catch (error) {
    throw error;
  }
}

async function deleteUser(idUser) {
  try {
    const student = await getStudentById(idUser);
    if (!student) {
      console.log("Student not found with ID:", idUser);
      return { success: false, message: 'Student not found' };
    }
    //console.log(student);
    //console.log("id que llega", idUser);
    if (student.paid != 1) {
      // Delete the student if paid is false
      const result = await deleteUserBd(idUser);
      return { success: true, message: 'Student deleted successfully', result };
    } else {
      console.log("Trying to delete student but paid = 1");
      return { success: false, message: 'Cannot delete student with paid = 1' };
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, message: 'Error deleting student' };
  }
}
function deleteUserBd(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM students WHERE id = ?',
      [id],
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

async function getcoachSelected(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT studentCoach FROM students WHERE id = ?',
      [id],
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          if (result.length > 0) {
            // Extraer el valor del studentCoach del primer elemento
            const studentCoachId = result[0].studentCoach;
            resolve(studentCoachId);
          } else {
            resolve(null);
          }
        }
      }
    );
  });
}
async function getCoachClasses(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM groupClasses WHERE coachId = ?',
      [id],
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          console.log("coach classes" + result)
            resolve(result);
        }
      }
    );
  });
}

async function getClassById(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      `SELECT 
      groupClasses.*,
      coaches.username AS coachUsername,
      coaches.profilepicture AS coachProfilePicture,
      GROUP_CONCAT(DISTINCT class_days.classDay) AS classDays,
      GROUP_CONCAT(DISTINCT user_attendance.user_id) AS attendingUserIds,
      GROUP_CONCAT(DISTINCT students.fullname) AS attendingUserNames,
      GROUP_CONCAT(DISTINCT students.profilepicture) AS attendingUserProfilePictures
    FROM groupClasses
    LEFT JOIN coaches ON groupClasses.coachId = coaches.id
    LEFT JOIN class_days ON groupClasses.id = class_days.classId
    LEFT JOIN user_attendance ON groupClasses.id = user_attendance.class_id
    LEFT JOIN students ON user_attendance.user_id = students.id
    WHERE groupClasses.id = ?
    GROUP BY groupClasses.id;`,
      [id],
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          
         // console.log("coach classes", result);
          resolve(result);
        }
      }
    );
  });
}
async function logUserAttendance(classId, studentId) {
  return new Promise((resolve, reject) => {
    // Check if the user attends the class
    pool.query(
      'SELECT * FROM user_attendance WHERE user_id = ? AND class_id = ?',
      [studentId, classId],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          if (result.length === 0) {
            // User doesn't attend the class
            resolve({ attendsClass: false });
          } else {
            // User attends the class
            const attendanceInfo = {
              attendsClass: true,
              attendanceDays: result.map(entry => entry.day_of_week),
            };
            //console.log("info de attendance", attendanceInfo)
            resolve(attendanceInfo);
          }
        }
      }
    );
  });
}
async function updateStudentsCoach(req, res) {
  const students = await getStudents();
  const studentId = revisarCookie2(req, students, "id");
  const coachId = req.body.coachId;
    try {
      const result = await updateStudentsCoachDB(coachId, studentId);
      res.json({ success: true, message: 'student updated successfully', result });
    } catch (error) {
      console.error('Error updating coach:', error);
      res.status(500).json({ success: false, message: 'Error updating coach' });
    }
 
}

async function joinClass (req, res) { 
  const students = await getStudents();
  const studentId = revisarCookie2(req, students, "id");
  const data = req;
  try {
    const result = await joinClassDb(studentId, data);
    res.json({ success: true, message: 'class join success', result });
  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ success: false, message: 'Error updating coach' });
  }
}
async function leaveClass (req, res) { 
  const students = await getStudents();
  const studentId = revisarCookie2(req, students, "id");
  const data = req;
  try {
    const result = await leaveClassDb(studentId, data);
    res.json({ success: true, message: 'class join success', result });
  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ success: false, message: 'Error updating coach' });
  }
}

function joinClassDb(studentId, data) {
  const valoresUpdate = data.body;
  const daysOfWeek = valoresUpdate.days;

  // Verifica que haya días especificados
  if (!daysOfWeek || daysOfWeek.length === 0) {
    return Promise.reject("No days specified for attendance");
  }
  return new Promise((resolve, reject) => {
    const updateQueries = daysOfWeek.map((day) => {
      return new Promise((innerResolve, innerReject) => {
        pool.query(
          'INSERT INTO user_attendance (user_id, class_id, day_of_week) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), class_id = VALUES(class_id)',
          [studentId, valoresUpdate.classId, day],
          function (err, result) {
            if (err) {
              innerReject(err);
            } else {
              innerResolve(result);
            }
          }
        );
      });
    });

    // Espera a que todas las actualizaciones en user_attendance se completen
    Promise.all(updateQueries)
      .then(() => {
        // Verifica que el número de asistentes no supere la capacidad
        pool.query(
          'SELECT attending, capacity FROM groupClasses WHERE id = ?',
          [valoresUpdate.classId],
          (selectErr, selectResult) => {
            if (selectErr) {
              reject(selectErr);
              return;
            }
            const attending = selectResult[0].attending;
            const capacity = selectResult[0].capacity;
            if (attending <= capacity) {
              // Actualiza el campo attending en groupClasses
              pool.query(
                'UPDATE groupClasses SET attending = attending + 1 WHERE id = ?',
                [valoresUpdate.classId],
                function (updateErr, updateResult) {
                  if (updateErr) {
                    reject(updateErr);
                  } else {
                    resolve("Attendance updated successfully");
                  }
                }
              );
            } else {
              // Elimina los registros recientemente agregados en user_attendance
              const deleteQuery = 'DELETE FROM user_attendance WHERE user_id = ? AND class_id = ?';
              const deleteValues = [studentId, valoresUpdate.classId];

              pool.query(deleteQuery, deleteValues, function (deleteErr, deleteResult) {
                if (deleteErr) {
                  reject(deleteErr);
                } else {
                  reject("Class capacity reached. Cannot add more attendees.");
                }
              });
            }
          }
        );
      })
      .catch((err) => {
        reject(err);
      });
  });
}
function leaveClassDb(studentId, data) {
  const valoresUpdate = data.body;
  const classId = valoresUpdate.classId;

  return new Promise((resolve, reject) => {
    // Elimina todas las entradas de user_attendance para el usuario y la clase específica
    pool.query(
      'DELETE FROM user_attendance WHERE user_id = ? AND class_id = ?',
      [studentId, classId],
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          // Actualiza el campo attending en groupClasses restando 1
          pool.query(
            'UPDATE groupClasses SET attending = attending - 1 WHERE id = ?',
            [classId],
            function (err, result) {
              if (err) {
                reject(err);
              } else {
                resolve("User left class successfully");
              }
            }
          );
        }
      }
    );
  });
}

async function updateStudentsCoachDB(idCoach, idUser){
  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE students SET studentCoach = ? WHERE id = ?',
      [idCoach, idUser],
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
          
        }
      }
    );
  });
}

async function updateStudent(req, res) {
  const students = await getStudents();

  // Sacar el id del estudiante logeado
  const studentId = revisarCookie2(req, students, "id");
  //console.log("Este es el ID del estudiante en la función updateStudent:", studentId);
  const data = req;
  try {
    const result = await updateStudentInDatabase(studentId, data);
    res.json({ success: true, message: 'Student updated successfully', result });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Error updating student' });
  }
}

function updateStudentInDatabase(studentId, data) {
  const valoresUpdate = data.body;
  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE students SET guardiansname = ?, email = ?, phone = ?, address = ?, birthdate = ?, club = ? WHERE id = ?',
      [
        valoresUpdate.guardiansname,
        valoresUpdate.email,
        valoresUpdate.phone,
        valoresUpdate.address,
        valoresUpdate.birthdate,
        valoresUpdate.club,
        studentId
      ],
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}
const host = "https://polonsky.relied.cloud/";
async function updateStudentImage(req, res) {
  try {

   // console.log('Req.File:', req.file);
    const extname = req.file ? path.extname(req.file.filename) : '';
    const imagenRuta = req.file ? `${host}/imagenesStudents/${req.file.filename}` : '';
   // console.log('Imagen Ruta:', imagenRuta);
    const students = await getStudents();
    const studentId = revisarCookie2(req, students, "id");
    const result = await pool.query(
      'UPDATE students SET profilepicture = ? WHERE id = ?',
      [imagenRuta ,studentId]
    );
   // console.log('Update Result:', result);
    res.json({ success: true, message: 'Image updated successfully' });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ success: false, message: 'Error updating image' });
  }
}

 export {registerStudent, updateStudentSession, getInProgressStudents, updateStudentState, getIdbyUsername, getStudentById, deleteUser,
   deleteUnpaidStudents, getStudents, getcoachSelected, updateStudentsCoach, getBillById, updateStudent, updateStudentImage, getCoachClasses, getClassById, logUserAttendance, joinClass, leaveClass}