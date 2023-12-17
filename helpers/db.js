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


async function getCoachbyId(id) {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM coaches WHERE id = ?', [id], function (err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        resolve(rows[0]);
      }
    });
  });
}

const host = "http://localhost:4000";

async function getCoachesElement(element) {
  return new Promise((resolve, reject) => {
    const query = `SELECT id, ${element} FROM coaches`;  // Corregir la consulta SQL

    pool.query(query, function (err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}


async function getBillsbyId(id) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT bills.*, students.username AS studentUsername
      FROM bills
      INNER JOIN students ON bills.clientId = students.id
      WHERE coachId = ?
      ORDER BY bills.classDate DESC`;

    pool.query(query, [id], function (err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        // Itera sobre cada factura y aplica formatDate a las fechas
        rows.forEach(bill => {
          bill.billDate = formatDate(bill.billDate);
          bill.classDate = formatDate(bill.classDate);
        });

        resolve(rows);
      }
    });
  });
}

async function getCoachStudents(id) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT students.id, students.username
      FROM students
      WHERE studentCoach = ?
      `;

    pool.query(query, [id], function (err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        // Itera sobre cada factura y aplica formatDate a las fechas
        rows.forEach(bill => {
          bill.billDate = formatDate(bill.billDate);
          bill.classDate = formatDate(bill.classDate);
        });

        resolve(rows);
      }
    });
  });
}

//traer bills admin
async function getAllbills() {
  try {
    const bills = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT bills.*, coaches.name AS coachName, coaches.surname AS coachSurname, students.username ' +
        'FROM bills ' +
        'INNER JOIN coaches ON bills.coachId = coaches.id ' +
        'INNER JOIN students ON bills.clientId = students.id ' +
        'ORDER BY bills.billDate DESC',
        function (err, rows, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });

    // Iterar sobre cada factura y obtener el nombre del entrenador
    for (const bill of bills) {
      bill.billDate = formatDate(bill.billDate);
      bill.classDate = formatDate(bill.classDate);
    }

    return bills;
  } catch (error) {
    throw error;
  }
}

