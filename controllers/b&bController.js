const connection = require('../data/db')


const index = (req, res) => {
  const sql = `SELECT real_estate.*, 
  GROUP_CONCAT(images.url ORDER BY images.id) AS image_urls
  FROM real_estate
  LEFT JOIN images ON images.real_estate_id = real_estate.id
  GROUP BY real_estate.id;`

  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err })

    const immobili = results.map(result => {

      const newImages = result.image_urls ? result.image_urls.split(',') : []

      return { ...result, image_urls: newImages }
    })
    res.json(immobili)
  })
}

const show = (req, res) => {
  res.send('Mostra il dettaglio immobile')
}

const store = (req, res) => {
  res.send('Aggiungo un immobile')
}

const update = (req, res) => {
  res.send('Modifico un immobile')
}

const modify = (req, res) => {
  const id = req.params.id

  const sql = `UPDATE real_estate SET mi_piace = mi_piace + 1 WHERE real_estate_id = ?`

  connection.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err })

    res.json({ message: 'Il numero dei like è aumentato di 1' })
  })

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