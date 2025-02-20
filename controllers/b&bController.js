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

const storeInterestedUser = (req, res) => {

  const { nome, cognome, data_di_nascita, numero_telefono, immagine_profilo } = req.body

  if (!nome || !cognome || !data_di_nascita || !numero_telefono) {
    return res.status(400).json({ error: "Tutti i campi sono necessari" });
  }

  const sql = 'INSERT INTO interested_users (nome, cognome, data_di_nascita, numero_telefono, immagine_profilo) VALUES (?, ?, ?, ?, ?)'

  connection.query(sql, [nome, cognome, data_di_nascita, numero_telefono, immagine_profilo], (err, results) => {
    if (err) return res.status(500).json({ error: err })

    res.json({
      message: 'Utente interessato registrato con successo'
    });
  })
}

const storeReviews = (req, res) => {
  const id = req.params.id

  const { voto, descrizione, interested_users_id } = req.body;

  if (!voto || !descrizione || !interested_users_id) {
    return res.status(400).json({ error: 'Tutti i campi sono necessari' });
  }

  const sql = 'INSERT INTO reviews (voto, descrizione, real_estate_id, interested_users_id) VALUES (?, ?, ?, ?)'

  connection.query(sql, [voto, descrizione, id, interested_users_id], (err, results) => {
    if (err) return res.status(500).json({ error: err })

    res.json({
      message: 'Recensione aggiunta con successo'
    });
  })

}

const update = (req, res) => {
  res.send('Modifico un immobile')
}

const modify = (req, res) => {
  const id = req.params.id

  const sql = `UPDATE real_estate SET mi_piace = mi_piace + 1 WHERE real_estate.id = ?`

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
  storeReviews,
  storeInterestedUser,
  update,
  modify,
  destroy
}