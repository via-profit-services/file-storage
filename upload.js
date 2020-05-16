/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const port = 4000;
const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiZWU3ZGI5NGQtNzEyOC00ZDY5LTgxNjMtM2ZiNTg3NmYxZWIyIiwicm9sZXMiOlsiZGV2ZWxvcGVyIl0sInR5cGUiOiJhY2Nlc3MiLCJpZCI6Ijc0MmI0ODc1LWM5ZWYtNDQ4YS1iZTI5LTg4OTNiM2ZlMjdiZCIsImV4cCI6MTU5MjEyMzUyNSwiaXNzIjoidmlhcHJvZml0LXNlcnZpY2VzIiwiaWF0IjoxNTg5NTMxNTI1fQ.DAPU5CAMtQ5NTM0IyxEerAErf7C22lGAKTvufkmOCyeMgPkbEDflmdW7g3ep1zFKKRvSoDMYCOvnCgvZkq7I5sLNHF2xJTg94W0byudv-N6fWX6dAeqQlWEaVYzWr0avBvBTywOXPIcYb_wgXqHeMzpwZLQE8aPRHCEMzDmNWMw8l9sSeuihR43POtcnenYX1hWtfVRNpsAwY1nXp58bZnLl7zLC6V7vGX0VIJ3PBFJTCU6Qy21M6A0eUtoixk1--txwQjyT6NnfCkUE1mYjvTeMXYLc0oOY4HBz8M8SA50ARHFtNNkh7UMr0WRgv1rusL4KQPVMTN3C80XzSUd_cbTD8yp1MuN1uJr1R5KFZo_tTZ5X3NtTNbMROPjyQ358ogKrSpneGFBzXRHPOs-6OvhsTGPekmy-NKxuaetrWbe7i5m9LW5sVcG0oNVl7U7kXt0YCBQRdcz6kp-lWu-yslMw9qm8sAhB-WfINhKkwQj34hdDAylKTIp7oP2AAJLLR4DrYWpwPuBc4v_Vt7gN7l-hBfdpzgFcxSQnEJe7LV2OQ7cEj7Wl-20ienP_U6znL2u2a4ea8ENtCl8680azCaplPUw5KW9H8lksXdZ4tgGmUwzKVahMJsf91LAJFGTND_sEZF1xYALTqVx5tlNHGIz5O8Gy48_W7z1SMYvp36g';

const filesList = [
  './assets/test-files/image-1.png',
  './assets/test-files/image-2.jpg',
  './assets/test-files/spreadsheet-1.xlsx',
  './assets/test-files/spreadsheet-2.xls',
  './assets/test-files/simple-text.txt',
];


const operations = JSON.stringify({
  query: /* GraphQL */`mutation ($files: [FileUpload!]!, $info: [FileUploadInfo!]!) {
    fileStorage{
      upload(files: $files info: $info) {
        id
        url
      }
    }
  }`,
  variables: {
    files: [
      null,
      null,
      null,
      null,
      null,
    ],
    info: [
      {
        owner: '7cbf5ac1-b5f6-4689-9d10-78c9722a30e3',
        category: 'avatar',
        description: 'Personal avatar',
        metaData: {
          alt: 'My avatar',
        },
      },
      {
        owner: '7cbf5ac1-b5f6-4689-9d10-78c9722a30e3',
        category: 'photos',
        description: 'Just my photo',
        metaData: {
          alt: 'Cactus',
        },
      },
      {
        owner: '7cbf5ac1-b5f6-4689-9d10-78c9722a30e3',
        category: 'spreadsheets',
        description: 'Spreadsheet of working hours',
      },
      {
        owner: '7cbf5ac1-b5f6-4689-9d10-78c9722a30e3',
        category: 'spreadsheets',
        description: 'Price list',
      },
      {
        owner: '7cbf5ac1-b5f6-4689-9d10-78c9722a30e3',
        category: 'other',
        description: 'Simple  file',
      },
    ],
  },
});


const formData = new FormData();

// operations first!
formData.append('operations', operations);

// combine map
const map = {};
filesList.forEach((file, index) => {
  map[index] = [`variables.files.${index}`];
});
formData.append('map', JSON.stringify(map));

// put the files at the last!
filesList.forEach((filename, index) => {
  formData.append(index, fs.createReadStream(path.resolve(filename)));
});

try {
  formData.submit({
    host: 'localhost',
    port,
    path: '/graphql',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }, (error, response) => {
    if (error) {
      console.log(error);
      return;
    }

    let body = '';
    response.on('data', (chunk) => {
      body += chunk;
    });
    response.on('end', () => {
      const parsedBody = JSON.parse(body);
      console.log(parsedBody.data.fileStorage.upload);
    });
  });
} catch (err) {
  console.log('Error', err);
}
