const { fetchContents } = require("./github-requests");

/* 
  Procesa todos los ficheros del repositorio.
  Retorna la cantidad de líneas de cada fichero 
  y cuántos ficheros hay de cada tipo (extensión)

  Retorna un objeto con el formato
  {
    filesExts: { ext: number },
    files: [
      { path: file_path, lines: number }, ...
    ],
  }
 */
exports.getFilesData = async (files) => {
  if (!Array.isArray(files)) return null;

  let extensionsCounter = {};
  let linesCounter = [];

  await Promise.all(
    files.map(async (file) => {
      // Caso en que es un fihero
      if (file.type === "file") {
        //Registra la extension
        const extension = file.name.match(/\.\w+$/);
        // Si ya se registro la extension, suma 1 al contador
        if (extensionsCounter[extension]) {
          extensionsCounter[extension]++;
        } else {
          // Si aun no se habia registrado esa extension, crea su contador en 1
          extensionsCounter[extension] = 1;
        }

        // Si no se puede descargar el fichero, no calcula el número de lineas
        if (!file.download_url) {
          return;
        }

        // Calculando el número de líneas
        console.log(`Procesando fichero '${file.name}'`);
        let raw = await fetchContents(file.download_url);
        // Si un archivo es json axios lo parsea a objeto de js
        // En tal caso, lo convierto de nuevo a string
        if (typeof raw === "object") {
          raw = JSON.stringify(raw, null, "\t");
        }
        const lines = raw.split(/\n/g).length;
        linesCounter.push({
          path: file.path,
          lines,
        });
        // Caso en que es una carpeta
      } else if (file.type === "dir") {
        // Obtiene los ficheros dentro del directorio
        const filesInsideDir = await fetchContents(file.url);

        // Obteniendo la data de los ficheros dentro el directorio
        const filesDataInsideDir = await this.getFilesData(filesInsideDir);
        const extCounterInsideDir = filesDataInsideDir.filesExts;
        const linesCounterInsideDir = filesDataInsideDir.files;
        // Combina las extensiones registradas dentro el directorio con las calculadas en el directorio raíz
        for (const ext in extCounterInsideDir) {
          if (extensionsCounter[ext]) {
            extensionsCounter[ext] += extCounterInsideDir[ext];
          } else {
            extensionsCounter[ext] = extCounterInsideDir[ext];
          }
        }

        // Une las líneas calculadas de los ficheros dentro del directorio con las calculadas en el directorio raíz
        linesCounter = [...linesCounter, ...linesCounterInsideDir];
      }
    })
  );

  return {
    filesExts: extensionsCounter,
    files: linesCounter,
  };
};
