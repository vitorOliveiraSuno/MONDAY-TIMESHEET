const router = require('express').Router();
const { authenticationMiddleware } = require('../middlewares/authentication');
const transformControler = require('../controllers/transform-controler');

router.post('/monday/atualizacao', authenticationMiddleware, transformControler.atualizacao);


module.exports = router;
