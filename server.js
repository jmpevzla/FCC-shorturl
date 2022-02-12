require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

main().catch(err => console.error(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: {
    type: Number,
    unique: true
  }
})

const Url = mongoose.model('Url', urlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async function(req, res) {
  const postUrl = req.body.url
  
  const re = /^http(s)?:\/\//

  if (!re.test(postUrl)) {
    return res.json({
      error: 'invalid url'
    })
  }

  const hostUrl = String(postUrl).replace(re, '');
  
  dns.lookup(hostUrl, {}, async (err) => {
    if (err) {
      return res.json({
        error: 'invalid url'
      })
    }

    const oldUrl = await Url.findOne({ original_url: postUrl }).exec();

    if (oldUrl) {
      return res.json({
        original_url: oldUrl.original_url,
        short_url: oldUrl.short_url
      })
    }
    
    // const maxFind = await Url.find().sort({short_url:-1}).limit(1).exec();  

    // const short_url = maxFind.length === 0 ? 1 : maxFind[0].short_url + 1;

    const url = new Url({
      original_url: postUrl,
      //short_url
    });

    try {
      const resp = await url.save()

      const dbUrl = await Url.findById(resp._id).exec()

      res.json({
        original_url: dbUrl.original_url,
        short_url: dbUrl.short_url  
      });
    } catch(err) {
      console.error(err);
      return res.json({ error: 'an error has occurred!, try again' });
    }

  });
  
});

app.get('/api/shorturl/:short_url', async function (req, res) {
  
  const id = Number(req.params.short_url)
  
  if (isNaN(id)) {
    return res.json({
      error: 'invalid short_url'
    });
  }

  const url = await Url.findOne( {short_url: id} ).exec();

  if (!url) {
    return res.json({
      error: 'invalid short_url'
    });
  }

  res.redirect(url.original_url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
