'use strict';

var S3FS = require('s3fs'),
    crypto = require('crypto');

function S3Storage (opts) {
  if (!opts.bucket) throw new Error('bucket is required');
  if (!opts.secretAccessKey) throw new Error('secretAccessKey is required');
  if (!opts.accessKeyId) throw new Error('accessKeyId is required');
  if (!opts.region) throw new Error('region is required');
  if (!opts.dirname) throw new Error('dirname is required');
  this.options = opts;
  this.s3fs = new S3FS(opts.bucket, opts);
}

S3Storage.prototype.extensionByMime = function (file) {
   var types = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg'
   }
   return (types[file.mimetype] || 'jpg');
};

S3Storage.prototype.getExtension = function (file) {
  var extension;
  console.log('Uploaded file:');
  console.log(file);
  if (typeof this.options.useExtension !== 'undefined') {
    if (typeof this.options.useExtension === 'string') {
      extension = this.options.useExtension.replace('.', '');
      return (extension.length) ? '.' + extension : null;
    } else if (this.options.useExtension) {
      extension = this.extensionByMime(file);
      return (extension.length) ? '.' + extension : null;
    }
  }
  return extension;
};

S3Storage.prototype._handleFile = function (req, file, cb) {
  var fileName  = crypto.randomBytes(20).toString('hex');
  var extension = this.getExtension(file);
  if (extension) { fileName += extension.toLowerCase(); }
  var filePath  = this.options.dirname + '/' + fileName;
  var outStream = this.s3fs.createWriteStream(filePath);

  file.stream.pipe(outStream);

  outStream.on('error', cb);
  outStream.on('finish', function () {
    cb(null, { size: outStream.bytesWritten, key: filePath });
  });
};

S3Storage.prototype._removeFile = function (req, file, cb) {
  this.s3fs.unlink(file.key, cb);
};

module.exports = function (opts) {
  return new S3Storage(opts);
};
