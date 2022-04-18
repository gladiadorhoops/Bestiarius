const express = require('express');
const app = express();
      
const port = 3080;
const projectName = "gladiadores-hoops"
const distPath = process.cwd()+`/${projectName}/dist/${projectName}`

app.use(express.json());
app.use(express.static(`${distPath}/`));


app.get('/', (request, response) => {
    response.sendFile(`${distPath}/index.html`)
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});