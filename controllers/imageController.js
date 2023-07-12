const jdenticon = require('jdenticon');

exports.getImage = async (req, res, next) => {
  try {
    const size = 300;
    const value = req.params.imageName.replace(/\.[^.$]+$/, '');
    const png = jdenticon.toPng(value, size);
    res.contentType('image/jpeg');
    res.status(200).send(png);
  } catch (error) {
    next(error);
  }
};
