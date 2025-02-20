const connection = require('../data/db')
const path = require('path')


const index = (req, res) => {
  const sql = `SELECT real_estate.*, 
  GROUP_CONCAT(images.url ORDER BY images.id) AS image_urls
  FROM real_estate
  LEFT JOIN images ON images.real_estate_id = real_estate.id
  GROUP BY real_estate.id;`

  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Richiesta al database fallita' })

    const immobili = results.map(result => {

      const newImages = result.image_urls ? result.image_urls.split(',') : []

      return { ...result, image_urls: newImages }
    })
    res.json(immobili)
  })
}

const show = (req, res) => {
  const id = req.params.id;

  const sql = `SELECT I.*, ROUND(AVG(R.voto)) AS media_voti
  FROM real_estate I
  LEFT JOIN reviews R ON I.id = R.real_estate_id
  WHERE I.id = ?
  GROUP BY I.id`

  const sqlImage = `SELECT images.url FROM images WHERE real_estate_id = ?`

  const sqlReviews = `SELECT * FROM reviews WHERE real_estate_id = ?`

  connection.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0) return res.status(404).json({ error: 'Immobile non trovato' })

    const real_estate = results[0];

    connection.query(sqlImage, [id], (err, resultsImg) => {
      if (err) return res.status(500).json({ error: err.message })

      const correctedImage = resultsImg;


      connection.query(sqlReviews, [id], (err, resultsReviews) => {
        if (err) return res.status(500).json({ error: err.message })
        real_estate.reviews = resultsReviews.length > 0 ? resultsReviews : [];
        res.json({
          ...real_estate,
          image_urls: correctedImage
        })
      })
    })

  })
}

const store = (req, res) => {
  res.send('Aggiungo un immobile')
}

const update = (req, res) => {
  res.send('Modifico un immobile')
}

const modify = (req, res) => {
  res.send('Modifico un immobile')
}

const destroy = (req, res) => {
  res.send('Cancello un immobile')
}

module.exports = {
  index,
  show,
  store,
  update,
  modify,
  destroy
}