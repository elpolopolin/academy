#

La academia desea desarrollar una aplicación en la cual los entrenadores puedan facturar directamente a sus clientes y los clientes puedan pagar la factura a través de la aplicación. Actualmente, tenemos y utilizamos Quickbooks Online, pero tenemos dificultades para facturar a los clientes debido a su gran cantidad. Debería haber una forma de que esta nueva aplicación esté vinculada a Quickbooks para que los pagos se procesen automáticamente. Si no es posible con Quickbooks, entonces debería estar vinculada al banco/Zelle de la academia. No estoy seguro de qué necesita estar conectado/establecido para que la aplicación acepte pagos o si eso es siquiera posible. Sería ideal que la factura creara un enlace que los clientes pudieran hacer clic, enviándolos a Stripe u otro procesador de pagos, donde pudieran ingresar su información de tarjeta de crédito o cuenta bancaria. ¡Sería genial si todo se pudiera hacer dentro de la aplicación!

Aquí están las especificaciones que nos gustaría que incluyera la aplicación:

Inicio de sesión al ingresar (usuario, contraseña y Face ID). Supongo que esto permitirá a los entrenadores configurar su perfil en la aplicación, incluyendo su nombre, dirección de correo electrónico y número de teléfono.
Crear un cliente, con campos personalizados: nombre de los padres, nombre del estudiante, dirección de correo electrónico, número de teléfono.
Crear una factura, con campos personalizados: cliente (opción desplegable), tipo de servicio prestado (opción desplegable entre clase privada, semiprivada, clase grupal), entrenador que dio la clase (opción desplegable), duración de la clase (opción desplegable entre 30 minutos, una hora, una hora y media), monto (campo de entrada), fecha de la factura (campo de entrada), número de factura (generado automáticamente en secuencia), mensaje en la factura ("¡Gracias por confiar en nosotros con el viaje de tenis tuyo o de tu hijo/a!").
Botón para enviar la factura por correo electrónico y/o número de teléfono después de crearla.
Lista de facturas enviadas que se actualiza automáticamente cuando son pagadas (esto es muy importante ya que no queremos verificar manualmente la cuenta bancaria).
Estoy haciendo algunos cambios con respecto a cómo se ve actualmente cuando enviamos una factura a través de Quickbooks Online, pero más o menos, a continuación tienes un ejemplo.
