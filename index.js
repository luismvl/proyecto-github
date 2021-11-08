const {
  fetchRepos,
  fetchCommits,
  fetchContents,
} = require('./github-requests');
const { getFilesData } = require('./filesData');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Introduce un usuario de GitHub: ', async (user) => {
  const repos = await fetchRepos(user);

  if (!Array.isArray(repos)) {
    console.log(`\nNo se encontró el usuario '${user}'`);
    rl.close();
    return;
  }

  if (repos.length === 0) {
    console.log(`\nEl usuario '${user}' no tiene repositorios`);
    rl.close();
    return;
  }
  console.log(`Repositorios de '${user}'`);

  repos.forEach((repo, index) => {
    console.log(`${index + 1}. ${repo.name}`);
  });

  rl.question(
    '\nElige un repositorio para ver sus commits y archivos: ',
    async (repoIndex) => {
      repoIndex = Number(repoIndex);

      if (
        Number.isNaN(repoIndex) ||
        repoIndex > repos.length ||
        repoIndex < 1
      ) {
        console.log(
          '\nDebes seleccionar el repositorio indicando un número dentro del rango'
        );
        rl.close();
        return;
      }
      const repo = repos[repoIndex - 1];

      console.log(`\nRepositorio '${repo.name}'\n`);

      if (repo.size === 0) {
        console.log(`\nEl repositorio ${repo.name} está vacio`);
        rl.close();
        return;
      }

      const contents = await fetchContents(
        repo.contents_url.replace('{+path}', '')
      );

      const commits = await fetchCommits(
        repo.commits_url.replace('{/sha}', '')
      );

      const filesData = await getFilesData(contents);
      const { filesExts, files } = filesData;

      console.log('\n- Número de ficheros de cada tipo');
      let extsOutput = [];
      for (const ext in filesExts) {
        extsOutput.push(`${filesExts[ext]} ${ext}`);
      }
      console.log(extsOutput.join(', '));

      console.log('\n- Commits');
      commits.forEach((commit) => {
        console.log(`${commit.date} - ${commit.message}`);
      });

      console.log('\n- Líneas de código de cada fichero');
      files.forEach((file) => {
        console.log(
          file.name,
          '->',
          file.lines,
          file.lines === 1 ? 'línea' : 'líneas'
        );
      });

      rl.close();
    }
  );
});
