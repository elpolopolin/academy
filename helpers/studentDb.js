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
const host = "http://localhost:4000";
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
   deleteUnpaidStudents, getStudents, getcoachSelected, updateStudentsCoach, getBillById, updateStudent, updateStudentImage}