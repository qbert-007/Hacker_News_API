const express = require('express')
const app = express()
app.use(express.json());

app.use('/', require('./routes/route'))

app.listen(3000, ()=>{
    console.log('App started at port 3000')
})

