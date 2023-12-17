import mysql from "mysql";
import revisarCookie from "./revisarCookies.js";
import dotenv from "dotenv";
import path from 'path';
import bcryptjs from "bcryptjs";


dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'sql5.freemysqlhosting.net',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  database: 'sql5669660'
});

async function getStudents() {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM students', function (err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
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
   const username = req.body.username;
   const password = req.body.password;;
   const phonenumber = req.body.phone;
   const mail = req.body.email;
   const address = req.body.address;
   const club = req.body.club;
   
   if (!username || !password ) {
     return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
   }
 
   // Check if the user already exists
   const usuarioAResvisar = students.find(student => student.username === username);
   if (usuarioAResvisar) {
     return res.status(400).send({ status: "Error", message: "El nombre de usuario ya existe" });
   }
 
   const salt = await bcryptjs.genSalt();
   const hashPassword = await bcryptjs.hash(password, salt);
 
   const nuevoUsuario = {
     username,
     fullname,
     guardiansname,
     password:hashPassword,
     phonenumber,
     mail,
     address,
     club
   };
 
   // Insert the new user into the "coaches" table
   const insertQuery = `INSERT INTO students (username, fullname, guardiansname, password, phone, email, address, club) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
   pool.query(insertQuery, [nuevoUsuario.username, nuevoUsuario.fullname,  nuevoUsuario.guardiansname, nuevoUsuario.password, nuevoUsuario.phonenumber, nuevoUsuario.mail, nuevoUsuario.address, nuevoUsuario.club], function (err, result) {
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
      'UPDATE students SET sessionid=? WHERE id = ?',
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

async function getIdbyUsername(username) {
  return new Promise((resolve, reject) => {
    pool.query('SELECT id FROM students WHERE username = ?', [username], function (err, rows, fields) {
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

 export {registerStudent, updateStudentSession, getInProgressStudents, updateStudentState, getIdbyUsername, getStudentById, deleteUser, deleteUnpaidStudents}