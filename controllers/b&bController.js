const connection = require('../data/db')
const path = require('path')
const fs = require('fs');


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
  const { titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, luogo, prezzo_notte, proprietary_users_id } = req.body;
  if (!titolo || !descrizione || !numero_stanze || !numero_letti || !numero_bagni || !metri_quadri || !indirizzo_completo || !email || !tipologia || !luogo || !prezzo_notte || !proprietary_users_id) {
    return res.status(400).send('Campi obbligatori');
  }
  const sql = `
    INSERT INTO real_estate 
    (titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, luogo, prezzo_notte, proprietary_users_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  connection.query(sql, [titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, luogo, prezzo_notte, proprietary_users_id], (err, results) => {
    if (err) return res.status(500).send({ error: err.message });
    res.status(201).send('Immobile creato');
  })
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

const storeProprietaryUser = (req, res) => {

  const { nome, cognome, data_di_nascita, numero_telefono, lingue_parlate, immagine_profilo } = req.body

  if (!nome || !cognome || !data_di_nascita || !numero_telefono || !lingue_parlate) {
    return res.status(400).json({ error: "Tutti i campi sono necessari" });
  }

  const sql = 'INSERT INTO proprietary_users (nome, cognome, data_di_nascita, numero_telefono, lingue_parlate, immagine_profilo) VALUES (?, ?, ?, ?, ?, ?)'

  connection.query(sql, [nome, cognome, data_di_nascita, numero_telefono, lingue_parlate, immagine_profilo], (err, results) => {
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
  const id = req.params.id

  const { titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, luogo, prezzo_notte } = req.body;

  const sql = `UPDATE real_estate 
  SET titolo = ?, 
  descrizione = ?, 
  numero_stanze = ?, 
  numero_letti = ?, 
  numero_bagni = ?, 
  metri_quadri = ?, 
  indirizzo_completo = ?, 
  email = ?, 
  tipologia = ?, 
  luogo = ?, 
  prezzo_notte = ? 
  WHERE real_estate.id = ?
  `

  connection.query(sql, [titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, luogo, prezzo_notte, id], (err, results) => {
    if (err) return res.status(500).json({ error: err })

    res.json({ message: `Le informazioni dell'immobile sono state modificate` })
  })

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

  const id = req.params.id;

  const selectSql = 'SELECT * FROM images WHERE images.real_estate_id = ?'

  const sqlDelete =
    `DELETE FROM real_estate 
  JOIN images ON real_estate.id = images.real_estate_id
  WHERE real_estate.id = ?`

  connection.query(selectSql, [id], (err, results) => {
    const imageName = results.forEach(image => {
      return image.url
    })
    const imagePath = path.join(__dirname, '../public/img/immobili', imageName)

    fs.unlink(imagePath, (err) => {
      console.log(err);
    })

    connection.query(sqlDelete, [id], (err) => {
      if (err) return res.status(500).json({ error: "Non è stato possibile eliminare l'immobile" })
      res.json({ message: 'Immobile eliminato con successo' })
    })

    res.sendStatus(204)
  })
}


module.exports = {
  index,
  show,
  store,
  storeReviews,
  storeInterestedUser,
  storeProprietaryUser,
  update,
  modify,
  destroy
}