# BoolBnB - Server Side

### Descrizione del Progetto

BoolBnB è una web app che permette di cercare immobili in affitto. La parte **server-side** gestisce le operazioni relative ai dati degli immobili, alla gestione delle richieste degli utenti e alla comunicazione tra il database e il client.  
I proprietari di immobili possono aggiungere le informazioni relative alle loro proprietà, mentre gli utenti interessati possono cercare e visualizzare gli immobili. Il server si occupa anche dell'invio di messaggi tra utenti e proprietari, oltre alla gestione delle recensioni e dei "cuoricini".

### Tecnologie Utilizzate

- **Node.js**  
- **Express**  
- **MySQL**

### Requisiti Tecnici

- **(RT1) Gestione dei Dati Immobili**: Il server è responsabile per l'inserimento, la modifica e la cancellazione degli immobili da parte dei proprietari.
  
- **(RT2) Gestione delle Richieste degli Utenti**: Il server gestisce le richieste di ricerca degli immobili, applicando i filtri necessari e ordinando i risultati in base ai criteri definiti.
  
- **(RT3) Comunicazione via Email**: Il server invia le richieste di informazioni dai visitatori ai proprietari degli immobili tramite email, utilizzando Nodemailer.