async function getunpaidBills() {
  try {
    const bills = await new Promise((resolve, reject) => {
      pool.query('SELECT bills.*, coaches.name AS coachName, coaches.surname AS coachSurname ' +
        'FROM bills ' +
        'INNER JOIN coaches ON bills.coachId = coaches.id ' +
        'WHERE bills.paid = 0 ' +  // Agrega esta línea para filtrar solo facturas no pagadas
        'ORDER BY bills.billDate DESC', function (err, rows, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
    });
    // Iterar sobre cada factura y obtener el nombre del entrenador
    for (const bill of bills) {
      bill.billDate = formatDate(bill.billDate);
      bill.classDate = formatDate(bill.classDate);
    }

    return bills;
  } catch (error) {
    throw error;
  }
}

async function getInProgressBills() {
  try {
    const bills = await new Promise((resolve, reject) => {
      pool.query('SELECT bills.*, coaches.name AS coachName, coaches.surname AS coachSurname ' +
        'FROM bills ' +
        'INNER JOIN coaches ON bills.coachId = coaches.id ' +
        'WHERE bills.paid = 0 AND bills.sessionId IS NOT NULL ' +  // Agrega esta línea para filtrar solo facturas no pagadas
        'ORDER BY bills.billDate DESC', function (err, rows, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
    });
    // Iterar sobre cada factura y obtener el nombre del entrenador
    for (const bill of bills) {
      bill.billDate = formatDate(bill.billDate);
      bill.classDate = formatDate(bill.classDate);
    }

    return bills;
  } catch (error) {
    throw error;
  }
}

async function getBillsForCurrentMonth() {
  try {
    const bills = await new Promise((resolve, reject) => {
      // Obtén la fecha de inicio y fin del mes actual
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      pool.query('SELECT bills.*, coaches.name AS coachName, coaches.surname AS coachSurname ' +
        'FROM bills ' +
        'INNER JOIN coaches ON bills.coachId = coaches.id ' +
        'WHERE ' +
        'bills.billDate >= ? AND bills.billDate <= ? ' +  // Filtra por el mes actual
        'ORDER BY bills.billDate DESC', [firstDayOfMonth, lastDayOfMonth], function (err, rows, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
    });

    // Calcular el ingreso del mes (solo facturas pagas)
    let monthIncome = 0;
    bills.forEach((bill) => {
      if (bill.paid === 1) {
        monthIncome += bill.price;
      }
    });

    // Iterar sobre cada factura y obtener el nombre del entrenador
    for (const bill of bills) {
      bill.billDate = formatDate(bill.billDate);
      bill.classDate = formatDate(bill.classDate);
    }

    // Agregar el campo monthIncome a la respuesta
    const response = {
      bills,
      monthIncome,
    };

    return response;
  } catch (error) {
    throw error;
  }
}

// traer solo bill a pagar segun id
async function getBillById(id) {
  try {
    const rows = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT bills.*, coaches.name AS coachName, coaches.surname AS coachSurname ' +
        'FROM bills ' +
        'INNER JOIN coaches ON bills.coachId = coaches.id ' +
        'WHERE bills.id = ? ' +  
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

    if (rows.length === 0) {
      return null; 
    }

    const bill = rows[0];
    bill.billDate = formatDate(bill.billDate);
    bill.classDate = formatDate(bill.classDate);

    return bill;
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
//

async function getCoaches() {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM coaches', function (err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
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


// UPDATE COACH
async function UpdateCoach(req, res) {

  const coaches = await getCoaches();

  // Sacar id del coachlogged
  const coachId = revisarCookie(req, coaches, "id");
  console.log("este es el coach id update coach: ", coachId)
  const data = req;

  try {
    const result = await updateCoachInDatabase(coachId, data);
    res.json({ success: true, message: 'Coach updated successfully', result });
  } catch (error) {
    console.error('Error updating coach:', error);
    res.status(500).json({ success: false, message: 'Error updating coach' });
  }
}

function updateCoachInDatabase(coachId, data) {
  const valoresUpdate = data.body;
  
          
  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE coaches SET age = ?, mail = ?, phone = ?, description = ? WHERE id = ?',
      [valoresUpdate.age, valoresUpdate.email, valoresUpdate.phone, valoresUpdate.description, coachId],
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

async function updateCoachImage(req, res) {
  try {

    console.log('Req.File:', req.file);
    const extname = req.file ? path.extname(req.file.filename) : '';
    const imagenRuta = req.file ? `${host}/imagenesCoaches/${req.file.filename}` : '';
    console.log('Imagen Ruta:', imagenRuta);
    const coaches = await getCoaches();
    const coachId = revisarCookie(req, coaches, "id");
    const result = await pool.query(
      'UPDATE coaches SET profilepicture = ? WHERE id = ?',
      [imagenRuta ,coachId]
    );
    console.log('Update Result:', result);
    res.json({ success: true, message: 'Image updated successfully' });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ success: false, message: 'Error updating image' });
  }
}



function updateCoachInDatabaseAdmin(coachId, valoresUpdate) {
  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE coaches SET age = ?, mail = ?, phone = ?  WHERE id = ?',
      [valoresUpdate.age, valoresUpdate.email, valoresUpdate.phone, coachId],
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

async function UpdateCoachAdmin(req, res) {
  // console.log("update coaches desde admin")
  const coaches = await getCoaches();

  // Sacar id del coachlogged a ver si es admin
  const admin = revisarCookie(req, coaches, "admin");
  //console.log("es admin ",admin)

  const valoresUpdate = req.body;
  const coachId = req.body.id;
  if (admin == 1) {
    try {
      const result = await updateCoachInDatabaseAdmin(coachId, valoresUpdate);
      res.json({ success: true, message: 'Coach updated successfully', result });
    } catch (error) {
      console.error('Error updating coach:', error);
      res.status(500).json({ success: false, message: 'Error updating coach' });
    }
  } else {
    console.log("intenta updatear coaches pero no es admin")
  }


}

function updateBillState(billId) {

  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE bills SET paid=1 WHERE id = ?',
      [billId],
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

function updateBillSession(billId, sessionId) {
  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE bills SET sessionId=? WHERE id = ?',
      [sessionId, billId],
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


async function deleteCoach(req, res) {
  // console.log("update coaches desde admin")
  const coaches = await getCoaches();
  // Sacar id del coachlogged a ver si es admin
  const admin = revisarCookie(req, coaches, "admin");
  //console.log("es admin ",admin)
  const coachId = req.body.id;
  if (admin == 1) {
    try {
      const result = await deleteCoachBd(coachId);
      res.json({ success: true, message: 'Coach updated successfully', result });
    } catch (error) {
      console.error('Error updating coach:', error);
      res.status(500).json({ success: false, message: 'Error updating coach' });
    }
  } else {
    console.log("intenta deletear coaches pero no es admin")
  }
}

function deleteCoachBd(coachId) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM coaches WHERE id = ?',
      [coachId],
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


async function CreateBilll(req, res) {

  const coaches = await getCoaches();

  // Sacar id del coachlogged
  const coachId = revisarCookie(req, coaches, "id");
  console.log("este es el coach id: ", coachId)
  const data = req.body;

  try {
    const result = await CreateBillDb(coachId, data);
    res.json({ success: true, message: 'Coach updated successfully', result });
  } catch (error) {
    console.error('Error updating coach:', error);
    res.status(500).json({ success: false, message: 'Error updating coach' });
  }
}

function getRandomId() {
  return Math.floor(10000000 + Math.random() * 90000000);
}

async function CreateBillDb(coachId, data) {
  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Fecha actual en formato ISO
  let randomId;
  const bills = await getAllbills();

  // Intentar generar un randomId único
  do {
    randomId = getRandomId();
  } while (bills.some((bill) => bill.id === randomId));

  const insertQuery = `
    INSERT INTO bills (id, coachId, clientId, type, length, price, billDate, classDate, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  return new Promise((resolve, reject) => {
    pool.query(
      insertQuery,
      [randomId, coachId, data.client, data.classType, data.classLength, data.amount, currentDate, data.classDate, data.classMessage],
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

async function registerStudent(req, res) {
  const students = await getStudents();
   const fullname = req.body.name;
   const guardiansname = req.body.guardiansname;
   const username = fullname.replace(/\s+/g, '');
   const password = req.body.password;;
   const phonenumber = req.body.phone;
   const mail = req.body.email;
   
   console.log("register student", username)
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
     mail
   };
 
   // Insert the new user into the "coaches" table
   const insertQuery = `INSERT INTO students (username, fullname, guardiansname, password, phone, email) VALUES (?, ?, ?, ?, ?, ?)`;
   pool.query(insertQuery, [nuevoUsuario.username, nuevoUsuario.fullname,  nuevoUsuario.guardiansname, nuevoUsuario.password, nuevoUsuario.phonenumber, nuevoUsuario.mail], function (err, result) {
     if (err) {
     // console.error('Error en la consulta SQL:', err);
       return res.status(500).send({ status: "Error", message: "Error al agregar el nuevo usuario" });
     } else {
       return res.status(201).send({ status: "ok", message: `Usuario ${nuevoUsuario.username} agregado`, redirect: "/" });
     }
    
   });
  
 }

//

export { getInProgressBills, getCoachbyId, getBillsbyId, UpdateCoach, getCoaches, getAllbills, UpdateCoachAdmin, deleteCoach, getBillById, getCoachesElement, CreateBilll, updateBillState, updateBillSession, updateCoachImage, getunpaidBills, getBillsForCurrentMonth, getCoachStudents };