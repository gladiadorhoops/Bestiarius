const express = require('express');
const app = express();
      
const port = 3080;
const angularApp = "angular-app"
const projectName = "gladiadores-hoops"
const distPath = process.cwd()+`/${angularApp}/dist/${projectName}`

app.use(express.json());
app.use(express.static(`${distPath}/`));


app.get('/', (request, response) => {
    response.sendFile(`${distPath}/index.html`)
});

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});