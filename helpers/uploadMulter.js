import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log("Estoy en destination");
      cb(null, 'public/imagenesCoaches'); // La carpeta donde se guardarán las imágenes públicas
    },
    filename: function (req, file, cb) {
      const extname = path.extname(file.originalname);
      const filename = `${Date.now()}${extname}`;
      console.log("Estoy en filename");
      cb(null, filename);
    },
  });
  
    // Define una función para filtrar archivos de imagen
    const fileFilter = (req, file, cb) => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']; // Agrega las extensiones permitidas aquí
      const extname = path.extname(file.originalname).toLowerCase();
  
      if (allowedExtensions.includes(extname)) {
        cb(null, true); // Acepta el archivo
      } else {
        cb(new Error('Solo se permiten archivos de imagen con extensiones .jpg, .jpeg, .png o .gif'), false); // Rechaza el archivo
      }
    }
  
  
  
  
  export const upload = multer({ storage, fileFilter });