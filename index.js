
const { PDFNet } = require('@pdftron/pdfnet-node');
const express = require('express');
const port = 9000;
const fs = require('fs');
const path = require('path');

const filesPath = './files';

const mimeType = require('./modules/mimeType');

const app = express();

app.listen(port, () =>
  console.log(
    `nodejs-convert-file-server listening at http://localhost:${port}`,
  ),
);

app.get('/files', (req, res) => {
    const inputPath = path.resolve(__dirname, filesPath);
    fs.readdir(inputPath, function (err, files) {
      if (err) {
        return console.log('Não é possível lista o diretório: ' + err);
      }
      res.setHeader('Content-type', mimeType['.json']);
      res.end(JSON.stringify(files));
    });
  });

  app.get('/files/:filename', (req, res) => {
    const inputPath = path.resolve(__dirname, filesPath, req.params.filename);
    fs.readFile(inputPath, function (err, data) {
      if (err) {
        res.statusCode = 500;
        res.end(`Erro ao recuperar arquivo: ${err}.`);
      } else {
        const ext = path.parse(inputPath).ext;
        res.setHeader('Content-type', mimeType[ext] || 'text/plain');
        res.end(data);
      }
    });
  });

  app.get('/convertFromOffice',(req, res) => { 
    const {filename} = req.query;    
    const inputPath = path.resolve(__dirname, `.files/${filename}`);
    const outputPath = path.resolve(__dirname, `.files/${filename}.pdf`);

    const convertToPDF = async() => {
      const pdfdoc = await PDFNet.PDFDoc.create();
      await pdfdoc.initSecurityHandler();
      await PDFNet.Convert.toPdf(pdfdoc, inputPath);
      pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized); 
    }
    
    PDFNet.runWithCleanup(convertToPDF).then(() => {
      fs.readFile(outputPath,(err,data)=>{
        if(err){
          res.statusCode = 500;
          res.end('err');
        }
        else{
          res.setHeader('ContentType', 'application/pdf');
          res.end(data);
        }
      });
    }).catch(err => {
      res.statusCode = 500;
      res.end('err');
    });

  });

  app.get('/convert/:filename', function (req, res) {

      const filename = req.params.filename;
      let ext = path.parse(filename).ext;

      const inputPath = path.resolve(__dirname, filesPath, filename);
      const outputPath = path.resolve(__dirname, filesPath, `${filename}.pdf`);

      if (ext === '.pdf') {
        res.statusCode = 500;
        res.end(`Arquivo já é um PDF.`);
      }

      const main = async () => {
        const pdfdoc = await PDFNet.PDFDoc.create();
        await pdfdoc.initSecurityHandler();
        await PDFNet.Convert.toPdf(pdfdoc, inputPath);
        pdfdoc.save(
          `${pathname}${filename}.pdf`,
          PDFNet.SDFDoc.SaveOptions.e_linearized
        );
        ext = '.pdf';
      };

      PDFNetEndpoint(main, outputPath, res);
    });

  const PDFNetEndpoint = (main, pathname, res) => {
    PDFNet.runWithCleanup(main)
    .then(() => {
      PDFNet.shutdown();
      fs.readFile(pathname, (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          const ext = path.parse(pathname).ext;
          res.setHeader('Content-type', mimeType[ext] || 'text/plain');
          res.end(data);
        }
      });
    })
    .catch((error) => {
      res.statusCode = 500;
      res.end(error);
    });
    
};
