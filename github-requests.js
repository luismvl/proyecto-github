const axios = require('axios');
require('dotenv').config();

const fetchData = async (url, headers) => {
  let config = {
    headers: {
      Authorization: 'token ' + process.env.API_TOKEN,
    },
  };
  if (headers) {
    config.headers = {
      ...config.headers,
      ...headers,
    };
  }
  const response = await axios.get(url, config);
  return response.data;
};

exports.fetchRepos = async (user) => {
  const url = `https://api.github.com/users/${user}/repos`;
  try {
    const repos = await fetchData(url);
    return repos;
  } catch (error) {
    // No se encontro repositorio
    if (error.response && error.response.status === 404) {
      return error.response.data.message;
    }

    console.error(error);
  }
};

exports.fetchCommits = async (url) => {
  try {
    const commits = await fetchData(url);
    return commits.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      authorName: c.commit.author.name,
      date: c.commit.author.date,
    }));
  } catch (error) {
    // Repositorio vacio
    if (error.response && error.response.status === 409) {
      return error.response.data.message;
    }
    console.error(error);
  }
};

exports.fetchContents = async (url) => {
  try {
    const response = await fetchData(url, {
      Accept: 'application/vnd.github.VERSION.raw',
    });
    return response;
  } catch (error) {
    //No se encontro el fichero
    if (error.response && error.response.status === 404) {
      return error.response.data.message;
    }
    console.error(error);
  }
};
