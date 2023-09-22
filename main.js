const jimp = require('jimp');
const QrCode = require('qrcode-reader');
const fs = require('fs');
const express = require('express');
require('express-async-errors');
const multer = require('multer');
const utils = require('util');

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/tmp');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage }).single('qrimg');
const asyncUpload = utils.promisify(upload);

app.post('/decode', async (req, res) => {
  await asyncUpload(req, res);
  if (!req.file) throw new Error('File is not uploaded');
  const value = await getDecodedString(req.file.path);
  res.json({
    success: true,
    result: value,
  });
});

app.use((err, req, res) => {
  if (err) {
    return res.json({
      success: false,
      error: err?.toString(),
    });
  }
  // next(err);
});

app.listen(3000, () => {
  console.log('Server started 🚀');
});

function getDecodedString(path) {
  return new Promise((resolve, reject) => {
    const buffer = fs.readFileSync(path);
    jimp.read(buffer, (err, image) => {
      if (err) {
        reject(err);
      }
      const qr = new QrCode();
      qr.callback = function (err, value) {
        if (err) {
          reject(err);
        }
        resolve(value.result);
        // delete the image as soon as the work has done
        fs.unlinkSync(path);
      };

      qr.decode(image.bitmap);
    });
  });
}
