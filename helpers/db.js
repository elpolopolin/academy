import mysql from "mysql";
import revisarCookie from "./revisarCookies.js";
import dotenv from "dotenv";
import path from 'path';

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
    pool.query('SELECT * FROM bills WHERE coachId = ?', [id], function (err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

//traer bills admin
async function getAllbills() {
  try {
    const bills = await new Promise((resolve, reject) => {
      pool.query('SELECT bills.*, coaches.name AS coachName, coaches.surname AS coachSurname ' +
        'FROM bills ' +
        'INNER JOIN coaches ON bills.coachId = coaches.id ' +
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



//

export { getCoachbyId, getBillsbyId, UpdateCoach, getCoaches, getAllbills, UpdateCoachAdmin, deleteCoach, getBillById, getCoachesElement, CreateBilll, updateCoachImage };