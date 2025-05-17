// ARCHIVO PARA TRABAJAR CON FUNCIONES ANTES DE INCORPORARLAS EN EL CÓDIGO PRINCIPAL O SIMPLEMENTE PARA MODIFICAR LAS FUNCIONES QUE YA EXISTEN SIN QUE SE VEAN AFECTADAS EN EL CÓDIGO PRINCIPAL

/**
 * const { spawn } = require('child_process');

  // Supongamos que tienes un ejecutable Java (por ejemplo, un archivo JAR)
  const javaProcess = spawn('java', ['-jar', 'miAplicacion.jar', 'dato1', 'dato2']);

  // Capturamos la salida estándar del proceso Java
  javaProcess.stdout.on('data', (data) => {
    console.log(Salida de Java: ${data})
  });

  // Capturamos la salida de error en caso de problemas
  javaProcess.stderr.on('data', (data) => {
    console.error(Error: ${data});
  });

  // Detectamos cuando el proceso termina
  javaProcess.on('close', (code) => {
    console.log(Proceso Java finalizado con código: ${code});
  });
 */