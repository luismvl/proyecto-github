const { fetchContents } = require('./github-requests');

exports.getFilesData = async (files) => {
  if (!Array.isArray(files)) return null;

  let extensionsCounter = {};
  let linesCounter = [];
  for (const file of files) {
    if (file.type === 'file') {
      //Registra la extension
      const extension = file.name.match(/\.\w+$/);
      // Si ya se registro la extension, suma 1 al contador
      if (extensionsCounter[extension]) {
        extensionsCounter[extension]++;
      } else {
        // Si aun no se habia registrado esa extension, crea su contador en 1
        extensionsCounter[extension] = 1;
      }

      // Si no se puede descargar el archivo, no calcula el nro de lineas
      if (!file.download_url) {
        continue;
      }
      let raw = await fetchContents(file.download_url);
      console.log(`Procesando fichero '${file.name}'`);
      // Si un archivo es json axios lo parsea a objeto de js
      // En tal caso, lo convierto de nuevo a string
      if (typeof raw === 'object') {
        raw = JSON.stringify(raw);
      }
      const lines = raw.split(/\n/g).length;
      linesCounter.push({
        name: file.path,
        lines,
      });
    } else if (file.type === 'dir') {
      // Obtiene los ficheros dentro del directorio
      const filesInsideDir = await fetchContents(file.url);
      const filesData = await this.getFilesData(filesInsideDir);
      const extCounterInsideDir = filesData.filesExts;
      const linesCounterInsideDir = filesData.files;
      // Une las extensiones registradas dentro el directorio con las primeras
      for (const ext in extCounterInsideDir) {
        if (extensionsCounter[ext]) {
          extensionsCounter[ext] += extCounterInsideDir[ext];
        } else {
          extensionsCounter[ext] = extCounterInsideDir[ext];
        }
      }
      // Une los archivos del directorio al primer array
      linesCounter = [...linesCounter, ...linesCounterInsideDir];
    }
  }

  return {
    filesExts: extensionsCounter,
    files: linesCounter,
  };
};
