var s3 = require('s3');

module.exports = s3.createClient({
  maxAsyncS3: 20,     // this is the default 
  s3RetryCount: 3,    // this is the default 
  s3RetryDelay: 1000, // this is the default 
  multipartUploadThreshold: 20971520, // this is the default (20 MB) 
  multipartUploadSize: 15728640,      // this is the default (15 MB) 
  s3Options: {
    accessKeyId: "AKIAJP4IYLWV7NJKOZAQ",
    secretAccessKey: "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",
  }
});