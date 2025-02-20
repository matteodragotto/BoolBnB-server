const express = require('express')
const cors = require('cors')
const port = process.env.port || 3002
const bnbRouter = require('./router/b&b')
const errorsHandler = require('./middlewares/errorsHandler')
const notFound = require('./middlewares/notFound')
const setImagePath = require('./middlewares/imagePath')

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))

app.use(express.static('public'))

app.use(express.json())

app.use(setImagePath)

app.get('/', (req, res) => {
  res.send('Server di BoolB&B')
})

app.use('/immobili', bnbRouter)

app.use(errorsHandler)

app.use(notFound)

app.listen(port, () => {
  console.log(`Sono in ascolto sulla porta ${port}`);
})