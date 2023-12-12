import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import mysql from "mysql";

dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'sql5.freemysqlhosting.net',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  database: 'sql5669660'
});

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

async function getBills() {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM bills', function (err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}


  /*
console.log("coaches ", coaches)
coaches.forEach(user => {
  console.log("un user: ", user.username);
}); */



async function login(req, res) {
  const coaches = await getCoaches();
  const user = req.body.username;
  const password = req.body.password;

  if (!user || !password) {
    return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
  }
  
  const usuarioAResvisar = coaches.find(coach => coach.username === user);
  if (!usuarioAResvisar) {
    return res.status(400).send({ status: "Error", message: "Error durante login name" });
    
  }
  
  // console.log("password user a revisar:", usuarioAResvisar.password)
  // console.log("pasword ingresada ", password);

  const loginCorrecto = await bcryptjs.compare(password, usuarioAResvisar.password);
  // console.log(loginCorrecto);

  if (!loginCorrecto) {
    // console.log(usuarioAResvisar.password)
    return res.status(400).send({ status: "Error", message: "Error durante login 2" });
  }

  const token = jsonwebtoken.sign(
    { username: usuarioAResvisar.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  const cookieOption = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    path: "/"
  };

  res.cookie("jwt", token, cookieOption);

  const isAdmin = coaches.find(coach => coach.admin === 1);

  // Send the success response with the redirect information
  res.send({ status: "ok", message: "Usuario loggeado", redirect: "/" });
}


async function register(req, res) {
  const coaches = await getCoaches();
  const user = req.body.user;
  const name = req.body.name;
  const surname = req.body.surname;
  const password = req.body.password;
  const phonenumber = req.body.phone;
  const mail = req.body.email;
  
  if (!user || !password ) {
    return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
  }

  // Check if the user already exists
  const usuarioAResvisar = coaches.find(coach => coach.username === user);
  if (usuarioAResvisar) {
    return res.status(400).send({ status: "Error", message: "El nombre de usuario ya existe" });
  }

  const salt = await bcryptjs.genSalt();
  const hashPassword = await bcryptjs.hash(password, salt);

  // console.log("Longitud del hash bcrypt:", hashPassword.length);
  // console.log("Longitud del hash bcrypt:", hashPassword);

  const nuevoUsuario = {
    user,
    mail,
    password: hashPassword,
    name,
    surname,
    phonenumber
  };

  // Insert the new user into the "coaches" table
  const insertQuery = `INSERT INTO coaches (username, password,  mail, name, surname, phone) VALUES (?, ?, ?, ?, ?, ?)`;
  pool.query(insertQuery, [nuevoUsuario.user, nuevoUsuario.password,  nuevoUsuario.mail, nuevoUsuario.name, nuevoUsuario.surname, nuevoUsuario.phonenumber], function (err, result) {
    if (err) {
      return res.status(500).send({ status: "Error", message: "Error al agregar el nuevo usuario" });
    } else {
      return res.status(201).send({ status: "ok", message: `Usuario ${nuevoUsuario.user} agregado`, redirect: "/" });
    }

   
  });
 
}


export const methods = {
  login,
  register
}